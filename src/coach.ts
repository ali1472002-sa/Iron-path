// Rule-based training analysis (no AI). Pure functions over stored records; missing data is never treated as zero performance.
import * as A from './analytics';
export type Map = { g: string; pm?: string; sm: string[] };
export type Cfg = { inc: number; maxRpe: number; ranges: Record<string, [number, number]> };
export const GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
export const CFG0: Cfg = { inc: 2.5, maxRpe: 8.5, ranges: Object.fromEntries(GROUPS.map((g) => [g, [8, 20]])) as any };
const num = (x: any) => +x || 0;
// A working set = completed, has reps, not flagged warm-up. (Warm-ups are saved separately in entry.warmups, so older sessions are unaffected.)
export const workingSets = (e: any) => (e.sets || []).filter((s: any) => s.done !== false && !s.warm && num(s.reps) > 0);
export function dedupe(ss: any[]) {
  const seen = new Set<string>(), out: any[] = [];
  for (const s of ss) { const sig = s.date + JSON.stringify(s.entries); if (seen.has(s.id) || seen.has(sig)) continue; seen.add(s.id); seen.add(sig); out.push(s); }
  return out;
}
export const e1rm = (kg: number, reps: number) => (kg > 0 && reps >= 1 && reps <= 10 ? Math.round(kg * (1 + reps / 30) * 10) / 10 : null); // Epley ESTIMATE
export function weeklyVolume(ss: any[], mapEx: (id: string) => Map | null, r: A.Range) {
  const direct: Record<string, number> = {}, indirect: Record<string, number> = {}, grp: Record<string, number> = {}, fr: Record<string, Set<string>> = {};
  const missing = new Set<string>(), coarse = new Set<string>(); let sets = 0, sessions = 0;
  for (const s of A.inRange(dedupe(ss), r)) {
    sessions++;
    for (const e of s.entries) {
      const ws = workingSets(e); if (!ws.length) continue;
      const m = mapEx(e.exId);
      if (!m) { missing.add(e.exId); continue; }
      if (!m.pm) coarse.add(e.exId);
      sets += ws.length; grp[m.g] = (grp[m.g] ?? 0) + ws.length; (fr[m.g] ??= new Set()).add(s.id);
      if (m.pm) direct[m.pm] = (direct[m.pm] ?? 0) + ws.length;
      m.sm.forEach((k) => { indirect[k] = (indirect[k] ?? 0) + ws.length; });
    }
  }
  return { direct, indirect, grp, freq: Object.fromEntries(Object.entries(fr).map(([k, v]) => [k, v.size])), missing: [...missing], coarse: [...coarse], sets, sessions };
}
export function exerciseHistory(ss: any[], exId: string, planSets?: number) {
  return dedupe(ss).sort((a, b) => a.date.localeCompare(b.date)).flatMap((s) => {
    const e = s.entries.find((x: any) => x.exId === exId); const ws = e ? workingSets(e) : [];
    if (!ws.length) return [];
    const top = ws.reduce((a: any, b: any) => (num(b.kg) > num(a.kg) || (num(b.kg) === num(a.kg) && num(b.reps) > num(a.reps)) ? b : a));
    const rp = ws.filter((x: any) => x.rpe !== undefined && x.rpe !== '').map((x: any) => num(x.rpe));
    return [{ date: A.dayOf(s.date), top: num(top.kg), topReps: num(top.reps), workSets: ws.length, prescribed: e.plan?.sets ?? planSets ?? null, target: e.plan?.repMax ?? null,
      minReps: Math.min(...ws.map((x: any) => num(x.reps))), sameLoad: ws.every((x: any) => num(x.kg) === num(top.kg)), vol: ws.reduce((a: number, x: any) => a + num(x.kg) * num(x.reps), 0),
      reps: ws.reduce((a: number, x: any) => a + num(x.reps), 0), e1rm: e1rm(num(top.kg), num(top.reps)), rpes: rp, pain: !!e.pain }];
  });
}
export type Change = { type: 'target'; exId: string; kg: number; from: number } | { type: 'swap'; planId: string; dayId: string; from: string; to: string } | null;
export type Rec = { key: string; rule: string; ex?: string; group?: string; p: Record<string, any>; range: A.Range; n: number; change: Change; unc: string[] };
export const incFor = (kg: number, inc: number) => Math.min(inc, Math.max(1, Math.round(kg * 0.05 * 2) / 2)); // never more than ~5% (min 1 kg), capped by the user's increment
export function recommend(c: { ss: any[]; plan: any; mapEx: (id: string) => Map | null; alts: (id: string) => string[]; cfg: Cfg; today: string }): Rec[] {
  const out: Rec[] = [], wk = A.weekStart(c.today), key = (r: string, x = '') => `${r}:${x}:${wk}`;
  const ss = dedupe(c.ss), since = A.addDays(c.today, -55);
  const planItems: any[] = (c.plan?.days ?? []).flatMap((d: any) => d.items.map((i: any) => ({ ...i, dayId: d.id })));
  const ids = Array.from(new Set(A.inRange(ss, [since, c.today]).flatMap((s) => s.entries.map((e: any) => e.exId))));
  for (const ex of ids) {
    const pi = planItems.find((i) => i.exId === ex);
    const h = exerciseHistory(A.inRange(ss, [since, c.today]), ex, pi?.sets);
    if (h.length < 2) continue;
    const target = h[h.length - 1].target ?? pi?.repMax ?? null;
    const hit = (x: any) => target != null && x.top > 0 && x.sameLoad && x.workSets >= Math.max(2, x.prescribed ?? 2) && x.minReps >= target;
    const l2 = h.slice(-2), l3 = h.slice(-3), l4 = h.slice(-4), rng: A.Range = [l3[0].date, l3[l3.length - 1].date];
    const dec = (a: any[]) => a.length >= 3 && a.every((x, i) => i === 0 || x.vol < a[i - 1].vol);
    if (l2.every(hit) && l2[0].top === l2[1].top && !l2.some((x) => x.pain)) {
      const r = l2.flatMap((x) => x.rpes), avg = r.length ? r.reduce((a, b) => a + b, 0) / r.length : null;
      if (avg == null || avg <= c.cfg.maxRpe) { const kg = l2[1].top + incFor(l2[1].top, c.cfg.inc); out.push({ key: key('load_up', ex), rule: 'load_up', ex, p: { top: l2[1].top, kg, target, avg }, range: [l2[0].date, l2[1].date], n: 2, change: { type: 'target', exId: ex, kg, from: l2[1].top }, unc: ['small-sample', ...(avg == null ? ['no-effort-data'] : [])] }); continue; }
    }
    if (dec(l3)) {
      const pain = l3.some((x) => x.pain);
      out.push({ key: key('decline', ex), rule: 'decline', ex, p: { v: l3.map((x) => Math.round(x.vol)), pain }, range: rng, n: 3, change: null, unc: ['small-sample', 'cause-unknown'] });
      if (dec(l4) && pi) { const to = c.alts(ex)[0]; if (to) out.push({ key: key('substitute', ex), rule: 'substitute', ex, p: { to }, range: [l4[0].date, l4[3].date], n: 4, change: { type: 'swap', planId: c.plan.id, dayId: pi.dayId, from: ex, to }, unc: ['small-sample', 'cause-unknown'] }); }
      continue;
    }
    if (h.length >= 3 && target != null) { const hits = l3.filter(hit).length; if (hits > 0 && hits < 3) out.push({ key: key('hold', ex), rule: 'hold', ex, p: { hits, of: 3, target }, range: rng, n: 3, change: null, unc: ['small-sample'] }); }
  }
  const w1 = A.addDays(wk, -7), w2 = A.addDays(wk, -14), W: A.Range[] = [[w2, A.addDays(w2, 6)], [w1, A.addDays(w1, 6)]];
  const vols = W.map((r) => weeklyVolume(ss, c.mapEx, r));
  if (vols.every((v) => v.sessions > 0 && v.missing.length === 0)) {
    const plannedBy: Record<string, number> = {};
    planItems.forEach((i) => { const m = c.mapEx(i.exId); if (m) plannedBy[m.g] = (plannedBy[m.g] ?? 0) + i.sets; });
    const seen = Object.keys(weeklyVolume(ss, c.mapEx, [since, c.today]).grp); // only groups the user has actually logged recently; unknown is not zero
    for (const g of GROUPS) {
      if (!seen.includes(g)) continue;
      const pl = plannedBy[g] ?? 0, pf = vols.map((v) => v.grp[g] ?? 0), [lo, hi] = c.cfg.ranges[g] ?? [0, 999];
      if (pl >= 6 && pf.every((x) => x / pl < 0.6)) out.push({ key: key('volume_gap', g), rule: 'volume_gap', group: g, p: { planned: pl, w: pf }, range: [w2, A.addDays(w1, 6)], n: vols[0].sessions + vols[1].sessions, change: null, unc: ['partial-logging', 'small-sample'] });
      if (pf.every((x) => x < lo)) out.push({ key: key('below_range', g), rule: 'below_range', group: g, p: { w: pf, lo, hi }, range: [w2, A.addDays(w1, 6)], n: vols[0].sessions + vols[1].sessions, change: null, unc: ['partial-logging', 'small-sample', 'range-is-guidance'] });
      else if (pf.every((x) => x > hi)) out.push({ key: key('above_range', g), rule: 'above_range', group: g, p: { w: pf, lo, hi }, range: [w2, A.addDays(w1, 6)], n: vols[0].sessions + vols[1].sessions, change: null, unc: ['small-sample', 'range-is-guidance'] });
    }
  }
  return out;
}
export function applySwap(plan: any, ch: { dayId: string; from: string; to: string }, id: string, note: string, nowIso: string) {
  const c = JSON.parse(JSON.stringify(plan));
  c.id = id; c.createdAt = nowIso; c.name = `${plan.name} · ${note}`;
  c.days.forEach((d: any) => { if (d.id === ch.dayId) d.items.forEach((i: any) => { if (i.exId === ch.from) i.exId = ch.to; }); });
  return c;
}
