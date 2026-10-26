// Pure logic for the live workout screen. All timing uses timestamps (ms since epoch) stored in the draft, so it survives reloads and suspension.
import * as A from './analytics';
export type Rest = { end?: number; left?: number; total: number; done?: boolean; bySession?: boolean };
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export const restLeft = (r: Rest | undefined, now: number) => (!r || r.done ? 0 : r.end != null ? Math.max(0, Math.ceil((r.end - now) / 1000)) : Math.ceil((r.left ?? 0) / 1000));
export const elapsedSec = (d: any, now: number) => Math.max(0, Math.floor(((d.pausedAt ?? now) - (d.startedAt ?? Date.parse(d.date)) - (d.pausedMs ?? 0)) / 1000));
export const startRest = (d: any, sec: number, now: number) => ({ ...d, rest: { end: now + sec * 1000, total: sec } });
export const pauseRest = (d: any, now: number) => (d.rest?.end == null ? d : { ...d, rest: { left: Math.max(0, d.rest.end - now), total: d.rest.total } });
export const resumeRest = (d: any, now: number) => (d.rest?.left == null ? d : { ...d, rest: { end: now + d.rest.left, total: d.rest.total } });
export const addRest = (d: any, sec: number, now: number) => (d.rest?.end != null ? { ...d, rest: { ...d.rest, end: d.rest.end + sec * 1000 } } : d.rest?.left != null ? { ...d, rest: { ...d.rest, left: d.rest.left + sec * 1000 } } : { ...d, rest: { end: now + sec * 1000, total: sec } });
export const skipRest = (d: any) => ({ ...d, rest: undefined });
export function dueRest(d: any, now: number) { const r = d.rest; return r?.end != null && r.end <= now ? { ...d, rest: { done: true, total: r.total } } : null; }
export function pauseSession(d: any, now: number) {
  if (d.pausedAt) return d;
  const froze = d.rest?.end != null, p = pauseRest(d, now);
  return { ...p, pausedAt: now, rest: froze ? { ...p.rest, bySession: true } : p.rest };
}
export function resumeSession(d: any, now: number) {
  if (!d.pausedAt) return d;
  const x = { ...d, pausedMs: (d.pausedMs ?? 0) + (now - d.pausedAt), pausedAt: undefined };
  return x.rest?.bySession ? resumeRest(x, now) : x;
}
// Idempotent: completing an already-completed set returns the same draft (no second timer, no duplicate record).
export function completeSet(d: any, ei: number, si: number, now: number) {
  const s = d.entries[ei]?.sets[si];
  if (!s || s.done || d.pausedAt) return d;
  const c = JSON.parse(JSON.stringify(d));
  c.entries[ei].sets[si].done = true; c.entries[ei].sets[si].at = now;
  if (c.autoRest !== false) { const sec = c.entries[ei].plan?.rest ?? 90; c.rest = { end: now + sec * 1000, total: sec }; }
  return c;
}
export function undoSet(d: any, ei: number, si: number) {
  if (!d.entries[ei]?.sets[si]?.done) return d;
  const c = JSON.parse(JSON.stringify(d)); c.entries[ei].sets[si].done = false; delete c.entries[ei].sets[si].at; return c;
}
export function finishSession(d: any, hist: any[], now: number, id: string) {
  // Warm-up sets (flagged by the user) are kept separately in `warmups`, so existing analytics only ever see working sets.
  const entries = d.entries.map((e: any) => ({ ...e, sets: e.sets.filter((s: any) => s.done && !s.warm), ...(e.sets.some((s: any) => s.done && s.warm) ? { warmups: e.sets.filter((s: any) => s.done && s.warm) } : {}) })).filter((e: any) => e.sets.length);
  const skipped = d.entries.filter((e: any) => !e.sets.some((s: any) => s.done && !s.warm)).map((e: any) => e.exId);
  const durationSec = elapsedSec(d, now);
  const { rest, cur, pausedAt, autoRest, ...keep } = d; void rest; void cur; void pausedAt; void autoRest;
  const session = { ...keep, id, entries, durationSec, endedAt: new Date(now).toISOString(), skipped };
  const sets = entries.flatMap((e: any) => e.sets);
  const reps = sum(sets.map((s: any) => +s.reps || 0));
  const hasLoad = sets.some((s: any) => +s.kg > 0);
  const before = A.records(hist), after = A.records([...hist, session]), day = A.dayOf(session.date);
  const prs = Object.keys(after).filter((k) => after[k].prior && after[k].date === day && (!before[k] || after[k].kg > before[k].kg || (after[k].kg === before[k].kg && after[k].reps > before[k].reps)));
  return { session, summary: { durationSec, exercises: entries.length, sets: sets.length, reps, volume: hasLoad ? Math.round(sum(sets.map((s: any) => (+s.kg || 0) * (+s.reps || 0)))) : null, skipped: skipped.length, prs } };
}
