// Small pure helpers for user-entered numbers and dates. Used only where a bad value could be stored (NaN, Infinity, negatives, impossible dates).
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩', FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
/** Parse a number typed by a person: accepts Arabic-Indic digits and , ٫ ، as decimal separator. Returns null for anything that is not a finite number. */
export function toNum(x: unknown): number | null {
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  if (typeof x !== 'string') return null;
  const t = x.trim().replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d))).replace(/[٫,،]/g, '.');
  if (t === '' || !/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
export const finiteIn = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
/** Strict calendar date YYYY-MM-DD (rejects 2026-02-30, 2026-13-01, "abc", "2026-1-1"). */
export function isIsoDate(s: unknown): boolean {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
/** Non-negative finite number capped at max, otherwise 0. */
export const safeNonNeg = (x: unknown, max: number): number => { const n = toNum(x); return n == null || n < 0 ? 0 : Math.min(n, max); };
export const LIMITS = { weightKg: [20, 400] as const, setKg: 1000, setReps: 1000, cups: 1000, foodPer100g: 2000, waterTarget: 50 };
