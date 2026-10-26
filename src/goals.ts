import type { Session, Macros, Range } from './analytics';
import { addDays, dayOf, diffDays, inR, inRange, volume, nextWorkout, weekStart } from './analytics';

export type Goal = { id: string; type: 'workouts' | 'muscle' | 'volume' | 'meals' | 'protein' | 'weigh'; target: number; muscle?: string };
export type GData = { ss: Session[]; daily: Record<string, Macros>; ws: { date: string; weightKg: number }[]; pTarget: number | null; mOf: (id: string) => string | undefined };
// week-start day: 0 = Sunday … 6 = Saturday
export const wStart = (d: string, wsd: number) => addDays(d, -((new Date(d + 'T12:00:00').getDay() - wsd + 7) % 7));
export const weekOf = (today: string, wsd: number, off = 0): Range => { const s = addDays(wStart(today, wsd), 7 * off); return [s, addDays(s, 6)]; };

// Unlogged meals/weights are never counted as zero intake; only logged days count. Sessions only exist if completed and saved.
export function progress(g: Goal, d: GData, r: Range) {
  const ss = inRange(d.ss, r);
  let v: number | null = 0;
  if (g.type === 'workouts') v = ss.length;
  else if (g.type === 'muscle') v = ss.filter((s) => s.entries.some((e) => e.sets.length && d.mOf(e.exId) === g.muscle)).length;
  else if (g.type === 'volume') v = Math.round(volume(ss));
  else if (g.type === 'meals') v = Object.keys(d.daily).filter((x) => inR(x, r)).length;
  else if (g.type === 'protein') v = d.pTarget ? Object.keys(d.daily).filter((x) => inR(x, r) && d.daily[x].p >= 0.9 * d.pTarget!).length : null;
  else v = new Set(d.ws.filter((w) => inR(w.date, r)).map((w) => w.date)).size;
  if (v == null) return { value: null as number | null, target: g.target, pct: 0, remaining: g.target };
  return { value: v, target: g.target, pct: Math.min(100, Math.round((v / g.target) * 100)), remaining: Math.max(0, g.target - v) };
}
const run = (weeks: Set<string>) => { let best = 0; weeks.forEach((w) => { if (weeks.has(addDays(w, -7))) return; let n = 1, x = w; while (weeks.has((x = addDays(x, 7)))) n++; best = Math.max(best, n); }); return best; };
export function firstPrDate(ss: Session[]) {
  const best: Record<string, { kg: number; reps: number }> = {};
  for (const s of [...ss].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const e of s.entries) {
      const sets = e.sets.filter((x) => x.done !== false && +x.reps > 0).map((x) => ({ kg: +x.kg || 0, reps: +x.reps }));
      if (!sets.length) continue;
      const sb = sets.reduce((a, b) => (b.kg > a.kg || (b.kg === a.kg && b.reps > a.reps) ? b : a));
      const c = best[e.exId];
      if (!c) best[e.exId] = sb;
      else if (sb.kg > c.kg || (sb.kg === c.kg && sb.reps > c.reps)) return dayOf(s.date);
    }
  }
  return null;
}
export type Ach = { key: string; value: number; target: number };
// Criteria use consistency and logging, never calorie restriction, extra volume or daily streaks.
export function achievements(d: GData & { plans: any[]; goals: Goal[]; wsd: number }, today: string): Ach[] {
  const n = d.ss.length;
  const wk = (dates: string[]) => new Set(dates.map((x) => wStart(x, d.wsd)));
  const perWeek: Record<string, number> = {};
  d.ss.forEach((s) => { const w = wStart(dayOf(s.date), d.wsd); perWeek[w] = (perWeek[w] ?? 0) + 1; });
  const cons = run(new Set(Object.keys(perWeek).filter((w) => perWeek[w] >= 2)));
  const wg = d.goals.find((g) => g.type === 'workouts');
  let firstWeek = 0;
  Object.keys(perWeek).forEach((w) => {
    if (addDays(w, 6) >= today) return;
    const sub = inRange(d.ss, [w, addDays(w, 6)]);
    if (wg && sub.length >= wg.target) firstWeek = 1;
    d.plans.forEach((p) => { if (p.days.length && p.days.every((x: any) => sub.some((s) => s.planId === p.id && s.dayId === x.id))) firstWeek = 1; });
  });
  const logged = Object.keys(d.daily).length;
  const wr = run(wk(d.ws.map((w) => w.date)));
  return [
    { key: 'first_workout', value: Math.min(n, 1), target: 1 }, { key: 'sessions_10', value: Math.min(n, 10), target: 10 },
    { key: 'sessions_25', value: Math.min(n, 25), target: 25 }, { key: 'first_week', value: firstWeek, target: 1 },
    { key: 'consistency_4w', value: Math.min(cons, 4), target: 4 }, { key: 'first_pr', value: firstPrDate(d.ss) ? 1 : 0, target: 1 },
    { key: 'log_7', value: Math.min(logged, 7), target: 7 }, { key: 'log_30', value: Math.min(logged, 30), target: 30 }, { key: 'weigh_4w', value: Math.min(wr, 4), target: 4 },
  ];
}
export const newlyUnlocked = (a: Ach[], unlocked: Record<string, any>) => a.filter((x) => x.value >= x.target && !unlocked[x.key]).map((x) => x.key);

