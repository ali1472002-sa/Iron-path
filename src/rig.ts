// Parametric stick-figure rig: each frame gives hip, torso angle and foot/hand targets; two-bone IK keeps every limb a constant length,
// so intermediate frames are physically consistent. One source of truth for the app (SVG) and the QA renderer (scripts/render-sheet.ts).
export type Frame = number[]; // [hx,hy,torsoDeg, f1x,f1y, f2x,f2y, h1x,h1y, h2x,h2y]
export type Deco = ['l', number, number, number, number, number?] | ['r', number, number, number, number] | ['c', number, number, number];
export type Cfg = { front?: boolean; ks: number; es: number; scene: string; gear?: 'db' | 'bb'; plate?: number; cable?: [number, number]; toe?: boolean; deco?: Deco[]; link?: [number, number, string?][] };
export type Prim = { k: 'l'; c: string; x1: number; y1: number; x2: number; y2: number; w: number; dash?: boolean } | { k: 'c'; c: string; x: number; y: number; r: number; fill?: boolean; w?: number } | { k: 'r'; c: string; x: number; y: number; w: number; h: number };
const L = { torso: 30, head: 10, thigh: 20, shin: 20, ua: 15, fa: 14 };
type P = [number, number];
function ik(r: P, t: P, a: number, b: number, s: number): { mid: P; end: P } {
  const dx = t[0] - r[0], dy = t[1] - r[1], d = Math.hypot(dx, dy);
  const dm = Math.min(Math.max(d, Math.abs(a - b) + 0.01), a + b - 0.01), base = Math.atan2(dy, dx);
  const A = Math.acos((a * a + dm * dm - b * b) / (2 * a * dm)), ang = base + s * A;
  return { mid: [r[0] + a * Math.cos(ang), r[1] + a * Math.sin(ang)], end: [r[0] + dm * Math.cos(base), r[1] + dm * Math.sin(base)] };
}
export function solve(f: Frame, cfg: Cfg) {
  const hip: P = [f[0], f[1]], T = (f[2] * Math.PI) / 180, u: P = [Math.cos(T), Math.sin(T)];
  const neck: P = [hip[0] + L.torso * u[0], hip[1] + L.torso * u[1]], head: P = [neck[0] + L.head * u[0], neck[1] + L.head * u[1]];
  const lr: P[] = cfg.front ? [[hip[0] - 4, hip[1]], [hip[0] + 4, hip[1]]] : [hip, hip], ar: P[] = cfg.front ? [[neck[0] - 6, neck[1]], [neck[0] + 6, neck[1]]] : [neck, neck];
  const legs = [0, 1].map((i) => { const r = ik(lr[i], [f[3 + 2 * i], f[4 + 2 * i]], L.thigh, L.shin, cfg.front && i === 1 ? -cfg.ks : cfg.ks); return { r: lr[i], k: r.mid, f: r.end }; });
  const arms = [0, 1].map((i) => { const r = ik(ar[i], [f[7 + 2 * i], f[8 + 2 * i]], L.ua, L.fa, cfg.front && i === 1 ? -cfg.es : cfg.es); return { r: ar[i], e: r.mid, h: r.end }; });
  return { hip, neck, head, legs, arms, mid: [(hip[0] + neck[0]) / 2, (hip[1] + neck[1]) / 2] as P };
}
export const frameAt = (frames: Frame[], t: number): Frame => (frames.length === 1 ? frames[0] : frames[0].map((v, i) => v + (frames[1][i] - v) * t));
const along = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const seg = (c: string, a: P, b: P, w: number): Prim => ({ k: 'l', c, x1: a[0], y1: a[1], x2: b[0], y2: b[1], w });
function highlight(key: string, J: ReturnType<typeof solve>, c: string): Prim[] {
  const o: Prim[] = [], dot = (p: P, r: number) => o.push({ k: 'c', c, x: p[0], y: p[1], r, fill: true });
  const arm = (i: number, part: 'u' | 'f') => (part === 'u' ? seg(c, J.arms[i].r, J.arms[i].e, 11) : seg(c, J.arms[i].e, J.arms[i].h, 10));
  const leg = (i: number, part: 't' | 's') => (part === 't' ? seg(c, J.legs[i].r, J.legs[i].k, 12) : seg(c, J.legs[i].k, J.legs[i].f, 10));
  switch (key) {
    case 'pecs': dot(along(J.neck, J.hip, 0.22), 8); break;
    case 'lats': case 'upback': case 'traps': o.push(seg(c, J.neck, J.mid, 11)); break;
    case 'lowback': o.push(seg(c, J.mid, J.hip, 11)); break;
    case 'abs': case 'obliques': o.push(seg(c, along(J.neck, J.hip, 0.45), along(J.neck, J.hip, 0.95), 10)); break;
    case 'delts': dot(J.neck, 7.5); break;
    case 'biceps': case 'triceps': J.arms.forEach((_, i) => o.push(arm(i, 'u'))); break;
    case 'forearms': J.arms.forEach((_, i) => o.push(arm(i, 'f'))); break;
    case 'quads': case 'hams': J.legs.forEach((_, i) => o.push(leg(i, 't'))); break;
    case 'glutes': dot(J.hip, 8.5); break;
    case 'calves': J.legs.forEach((_, i) => o.push(leg(i, 's'))); break;
  }
  return o;
}
export function prims(frames: Frame[], t: number, cfg: Cfg, hl: { p: string[]; s: string[] }): Prim[] {
  const out: Prim[] = [], f = frameAt(frames, t), J = solve(f, cfg), J0 = solve(frames[0], cfg), J1 = solve(frames[frames.length - 1], cfg);
  const line = (a: number, y: number, b: number, w = 1.4, c = 'scene'): Prim => ({ k: 'l', c, x1: a, y1: y, x2: b, y2: y, w });
  const sc = cfg.scene;
  if (sc !== 'pullbar') out.push(line(2, 92, 98));
  if (sc === 'bench') { out.push({ k: 'r', c: 'scene', x: 12, y: 70, w: 62, h: 5 }, seg('scene', [18, 75], [18, 92], 1.4), seg('scene', [68, 75], [68, 92], 1.4)); }
  if (sc === 'pullbar') out.push(seg('scene', [32, 6], [68, 6], 2.5), seg('scene', [32, 6], [32, -10], 1.4), seg('scene', [68, 6], [68, -10], 1.4));
  if (sc === 'seat') out.push({ k: 'r', c: 'scene', x: J0.hip[0] - 14, y: J0.hip[1] + 5, w: 26, h: 4 }, seg('scene', [J0.hip[0] - 1, J0.hip[1] + 9], [J0.hip[0] - 1, 92], 1.4));
  if (sc === 'legpress') {
    const d: P = [J0.neck[0] - J0.hip[0], J0.neck[1] - J0.hip[1]];
    out.push(seg('scene', along(J0.hip, [J0.hip[0] + d[0] * 1.5, J0.hip[1] + d[1] * 1.5], 1), [J0.hip[0] + d[0] * 1.5, J0.hip[1] + d[1] * 1.5], 2));
    const ft = [(J.legs[0].f[0] + J.legs[1].f[0]) / 2, (J.legs[0].f[1] + J.legs[1].f[1]) / 2] as P, v: P = [ft[0] - J.hip[0], ft[1] - J.hip[1]], n = Math.hypot(v[0], v[1]) || 1, px: P = [-v[1] / n, v[0] / n];
    out.push(seg('scene', [ft[0] + px[0] * 13 + (v[0] / n) * 3, ft[1] + px[1] * 13 + (v[1] / n) * 3], [ft[0] - px[0] * 13 + (v[0] / n) * 3, ft[1] - px[1] * 13 + (v[1] / n) * 3], 3));
  }
  (cfg.deco ?? []).forEach((d) => { if (d[0] === 'l') out.push(seg('scene', [d[1], d[2]], [d[3], d[4]], d[5] ?? 1.8)); else if (d[0] === 'r') out.push({ k: 'r', c: 'scene', x: d[1], y: d[2], w: d[3], h: d[4] }); else out.push({ k: 'c', c: 'scene', x: d[1], y: d[2], r: d[3], fill: false, w: 1.5 }); });
  hl.s.forEach((k) => out.push(...highlight(k, J, 'hlS'))); hl.p.forEach((k) => out.push(...highlight(k, J, 'hlP')));
  const far = [1], near = [0];
  far.forEach((i) => { out.push(seg('far', J.legs[i].r, J.legs[i].k, 5.5), seg('far', J.legs[i].k, J.legs[i].f, 5.5), seg('far', J.arms[i].r, J.arms[i].e, 4.5), seg('far', J.arms[i].e, J.arms[i].h, 4.5)); });
  out.push(seg('body', J.hip, J.neck, 6.5), { k: 'c', c: 'body', x: J.head[0], y: J.head[1], r: 6.5, fill: true });
  near.forEach((i) => { out.push(seg('body', J.legs[i].r, J.legs[i].k, 5.5), seg('body', J.legs[i].k, J.legs[i].f, 5.5), seg('body', J.arms[i].r, J.arms[i].e, 4.5), seg('body', J.arms[i].e, J.arms[i].h, 4.5)); });
  if (cfg.toe) J.legs.forEach((l) => { if (l.f[1] < 91) out.push(seg('body', l.f, [l.f[0] + 7, 92], 4)); });
  J.arms.forEach((a) => {
    if (cfg.gear === 'db') out.push({ k: 'c', c: 'gear', x: a.h[0], y: a.h[1], r: 4.5, fill: true });
    if (cfg.gear === 'bb' && a === J.arms[0]) out.push({ k: 'c', c: 'gear', x: a.h[0], y: a.h[1], r: cfg.plate ?? 8, fill: false, w: 3 }, { k: 'c', c: 'gear', x: a.h[0], y: a.h[1], r: 2, fill: true });
  });
  if (cfg.cable) out.push({ k: 'c', c: 'scene', x: cfg.cable[0], y: cfg.cable[1], r: 3, fill: false, w: 1.5 }, seg('scene', cfg.cable, J.arms[0].h, 1.2));
  (cfg.link ?? []).forEach(([px, py, t]) => { const k = t ?? 'h0', tp = k[0] === 'f' ? J.legs[+k[1]].f : J.arms[+k[1]].h; out.push(seg('scene', [px, py], tp, 1.3), { k: 'c', c: 'scene', x: px, y: py, r: 2.2, fill: false, w: 1.3 }); });
  const pts: [string, P, P][] = [['h', J0.arms[0].h, J1.arms[0].h], ['f', J0.legs[0].f, J1.legs[0].f], ['p', J0.hip, J1.hip], ['d', J0.head, J1.head]];
  const best = pts.reduce((a, b) => (Math.hypot(b[2][0] - b[1][0], b[2][1] - b[1][1]) > Math.hypot(a[2][0] - a[1][0], a[2][1] - a[1][1]) ? b : a));
  const dx = best[2][0] - best[1][0], dy = best[2][1] - best[1][1], dl = Math.hypot(dx, dy);
  if (dl > 8) {
    const ux = dx / dl, uy = dy / dl, e = best[2];
    out.push({ k: 'l', c: 'arrow', x1: best[1][0], y1: best[1][1], x2: e[0], y2: e[1], w: 1.6, dash: true },
      { k: 'l', c: 'arrow', x1: e[0], y1: e[1], x2: e[0] - 5 * ux + 3 * uy, y2: e[1] - 5 * uy - 3 * ux, w: 1.8 }, { k: 'l', c: 'arrow', x1: e[0], y1: e[1], x2: e[0] - 5 * ux - 3 * uy, y2: e[1] - 5 * uy + 3 * ux, w: 1.8 });
  }
  return out;
}
