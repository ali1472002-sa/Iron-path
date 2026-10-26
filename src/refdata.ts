// Reference-data import pipeline (pure; used by the in-app importer and by scripts/import.ts).
export const normText = (s: string) => (s || '').toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640\u0300-\u036f]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const tok = (s: string) => new Set(normText(s).split(' ').filter((w) => w.length > 1));
export const jaccard = (a: string, b: string) => { const x = tok(a), y = tok(b); if (!x.size || !y.size) return 0; let i = 0; x.forEach((w) => y.has(w) && i++); return i / (x.size + y.size - i); };

export type RefFood = { id: string; ref: true; name: string; cat: string; g: number; label: string; per: { k: number; p: number; c: number; f: number; fi?: number | null }; status: 'verified' | 'approximate'; src: string; srcId?: string; license: string; prep?: string };
export type RefEx = { id: string; ref: true; name: string; muscle: string; pm: string; sm: string; eq: string; ty: string; lv: string; steps: string[]; src: string; srcId: string; license: string; cat?: string };
export type Report = { imported: number; updated: number; skipped: number; rejected: number; nearDup: number; reasons: Record<string, number> };

const catOf = (d: string) => { const s = d.toLowerCase(); return /beef|pork|lamb|poultry|chicken|turkey|sausage|meat/.test(s) ? 'meat' : /fish|seafood|shellfish/.test(s) ? 'fish' : /dairy|cheese|milk|yogurt|egg/.test(s) ? 'dairy' : /legume|bean|pea|lentil/.test(s) ? 'legumes' : /cereal|grain|pasta|rice|bread|baked|flour/.test(s) ? 'grains' : /fruit/.test(s) ? 'fruit' : /vegetable/.test(s) ? 'veg' : /nut|seed/.test(s) ? 'nuts' : /fat|oil/.test(s) ? 'oils' : /sweet|beverage|candy|sugar/.test(s) ? 'sweets' : 'other'; };
const nutrient = (f: any, nums: string[]) => { for (const k of nums) { const n = (f.foodNutrients || []).find((x: any) => String(x.nutrient?.number ?? x.number) === k && typeof x.amount === 'number'); if (n) return n.amount as number; } return null; };