export type RCat = { on: boolean; time: string; days: number[]; every?: number };
export type Rem = { id: 'reminders'; master: boolean; quiet: { from: string; to: string }; cats: Record<string, RCat>; seen: Record<string, number>; lastBackup?: string; waterTarget: number };
const ALL = [0, 1, 2, 3, 4, 5, 6];
export const R0: Rem = { id: 'reminders', master: false, quiet: { from: '22:00', to: '07:00' }, waterTarget: 8, seen: {},
  cats: { workout: { on: true, time: '17:00', days: ALL }, upcoming: { on: true, time: '20:00', days: ALL }, meal: { on: false, time: '13:00', days: ALL }, water: { on: false, time: '15:00', days: ALL }, review: { on: true, time: '18:00', days: [5] }, backup: { on: true, time: '19:00', days: ALL, every: 7 } } };
export const inQuiet = (hm: string, q: { from: string; to: string }) => (q.from <= q.to ? hm >= q.from && hm < q.to : hm >= q.from || hm < q.to);
// In-app reminders: shown only while the app is open. Never shown for completed actions, during quiet hours, or twice per day.
export function due(r: Rem, now: { date: string; hm: string; dow: number }, c: { plan: any; ss: Session[]; mealsToday: boolean; cups: number }) {
  if (!r.master || inQuiet(now.hm, r.quiet)) return [] as { key: string; cat: string; day?: string }[];
  const out: { key: string; cat: string; day?: string }[] = [];
  const ok = (cat: string) => { const x = r.cats[cat]; return !!x && x.on && x.days.includes(now.dow) && now.hm >= x.time && !r.seen[cat + ':' + now.date]; };
  const nx = nextWorkout(c.plan, c.ss, now.date);
  if (nx && nx.date === now.date && ok('workout')) out.push({ key: 'workout:' + now.date, cat: 'workout', day: nx.day.name.join('|') });
  if (nx && nx.date === addDays(now.date, 1) && ok('upcoming')) out.push({ key: 'upcoming:' + now.date, cat: 'upcoming', day: nx.day.name.join('|') });
  if (!c.mealsToday && ok('meal')) out.push({ key: 'meal:' + now.date, cat: 'meal' });
  if (c.cups < r.waterTarget && ok('water')) out.push({ key: 'water:' + now.date, cat: 'water' });
  if (ok('review')) out.push({ key: 'review:' + now.date, cat: 'review' });
  const b = r.cats.backup;
  if (ok('backup') && (!r.lastBackup || diffDays(r.lastBackup, now.date) >= (b.every ?? 7)) && c.ss.length) out.push({ key: 'backup:' + now.date, cat: 'backup' });
  return out;
}
export { weekStart };
