import { EXERCISES } from './exercises';
import { META } from './exerciseMeta';

export type Profile = { goal: 'hyp' | 'str' | 'fat' | 'gen'; level: 'b' | 'i' | 'a'; days: number; dur: number; equip: 'gym' | 'db' | 'band' | 'bw'; split: 'auto' | 'full' | 'ul' | 'ppl'; prio: string[]; avoid: string[] };
export type Item = { exId: string; sets: number; repMin: number; repMax: number; rest: number; unit?: string };
export type Day = { id: string; name: [string, string]; weekday: number; items: Item[] };
export type Plan = { id: string; name: string; createdAt: string; profile: Profile; days: Day[]; notes: string[] };

export const DEFAULT: Profile = { goal: 'gen', level: 'b', days: 3, dur: 45, equip: 'bw', split: 'auto', prio: [], avoid: [] };
const ALLOWED: Record<string, string[]> = { gym: ['bodyweight', 'dumbbell', 'barbell', 'bar', 'cable', 'machine', 'smith', 'band'], db: ['bodyweight', 'dumbbell'], band: ['bodyweight', 'band'], bw: ['bodyweight'] };
const RANK: Record<string, number> = { b: 0, i: 1, a: 2 };
const TYPES: Record<string, { n: [string, string]; g: string[] }> = {
  full: { n: ['جسم كامل', 'Full body'], g: ['legs', 'back', 'chest', 'shoulders', 'core', 'arms'] },
  upper: { n: ['علوي', 'Upper'], g: ['back', 'chest', 'shoulders', 'arms', 'chest', 'back'] },
  lower: { n: ['سفلي', 'Lower'], g: ['legs', 'legs', 'legs', 'core'] },
  push: { n: ['دفع', 'Push'], g: ['chest', 'shoulders', 'chest', 'shoulders'] },
  pull: { n: ['سحب', 'Pull'], g: ['back', 'back', 'arms', 'arms'] },
  legs: { n: ['أرجل', 'Legs'], g: ['legs', 'legs', 'legs', 'core'] },
};
const ORDER = ['legs', 'back', 'chest', 'shoulders', 'arms', 'core'];
const WD: Record<number, number[]> = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6] };
const COUNT: Record<number, number> = { 30: 4, 45: 5, 60: 6, 90: 7 };
const LETTER = ['A', 'B', 'C'];

export const pool = (p: Profile) => (EXERCISES as any[]).filter((e) => ALLOWED[p.equip].includes(META[e.id][2]) && !['t_warm', 't_mob', 't_cond'].includes(META[e.id][3]) && !p.avoid.includes(e.id));
export const alts = (exId: string, p: Profile) => {
  const g = (EXERCISES as any[]).find((e) => e.id === exId)?.m;
  return pool(p).filter((e) => e.m === g && e.id !== exId).map((e) => e.id as string);
};
export function prescribe(p: Profile, id: string): Item {
  const ty = META[id][3];
  const comp = ty !== 't_iso' && ty !== 't_core';
  if (id === 'plank') return { exId: id, sets: p.level === 'b' ? 2 : 3, repMin: 20, repMax: 45, rest: 45, unit: 's' };
  const sets = p.level === 'b' ? (comp ? 3 : 2) : p.level === 'i' ? 3 : comp ? 4 : 3;
  const r = p.goal === 'str' ? (comp ? (p.level === 'b' ? [6, 8] : [4, 6]) : [8, 12]) : p.goal === 'fat' ? [12, 15] : comp ? [8, 12] : [10, 15];
  const rest = p.goal === 'str' ? (comp ? 150 : 90) : p.goal === 'fat' ? (comp ? 60 : 45) : p.goal === 'hyp' ? (comp ? 90 : 60) : comp ? 75 : 60;
  return { exId: id, sets, repMin: r[0], repMax: r[1], rest };
}
export function generate(p: Profile): Plan {
  const av = pool(p);
  const seq: string[] = p.split === 'full' || (p.split === 'auto' && p.days <= 3) ? Array(p.days).fill('full')
    : p.split === 'ul' || (p.split === 'auto' && p.days === 4) ? Array.from({ length: p.days }, (_, k) => (k % 2 ? 'lower' : 'upper'))
    : p.split === 'ppl' || p.days === 6 ? Array.from({ length: p.days }, (_, k) => ['push', 'pull', 'legs'][k % 3])
    : ['push', 'pull', 'legs', 'upper', 'lower'].slice(0, p.days);
  const notes: string[] = [];
  const seen: Record<string, number> = {};
  const wds = WD[p.days] ?? WD[3];
  const days: Day[] = seq.map((ty, k) => {
    const occ = (seen[ty] = (seen[ty] ?? -1) + 1);
    let slots = [...TYPES[ty].g];
    p.prio.forEach((g) => { if (slots.includes(g)) slots.push(g); });
    slots = slots.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).slice(0, COUNT[p.dur] ?? 5);
    const used = new Set<string>();
    const items: Item[] = [];
    slots.forEach((g) => {
      const c = av.filter((e) => e.m === g && !used.has(e.id)).sort((a, b) => p.level === 'b' ? RANK[META[a.id][4]] - RANK[META[b.id][4]] : RANK[META[b.id][4]] - RANK[META[a.id][4]]);
      if (!c.length) { if (!notes.includes('miss:' + g)) notes.push('miss:' + g); return; }
      const e = c[occ % c.length];
      used.add(e.id); items.push(prescribe(p, e.id));
    });
    const letter = ['full', 'upper', 'lower'].includes(ty) && seq.filter((x) => x === ty).length > 1 ? ' ' + LETTER[occ % 3] : '';
    return { id: crypto.randomUUID(), name: [TYPES[ty].n[0] + letter, TYPES[ty].n[1] + letter] as [string, string], weekday: wds[k], items };
  });
  return { id: 'plan:' + crypto.randomUUID(), name: '', createdAt: new Date().toISOString(), profile: p, days, notes };
}