// USDA FoodData Central JSON download (Foundation Foods / SR Legacy shape). Nutrient numbers: 208/957/958 energy kcal, 203 protein, 204 fat, 205 carbs, 291 fiber.
export function fromFdc(json: any): { records: RefFood[]; rejected: { id: string; reason: string }[] } {
  const list: any[] = Array.isArray(json) ? json : json?.FoundationFoods ?? json?.SRLegacyFoods ?? json?.SurveyFoods ?? json?.BrandedFoods ?? [];
  const records: RefFood[] = [], rejected: { id: string; reason: string }[] = [];
  for (const f of list) {
    const id = 'ref:usda:' + f.fdcId;
    const name = String(f.description ?? '').trim();
    const k = nutrient(f, ['208', '957', '958']), p = nutrient(f, ['203']), fa = nutrient(f, ['204']), c = nutrient(f, ['205']), fi = nutrient(f, ['291']);
    if (!f.fdcId || !name) { rejected.push({ id, reason: 'missing-id-or-name' }); continue; }
    if (k == null || p == null || fa == null || c == null) { rejected.push({ id, reason: 'missing-energy-or-macros' }); continue; }
    const r: RefFood = { id, ref: true, name, cat: catOf(f.foodCategory?.description ?? name), g: 100, label: '100 g', per: { k, p, c, f: fa, fi }, status: 'verified', src: 'USDA FoodData Central', srcId: String(f.fdcId), license: 'CC0 1.0 (public domain)', prep: /raw/i.test(name) ? 'raw' : /cook|boil|roast|bake|braise|fried|grill|steam/i.test(name) ? 'cooked' : undefined };
    const bad = validateFood(r);
    if (bad) rejected.push({ id, reason: bad }); else records.push(r);
  }
  return { records, rejected };
}
export function validateFood(r: RefFood): string {
  const { k, p, c, f, fi } = r.per;
  if (![k, p, c, f].every((x) => typeof x === 'number' && isFinite(x) && x >= 0)) return 'non-numeric-or-negative';
  if (k > 950 || p > 100 || c > 100 || f > 100) return 'out-of-range';
  if (p + c + f > 106) return 'macros-exceed-100g';
  if (fi != null && (fi < 0 || fi > c + 0.5)) return 'fiber-exceeds-carbs';
  if (Math.abs(4 * p + 4 * c + 9 * f - k) > 0.5 * k + 30) return 'energy-inconsistent';
  return '';
}
const GROUP: Record<string, string> = { chest: 'chest', lats: 'back', 'middle back': 'back', 'lower back': 'back', traps: 'back', shoulders: 'shoulders', neck: 'shoulders', biceps: 'arms', triceps: 'arms', forearms: 'arms', quadriceps: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs', abductors: 'legs', adductors: 'legs', abdominals: 'core' };
const KEY: Record<string, string> = { chest: 'pecs', lats: 'lats', 'middle back': 'upback', 'lower back': 'lowback', traps: 'traps', shoulders: 'delts', neck: 'neck', biceps: 'biceps', triceps: 'triceps', forearms: 'forearms', quadriceps: 'quads', hamstrings: 'hams', glutes: 'glutes', calves: 'calves', abductors: 'abductors', adductors: 'adductors', abdominals: 'abs' };
const EQ: Record<string, string> = { 'body only': 'bodyweight', dumbbell: 'dumbbell', barbell: 'barbell', cable: 'cable', machine: 'machine', bands: 'band', 'e-z curl bar': 'barbell', kettlebells: 'kettlebell' };
// free-exercise-db (Unlicense) exercises.json record shape.
export function fromFedb(json: any): { records: RefEx[]; rejected: { id: string; reason: string }[] } {
  const list: any[] = Array.isArray(json) ? json : json?.exercises ?? [];
  const records: RefEx[] = [], rejected: { id: string; reason: string }[] = [];
  for (const e of list) {
    const id = 'ref:fedb:' + e.id;
    const pm0 = (e.primaryMuscles ?? [])[0];
    if (!e.id || !String(e.name ?? '').trim()) { rejected.push({ id, reason: 'missing-id-or-name' }); continue; }
    if (!GROUP[pm0]) { rejected.push({ id, reason: 'unknown-primary-muscle' }); continue; }
    if (!Array.isArray(e.instructions) || !e.instructions.length) { rejected.push({ id, reason: 'no-instructions' }); continue; }
    const g = GROUP[pm0];
    const ty = e.category === 'stretching' ? 't_mob' : e.category === 'cardio' || e.category === 'plyometrics' ? 't_cond' : e.mechanic === 'isolation' ? 't_iso' : g === 'legs' ? 't_legs' : g === 'core' ? 't_core' : e.force === 'pull' ? 't_pull' : e.force === 'push' ? 't_push' : 't_iso';
    records.push({ id, ref: true, name: String(e.name).trim(), muscle: g, pm: KEY[pm0], sm: (e.secondaryMuscles ?? []).map((m: string) => KEY[m]).filter(Boolean).join(','), eq: EQ[e.equipment ?? ''] ?? 'other', ty, lv: e.level === 'beginner' ? 'b' : e.level === 'expert' ? 'a' : 'i', steps: e.instructions.map((x: string) => String(x).trim()).filter(Boolean), src: 'free-exercise-db', srcId: String(e.id), license: 'Unlicense (public domain)', cat: e.category });
  }
  return { records, rejected };
}
// Idempotent merge: same id -> update only if changed; same normalised name as an existing/bundled record -> skipped; near-duplicates are imported but counted.
export function reconcile<T extends { id: string; name: string }>(existing: Record<string, T>, knownNames: string[], incoming: T[], rejected: { id: string; reason: string }[] = []) {
  const rep: Report = { imported: 0, updated: 0, skipped: 0, rejected: rejected.length, nearDup: 0, reasons: {} };
  rejected.forEach((r) => { rep.reasons[r.reason] = (rep.reasons[r.reason] ?? 0) + 1; });
  const names = new Set(knownNames.map(normText)), byFirst = new Map<string, string[]>();
  const add = (n: string) => { names.add(n); const t = n.split(' ')[0]; byFirst.set(t, [...(byFirst.get(t) ?? []), n]); };
  names.forEach((n) => { const t = n.split(' ')[0]; byFirst.set(t, [...(byFirst.get(t) ?? []), n]); });
  const seen = new Set<string>(), put: T[] = [];
  for (const r of incoming) {
    if (seen.has(r.id)) { rep.skipped++; continue; }
    seen.add(r.id);
    const cur = existing[r.id];
    if (cur) { if (JSON.stringify(cur) === JSON.stringify(r)) rep.skipped++; else { put.push(r); rep.updated++; } continue; }
    const n = normText(r.name);
    if (names.has(n)) { rep.skipped++; rep.reasons['duplicate-name'] = (rep.reasons['duplicate-name'] ?? 0) + 1; continue; }
    if ((byFirst.get(n.split(' ')[0]) ?? []).some((o) => jaccard(o, n) >= 0.8)) rep.nearDup++;
    add(n); put.push(r); rep.imported++;
  }
  return { put, rep };
}
