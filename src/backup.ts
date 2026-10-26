// Backup file format + validation + restore planning. Pure (no IndexedDB), so it can be tested outside the browser.
import { STORES, DB_VERSION } from './db';
export const FORMAT = 2;
export type Data = Record<string, any[]>;
const enc = new TextEncoder();
export function stable(x: any): string {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
  return '{' + Object.keys(x).sort().filter((k) => x[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(x[k])).join(',') + '}';
}
export async function checksum(data: Data): Promise<{ algo: string; value: string }> {
  const bytes = enc.encode(stable(data));
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle) { const h = new Uint8Array(await subtle.digest('SHA-256', bytes)); return { algo: 'sha256', value: Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('') }; }
  let h = 0x811c9dc5; for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return { algo: 'fnv1a', value: h.toString(16) };
}
export const countsOf = (d: Data) => Object.fromEntries(STORES.map((s) => [s, (d[s] ?? []).length])) as Record<string, number>;
export async function buildBackup(data: Data, nowIso: string, appVersion = 'web') {
  const clean: Data = Object.fromEntries(STORES.map((s) => [s, data[s] ?? []]));
  return { app: 'ironpath', format: FORMAT, version: DB_VERSION, appVersion, exportedAt: nowIso, meta: { counts: countsOf(clean), checksum: await checksum(clean) }, data: clean };
}
export const backupName = (d: Date) => { const p = (n: number) => String(n).padStart(2, '0'); return `ironpath-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`; };

// One-row sanity checks per store (shape only; unknown extra fields are kept).
export function rowIssue(store: string, r: any): string {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'not-object';
  if (typeof r.id !== 'string' || !r.id) return 'no-id';
  const id: string = r.id, str = (x: any) => typeof x === 'string' && x.length > 0;
  if (store === 'workouts') return Array.isArray(r.entries) && (id === 'draft' || (str(r.date) && !isNaN(Date.parse(r.date)))) ? '' : 'bad-session';
  if (store === 'measurements') return str(r.date) && typeof r.weightKg === 'number' && isFinite(r.weightKg) ? '' : 'bad-weight';
  if (store === 'nutrition') {
    if (id.startsWith('log:') || id.startsWith('meal:')) return Array.isArray(r.entries) ? '' : 'bad-entries';
    if (id.startsWith('food:') || id.startsWith('ref:')) return str(r.name) && r.per && typeof r.per === 'object' ? '' : 'bad-food';
    if (id === 'profile') return r.profile && typeof r.profile === 'object' ? '' : 'bad-profile';
    if (id.startsWith('water:')) return typeof r.cups === 'number' ? '' : 'bad-water';
    return '';
  }
  if (store === 'plans') {
    if (id.startsWith('plan:')) return Array.isArray(r.days) && str(r.name) ? '' : 'bad-plan';
    if (id === 'current') return Array.isArray(r.items) ? '' : 'bad-plan';
    if (id === 'activePlan') return str(r.planId) ? '' : 'bad-plan';
    return '';
  }
  if (store === 'exercises') return str(r.name) ? '' : 'bad-exercise';
  return '';
}
export type Validation = { ok: boolean; fatal: string[]; warnings: string[]; invalid: { store: string; id: string; reason: string }[]; dupes: number; unknownStores: string[]; data: Data; counts: Record<string, number>; exportedAt?: string; appVersion?: string; checksum: 'ok' | 'mismatch' | 'absent' | 'unsupported'; hasDraft: boolean };
export async function validateBackup(text: string, maxBytes = 60 * 1024 * 1024): Promise<Validation> {
  const v: Validation = { ok: false, fatal: [], warnings: [], invalid: [], dupes: 0, unknownStores: [], data: {}, counts: {}, checksum: 'absent', hasDraft: false };
  if (text.length > maxBytes) { v.fatal.push('too-big'); return v; }
  let o: any;
  try { o = JSON.parse(text); } catch { v.fatal.push('not-json'); return v; }
  if (!o || typeof o !== 'object' || o.app !== 'ironpath') { v.fatal.push('not-ironpath'); return v; }
  if (typeof o.version !== 'number' || o.version > DB_VERSION) { v.fatal.push('newer-version'); return v; }
  if (!o.data || typeof o.data !== 'object' || Array.isArray(o.data)) { v.fatal.push('no-data'); return v; }
  v.exportedAt = typeof o.exportedAt === 'string' ? o.exportedAt : undefined; v.appVersion = typeof o.appVersion === 'string' ? o.appVersion : undefined;
  v.unknownStores = Object.keys(o.data).filter((k) => !(STORES as readonly string[]).includes(k));
  for (const s of STORES) {
    const rows = o.data[s] ?? [];
    if (!Array.isArray(rows)) { v.fatal.push('store-not-array:' + s); continue; }
    const seen = new Set<string>(), keep: any[] = [];
    for (const r of rows) {
      const bad = rowIssue(s, r);
      if (bad) { v.invalid.push({ store: s, id: String(r?.id ?? '?'), reason: bad }); continue; }
      if (seen.has(r.id)) { v.dupes++; continue; }
      seen.add(r.id); keep.push(r);
    }
    v.data[s] = keep;
  }
  if (v.fatal.length) return v;
  v.counts = countsOf(v.data); v.hasDraft = (v.data.workouts ?? []).some((r) => r.id === 'draft');
  const cs = o.meta?.checksum;
  if (cs && typeof cs.value === 'string') {
    const mine = await checksum(Object.fromEntries(STORES.map((s) => [s, o.data[s] ?? []])));
    v.checksum = cs.algo !== mine.algo ? 'unsupported' : cs.value === mine.value ? 'ok' : 'mismatch';
  }
  if (v.checksum === 'mismatch') v.warnings.push('checksum-mismatch');
  if (v.checksum === 'absent') v.warnings.push('no-checksum');
  if (v.unknownStores.length) v.warnings.push('unknown-stores');
  if (v.invalid.length) v.warnings.push('invalid-rows');
  if (v.dupes) v.warnings.push('duplicate-ids');
  if (v.hasDraft) v.warnings.push('has-draft');
  if (Object.values(v.counts).every((n) => n === 0)) v.warnings.push('empty-backup');
  v.ok = true;
  return v;
}
export type Plan = { puts: Data; clearFirst: boolean; summary: Record<string, { add: number; same: number; skip: number; replace: number; remove: number }> };
// replace: wipe then write everything (one transaction). merge: add only ids that do not exist; existing records are never touched.
export function planRestore(clean: Data, existing: Record<string, string[]>, mode: 'replace' | 'merge'): Plan {
  const puts: Data = {}, summary: Plan['summary'] = {};
  for (const s of STORES) {
    const have = new Set(existing[s] ?? []), rows = clean[s] ?? [], ids = new Set(rows.map((r) => r.id));
    const add = rows.filter((r) => !have.has(r.id)).length, overlap = rows.length - add;
    puts[s] = mode === 'replace' ? rows : rows.filter((r) => !have.has(r.id));
    summary[s] = mode === 'replace' ? { add, same: 0, skip: 0, replace: overlap, remove: [...have].filter((id) => !ids.has(id)).length } : { add, same: 0, skip: overlap, replace: 0, remove: 0 };
  }
  return { puts, clearFirst: mode === 'replace', summary };
}
