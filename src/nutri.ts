export type Macros = { k: number; p: number; c: number; f: number };
export type NProfile = { age?: number; sex?: 'm' | 'f'; h?: number; w?: number; goal: 'gain' | 'loss' | 'keep'; act: number; rate: number; prefs?: string; manual?: Macros | null };
export const P0: NProfile = { goal: 'keep', act: 1.55, rate: 0.5, manual: null };
export const ACT = [1.2, 1.375, 1.55, 1.725, 1.9];
export function validate(p: NProfile): string {
  if (p.age != null && (p.age < 15 || p.age > 90)) return 'age';
  if (p.h != null && (p.h < 120 || p.h > 230)) return 'h';
  if (p.w != null && (p.w < 30 || p.w > 250)) return 'w';
  return '';
}
// Mifflin–St Jeor. Returns null when required inputs are missing (never invents values).
export function estimate(p: NProfile) {
  if (!p.age || !p.h || !p.w || !p.sex || validate(p)) return null;
  const bmr = 10 * p.w + 6.25 * p.h - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * p.act;
  const minor = p.age < 18;
  let adj = 0, floored = false;
  if (p.goal === 'loss' && !minor) adj = -Math.min(p.rate * 1100, tdee * 0.25);
  if (p.goal === 'gain') adj = Math.min(p.rate * 1100, tdee * 0.15);
  let k = tdee + adj;
  const floor = p.sex === 'm' ? 1500 : 1200;
  if (p.goal === 'loss' && !minor && k < floor) { k = floor; floored = true; adj = k - tdee; }
  k = Math.round(k / 10) * 10;
  const pr = (p.goal === 'loss' ? 2.0 : p.goal === 'gain' ? 1.8 : 1.6) * p.w;
  const f = Math.max(0.7 * p.w, (0.25 * k) / 9);
  const c = Math.max(0, (k - 4 * pr - 9 * f) / 4);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), adj: Math.round(adj), floored, minor, k, p: Math.round(pr), c: Math.round(c), f: Math.round(f) };
}
