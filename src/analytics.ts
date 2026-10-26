// Pure analytics over stored records. Missing data is never treated as zero.
export type SetR = { kg: string | number; reps: string | number; done?: boolean };
export type Ent = { exId: string; sets: SetR[]; pain?: boolean };
export type Session = { id: string; date: string; entries: Ent[]; planId?: string; dayId?: string };
export type Kind = 'week' | 'month' | '7' | '30' | '90';
export type Range = [string, string];
const num = (x: any) => +x || 0;
export const ld = (d: Date) => d.toLocaleDateString('sv');
export const dayOf = (iso: string) => ld(new Date(iso));
export const addDays = (s: string, n: number) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ld(d); };
export const diffDays = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / 864e5);
export const inR = (d: string, r: Range) => d >= r[0] && d <= r[1];
export const weekStart = (d: string) => addDays(d, -((new Date(d + 'T12:00:00').getDay() + 1) % 7)); // weeks start on Saturday (same as Plan tab)

// Current and previous period of equal elapsed length (calendar week/month are clipped at today for a fair comparison).
export function periods(kind: Kind, today: string): { cur: Range; prev: Range } {
  if (kind === 'week' || kind === 'month') {
    const a = kind === 'week' ? weekStart(today) : today.slice(0, 8) + '01';
    const pa = kind === 'week' ? addDays(a, -7) : ld(new Date(+a.slice(0, 4), +a.slice(5, 7) - 2, 1, 12));
    const len = diffDays(a, today) + 1;
    let pe = addDays(pa, len - 1);
    if (kind === 'month') { const last = addDays(a, -1); if (pe > last) pe = last; }
    return { cur: [a, today], prev: [pa, pe] };
  }
  const n = +kind;
  return { cur: [addDays(today, -(n - 1)), today], prev: [addDays(today, -(2 * n - 1)), addDays(today, -n)] };
}
export const setVol = (s: SetR) => (s.done === false ? 0 : num(s.kg) * num(s.reps));
export const sessVol = (s: Session) => s.entries.reduce((a, e) => a + e.sets.reduce((b, r) => b + setVol(r), 0), 0);
export const inRange = (ss: Session[], r: Range) => ss.filter((s) => inR(dayOf(s.date), r));
export const volume = (ss: Session[]) => ss.reduce((a, s) => a + sessVol(s), 0);

export type Macros = { k: number; p: number; c: number; f: number };
export function dailyNutrition(logs: any[]): Record<string, Macros> {
  const out: Record<string, Macros> = {};
  logs.forEach((l) => { if (!l.entries?.length) return; out[l.date] = l.entries.reduce((a: Macros, e: any) => ({ k: a.k + (e.per.k * e.g) / 100, p: a.p + (e.per.p * e.g) / 100, c: a.c + (e.per.c * e.g) / 100, f: a.f + (e.per.f * e.g) / 100 }), { k: 0, p: 0, c: 0, f: 0 }); });
  return out;
}
export function nutritionAvg(daily: Record<string, Macros>, r: Range, today: string) {
  const ds = Object.keys(daily).filter((d) => inR(d, r));
  const end = r[1] < today ? r[1] : today;
  const span = Math.max(0, diffDays(r[0], end) + 1);
  if (!ds.length) return null;
  return { days: ds.length, span, k: ds.reduce((a, d) => a + daily[d].k, 0) / ds.length, p: ds.reduce((a, d) => a + daily[d].p, 0) / ds.length };
}
export function weightTrend(ws: { date: string; weightKg: number }[], r: Range) {
  const pts = ws.filter((w) => inR(w.date, r)).sort((a, b) => a.date.localeCompare(b.date));
  const avg = pts.length ? pts.reduce((a, w) => a + w.weightKg, 0) / pts.length : null;
  if (pts.length < 3 || diffDays(pts[0].date, pts[pts.length - 1].date) < 7) return { pts, avg, slope: null as number | null };
  const xs = pts.map((w) => diffDays(pts[0].date, w.date)), ys = pts.map((w) => w.weightKg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0) || 1;
  return { pts, avg, slope: (xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den) * 7 };
}
export function weekly(ss: Session[], r: Range, today: string) {
  const out: { start: string; n: number; vol: number }[] = [];
  const end = r[1] < today ? r[1] : today;
  for (let w = weekStart(r[0]); w <= end; w = addDays(w, 7)) {
    const sub = inRange(ss, [w, addDays(w, 6)]);
    out.push({ start: w, n: sub.length, vol: volume(sub) });
  }
  return out;
}
export function exerciseSeries(ss: Session[], exId: string, r: Range) {
  return inRange(ss, r).sort((a, b) => a.date.localeCompare(b.date)).flatMap((s) => {
    const e = s.entries.find((x) => x.exId === exId);
    const sets = e?.sets.filter((x) => x.done !== false && num(x.reps) > 0) ?? [];
    return sets.length ? [{ date: dayOf(s.date), top: Math.max(...sets.map((x) => num(x.kg))), reps: sets.reduce((a, x) => a + num(x.reps), 0), vol: sets.reduce((a, x) => a + setVol(x), 0) }] : [];
  });
}
// Personal record: heaviest completed set (ties: more reps). If an exercise only has bodyweight sets (0 kg), it is the most reps in one set.
export function records(ss: Session[]) {
  const best: Record<string, { kg: number; reps: number; date: string; prior: boolean }> = {};
  [...ss].sort((a, b) => a.date.localeCompare(b.date)).forEach((s) => s.entries.forEach((e) => {
    const sets = e.sets.filter((x) => x.done !== false && num(x.reps) > 0).map((x) => ({ kg: num(x.kg), reps: num(x.reps) }));
    if (!sets.length) return;
    const sb = sets.reduce((a, b) => (b.kg > a.kg || (b.kg === a.kg && b.reps > a.reps) ? b : a));
    const cur = best[e.exId];
    if (!cur) best[e.exId] = { ...sb, date: dayOf(s.date), prior: false };
    else if (sb.kg > cur.kg || (sb.kg === cur.kg && sb.reps > cur.reps)) best[e.exId] = { ...sb, date: dayOf(s.date), prior: true };
  }));
  return best;
}
export function adherence(plan: any, ss: Session[], r: Range, today: string) {
  if (!plan) return null;
  const ORDER = [6, 0, 1, 2, 3, 4, 5];
  const from = dayOf(plan.createdAt) > r[0] ? dayOf(plan.createdAt) : r[0];
  const to = r[1] < today ? r[1] : today;
  let planned = 0, completed = 0;
  for (let w = weekStart(r[0]); w <= to; w = addDays(w, 7)) {
    const sub = inRange(ss, [w, addDays(w, 6)]).filter((s) => s.planId === plan.id);
    plan.days.forEach((d: any) => {
      const date = addDays(w, ORDER.indexOf(d.weekday));
      if (date < from || date > to) return;
      planned++; if (sub.some((s) => s.dayId === d.id)) completed++;
    });
  }
  return planned ? { planned, completed } : null;
}
export function nextWorkout(plan: any, ss: Session[], today: string) {
  if (!plan) return null;
  for (let k = 0; k < 14; k++) {
    const date = addDays(today, k), wd = new Date(date + 'T12:00:00').getDay();
    const d = plan.days.find((x: any) => x.weekday === wd);
    if (!d) continue;
    const w = weekStart(date);
    if (inRange(ss, [w, addDays(w, 6)]).some((s) => s.planId === plan.id && s.dayId === d.id)) continue;
    return { day: d, date };
  }
  return null;
}

export type Insight = { key: string; id: string; ex?: string; p: Record<string, number | string>; range: Range; n: number; sug?: 'schedule' | 'recovery' | 'logging' };
export function insights(a: { ss: Session[]; plan: any; daily: Record<string, Macros>; ws: any[]; target: Macros | null }, kind: Kind, today: string): Insight[] {
  const { cur, prev } = periods(kind, today);
  const out: Insight[] = [];
  const wk = weekStart(today);
  const key = (id: string, ex = '') => `${id}:${ex}:${wk}`;
  const earliest = a.ss.map((s) => dayOf(s.date)).sort()[0];
  const c = inRange(a.ss, cur).length, p = inRange(a.ss, prev).length;
  if (earliest && earliest <= prev[0] && p >= 3 && c <= p * 0.7) out.push({ key: key('cons_down'), id: 'cons_down', p: { c, p }, range: cur, n: c + p, sug: 'schedule' });
  else if (earliest && earliest <= prev[0] && p >= 1 && c >= p * 1.3 && c - p >= 1) out.push({ key: key('cons_up'), id: 'cons_up', p: { c, p }, range: cur, n: c + p });
  const ad = adherence(a.plan, a.ss, cur, today);
  if (ad && ad.planned >= 3 && ad.completed / ad.planned <= 0.5) out.push({ key: key('missed'), id: 'missed', p: { m: ad.planned - ad.completed, d: ad.planned }, range: cur, n: ad.planned, sug: 'schedule' });
  const since: Range = [addDays(today, -59), today];
  const ids = Array.from(new Set(inRange(a.ss, since).flatMap((s) => s.entries.map((e) => e.exId))));
  ids.forEach((ex) => {
    const sr = exerciseSeries(a.ss, ex, since);
    if (sr.length < 3) return;
    const l3 = sr.slice(-3);
    if (l3[0].vol > l3[1].vol && l3[1].vol > l3[2].vol && l3[2].vol >= 0) out.push({ key: key('ex_down', ex), id: 'ex_down', ex, p: { a: Math.round(l3[0].vol), b: Math.round(l3[1].vol), c: Math.round(l3[2].vol) }, range: [l3[0].date, l3[2].date], n: 3, sug: 'recovery' });
    else {
      const f = l3[0].top > 0 ? l3[0].top : l3[0].reps, l = l3[2].top > 0 ? l3[2].top : l3[2].reps;
      if (l > f) out.push({ key: key('ex_up', ex), id: 'ex_up', ex, p: { a: f, b: l, u: l3[0].top > 0 ? 'kg' : 'reps' }, range: [l3[0].date, l3[2].date], n: 3 });
    }
  });
  const na = nutritionAvg(a.daily, cur, today);
  if (na && na.span >= 7 && na.days < na.span / 2) out.push({ key: key('log_cov'), id: 'log_cov', p: { d: na.days, n: na.span }, range: cur, n: na.days, sug: 'logging' });
  if (na && a.target && na.days >= 4) {
    const ratio = na.p / a.target.p;
    if (ratio < 0.85) out.push({ key: key('prot_low'), id: 'prot_low', p: { a: Math.round(na.p), t: a.target.p, d: na.days }, range: cur, n: na.days, sug: 'logging' });
    else if (ratio > 1.15) out.push({ key: key('prot_high'), id: 'prot_high', p: { a: Math.round(na.p), t: a.target.p, d: na.days }, range: cur, n: na.days });
  }
  const wt = weightTrend(a.ws, cur);
  if (wt.slope != null && Math.abs(wt.slope) >= 0.1) out.push({ key: key(wt.slope > 0 ? 'w_up' : 'w_down'), id: wt.slope > 0 ? 'w_up' : 'w_down', p: { s: Math.abs(+wt.slope.toFixed(2)), n: wt.pts.length }, range: [wt.pts[0].date, wt.pts[wt.pts.length - 1].date], n: wt.pts.length });
  return out;
}
