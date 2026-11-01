import { solve, Cfg } from './rig';

// Shaded, muscular mannequin drawn on top of the rig skeleton (rig.solve). Limbs are tapered capsules with a light/dark pair for volume;
// target muscles are painted as overlays that follow the real side of each body part (biceps = flexor side of the elbow, quads = front of the thigh, ...).
type P = [number, number];
type J = ReturnType<typeof solve>;
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]], sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]], mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const len = (a: P) => Math.hypot(a[0], a[1]) || 1e-6, nrm = (a: P): P => mul(a, 1 / len(a)), per = (a: P): P => [-a[1], a[0]];
const mix = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const f1 = (n: number) => n.toFixed(2);
const pt = (p: P) => `${f1(p[0])},${f1(p[1])}`;

function cap(A: P, B: P, r1: number, r2: number): string {
  const n = per(nrm(sub(B, A)));
  const a1 = add(A, mul(n, r1)), a2 = add(B, mul(n, r2)), b2 = sub(B, mul(n, r2)), b1 = sub(A, mul(n, r1));
  return `M${pt(a1)} L${pt(a2)} A${f1(r2)} ${f1(r2)} 0 0 0 ${pt(b2)} L${pt(b1)} A${f1(r1)} ${f1(r1)} 0 0 0 ${pt(a1)}Z`;
}
function smooth(p: P[]): string {
  const n = p.length; let d = `M${pt(p[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += ` C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`;
  }
  return d + 'Z';
}
const lerpArr = (a: number[], t: number) => { const x = Math.min(Math.max(t, 0), 1) * (a.length - 1), i = Math.min(Math.floor(x), a.length - 2); return a[i] + (a[i + 1] - a[i]) * (x - i); };
const FRONT_OFF = [5.4, 5.2, 5.7, 7.5, 6.3, 3.6], BACK_OFF = [6.9, 5.7, 5.3, 5.5, 5.1, 3.6], HW = [7.6, 6.3, 7.7, 9.3, 9.6, 3.6];

export type Hl = { p: string[]; s: string[] };
const BODY = { base: 'var(--bm-base)', shade: 'var(--bm-shade)', lite: 'var(--bm-lite)', line: 'var(--bm-line)', far: 'var(--bm-far)' };

function bodyParts(J: J, cfg: Cfg) {
  const u = nrm(sub(J.neck, J.hip)), fwd: P = [-u[1], u[0]], front = !!cfg.front;
  const C = (t: number): P => add(J.hip, mul(u, 30 * t));
  // silhouette of the torso
  const ts = [0, 0.2, 0.4, 0.6, 0.8, 1];
  const torso = front
    ? smooth([...ts.map((t, i) => add(C(t), mul(per(u), HW[i]))), ...ts.map((t, i) => sub(C(t), mul(per(u), HW[i]))).reverse()])
    : smooth([...ts.map((t, i) => add(C(t), mul(fwd, FRONT_OFF[i]))), ...ts.map((t, i) => sub(C(t), mul(fwd, BACK_OFF[i]))).reverse()]);
  const torsoLite = front ? smooth([...ts.map((t, i) => add(C(t), mul(per(u), HW[i] * 0.7 - 1.5))), ...ts.map((t) => C(t)).reverse()]) : smooth([...ts.map((t, i) => add(C(t), mul(fwd, FRONT_OFF[i] * 0.95))), ...ts.map((t) => add(C(t), mul(fwd, 0.5))).reverse()]);
  return { u, fwd, C, torso, torsoLite };
}

// side of a limb: +1 = flexor/inside of the bend, -1 = outside. Straight limbs fall back to the facing direction.
function bendSide(R: P, M: P, E: P, fwd: P) {
  const chord = sub(mix(R, E, 0.5), M);
  if (len(chord) < 1.2) return { in: fwd, out: mul(fwd, -1) };
  const inn = nrm(chord); return { in: inn, out: mul(inn, -1) };
}

export function Mannequin({ f, cfg, hl, dim }: { f: number[]; cfg: Cfg; hl: Hl; dim?: boolean }) {
  const J = solve(f, cfg), B = bodyParts(J, cfg), front = !!cfg.front;
  const arms = J.arms.map((a, i) => ({ ...a, i, side: bendSide(a.r, a.e, a.h, B.fwd) }));
  const legs = J.legs.map((l, i) => ({ ...l, i, side: bendSide(l.r, l.k, l.f, B.fwd) }));
  const key = (k: string) => (hl.p.includes(k) ? 'p' : hl.s.includes(k) ? 's' : '');
  const col = (t: string) => (t === 'p' ? 'var(--mp)' : 'var(--ms)');
  const limb = (A: P, Bp: P, r1: number, r2: number, far: boolean, k: string) => (
    <g key={k}>
      <path d={cap(A, Bp, r1, r2)} fill={far ? BODY.far : BODY.base} stroke={BODY.line} strokeWidth="0.45" />
      {!far && <path d={cap(add(A, mul(B.fwd, -r1 * 0.15)), add(Bp, mul(B.fwd, -r2 * 0.15)), r1 * 0.45, r2 * 0.45)} fill={BODY.lite} opacity="0.55" transform={`translate(${f1(-r1 * 0.25 * B.fwd[0])} ${f1(-r1 * 0.25 * B.fwd[1])})`} />}
    </g>
  );
  // painted muscle on a limb segment
  const mus = (A: P, Bp: P, r1: number, r2: number, dir: P, t: string, kk: string, lo = 0.12, hi = 0.88, w = 0.62, op = 0.9) => {
    const a = mix(A, Bp, lo), b = mix(A, Bp, hi), ra = r1 + (r2 - r1) * lo, rb = r1 + (r2 - r1) * hi, o = (r: number) => mul(dir, r * 0.32);
    return <path key={kk} d={cap(add(a, o(ra)), add(b, o(rb)), ra * w, rb * w)} fill={col(t)} opacity={op} />;
  };
  const torsoBand = (a: number, b: number, side: 'f' | 'b' | 'm', t: string, kk: string, dash = false) => {
    const n = 5, ss = Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
    const outer = (tt: number): P => side === 'f' ? add(B.C(tt), mul(B.fwd, lerpArr(FRONT_OFF, tt) * 0.96)) : side === 'b' ? sub(B.C(tt), mul(B.fwd, lerpArr(BACK_OFF, tt) * 0.96)) : add(B.C(tt), mul(B.fwd, lerpArr(FRONT_OFF, tt) * 0.5));
    const inner = (tt: number): P => side === 'f' ? add(B.C(tt), mul(B.fwd, 0.5)) : side === 'b' ? sub(B.C(tt), mul(B.fwd, 0.6)) : sub(B.C(tt), mul(B.fwd, lerpArr(BACK_OFF, tt) * 0.4));
    const d = smooth([...ss.map(outer), ...ss.map(inner).reverse()]);
    return dash ? <path key={kk} d={d} fill={col(t)} fillOpacity="0.4" stroke={col(t)} strokeWidth="0.8" strokeDasharray="1.6 1.2" /> : <path key={kk} d={d} fill={col(t)} opacity="0.92" />;
  };
  const frontBand = (a: number, b: number, x0: number, x1: number, t: string, kk: string) => {
    const n = 4, ss = Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)), hw = (tt: number) => lerpArr(HW, tt);
    const L = ss.map((tt) => add(B.C(tt), mul(per(B.u), hw(tt) * x1))), R = ss.map((tt) => add(B.C(tt), mul(per(B.u), hw(tt) * x0)));
    return <path key={kk} d={smooth([...L, ...R.reverse()])} fill={col(t)} opacity="0.92" />;
  };
  const overlays: JSX.Element[] = [];
  (['s', 'p'] as const).forEach((tier) => {
    const ks = (tier === 'p' ? hl.p : hl.s).filter((k) => key(k) === tier);
    ks.forEach((k) => {
      const kk = tier + k;
      if (!front) {
        if (k === 'pecs') overlays.push(torsoBand(0.55, 0.88, 'f', tier, kk));
        if (k === 'abs') overlays.push(torsoBand(0.12, 0.55, 'f', tier, kk));
        if (k === 'obliques') overlays.push(torsoBand(0.14, 0.55, 'm', tier, kk));
        if (k === 'tva') overlays.push(torsoBand(0.12, 0.5, 'm', tier, kk, true));
        if (k === 'lats') overlays.push(torsoBand(0.3, 0.85, 'b', tier, kk));
        if (k === 'upback') overlays.push(torsoBand(0.62, 0.95, 'b', tier, kk));
        if (k === 'traps') overlays.push(torsoBand(0.8, 1.02, 'b', tier, kk));
        if (k === 'lowback') overlays.push(torsoBand(0.02, 0.34, 'b', tier, kk));
        if (k === 'glutes') overlays.push(<ellipse key={kk} cx={f1(J.hip[0] - B.fwd[0] * 2.8)} cy={f1(J.hip[1] - B.fwd[1] * 2.8)} rx="4.8" ry="5.4" fill={col(tier)} opacity="0.92" transform={`rotate(${f1((Math.atan2(B.u[1], B.u[0]) * 180) / Math.PI + 90)} ${f1(J.hip[0] - B.fwd[0] * 2.8)} ${f1(J.hip[1] - B.fwd[1] * 2.8)})`} />);
      } else {
        if (k === 'pecs') overlays.push(frontBand(0.6, 0.86, 0.12, 0.92, tier, kk + 'a'), frontBand(0.6, 0.86, -0.92, -0.12, tier, kk + 'b'));
        if (k === 'abs') overlays.push(frontBand(0.12, 0.56, -0.3, 0.3, tier, kk));
        if (k === 'obliques') overlays.push(frontBand(0.14, 0.55, 0.36, 0.92, tier, kk + 'a'), frontBand(0.14, 0.55, -0.92, -0.36, tier, kk + 'b'));
        if (k === 'tva') overlays.push(frontBand(0.12, 0.5, -0.8, 0.8, tier, kk));
        if (k === 'lats') overlays.push(frontBand(0.35, 0.8, 0.8, 1.05, tier, kk + 'a'), frontBand(0.35, 0.8, -1.05, -0.8, tier, kk + 'b'));
      }
      if (k === 'delts') arms.forEach((a) => overlays.push(<circle key={kk + a.i} cx={f1(a.r[0] + (front ? 0 : B.fwd[0] * 0.4))} cy={f1(a.r[1] + (front ? 0 : B.fwd[1] * 0.4))} r={front ? 4 : 3.7} fill={col(tier)} opacity={a.i === 1 && !front ? 0.55 : 0.92} />));
      arms.forEach((a) => {
        const far = a.i === 1 && !front, op = far ? 0.5 : 0.92;
        if (k === 'biceps') overlays.push(mus(a.r, a.e, 3.2, 2.6, front ? [0, 0] : a.side.in, tier, kk + 'b' + a.i, 0.2, 0.9, 0.7, op));
        if (k === 'triceps') overlays.push(mus(a.r, a.e, 3.2, 2.6, front ? [0, 0] : a.side.out, tier, kk + 't' + a.i, 0.15, 0.9, 0.7, op));
        if (k === 'forearms') overlays.push(mus(a.e, a.h, 2.6, 1.8, [0, 0], tier, kk + 'f' + a.i, 0.1, 0.92, 0.7, op));
      });
      legs.forEach((l) => {
        const far = l.i === 1 && !front, op = far ? 0.5 : 0.92;
        if (k === 'quads') overlays.push(mus(l.r, l.k, 5.1, 3.5, front ? [0, 0] : l.side.out, tier, kk + 'q' + l.i, 0.12, 0.92, 0.72, op));
        if (k === 'hams') overlays.push(mus(l.r, l.k, 5.1, 3.5, front ? [0, 0] : l.side.in, tier, kk + 'h' + l.i, 0.12, 0.92, 0.72, op));
        if (k === 'adductors') overlays.push(mus(l.r, l.k, 5.1, 3.5, [0, 0], tier, kk + 'd' + l.i, 0.2, 0.85, 0.4, op));
        if (k === 'abductors') overlays.push(<ellipse key={kk + l.i} cx={f1(l.r[0])} cy={f1(l.r[1] + 1)} rx="3" ry="4.2" fill={col(tier)} opacity={op} />);
        if (k === 'calves') overlays.push(mus(l.k, l.f, 3.5, 2.1, front ? [0, 0] : l.side.in, tier, kk + 'c' + l.i, 0.08, 0.7, 0.75, op));
      });
    });
  });
  const toe = (l: (typeof legs)[number]): P => (cfg.toe && l.f[1] < 91 ? [l.f[0] + 7, 92] : [l.f[0] + 6.5, l.f[1] + 1.2]);
  const farArm = arms[1], nearArm = arms[0], farLeg = legs[1], nearLeg = legs[0];
  return (
    <g opacity={dim ? 0.5 : 1}>
      {front ? null : (
        <>
          {limb(farLeg.r, farLeg.k, 4.6, 3.1, true, 'fl1')}{limb(farLeg.k, farLeg.f, 3.1, 1.9, true, 'fl2')}
          <path d={cap(farLeg.f, toe(farLeg), 1.8, 1.3)} fill={BODY.far} />
          {limb(farArm.r, farArm.e, 2.9, 2.3, true, 'fa1')}{limb(farArm.e, farArm.h, 2.3, 1.6, true, 'fa2')}
        </>
      )}
      <path d={B.torso} fill={BODY.base} stroke={BODY.line} strokeWidth="0.5" />
      <path d={B.torsoLite} fill={BODY.lite} opacity="0.4" />
      {(front ? legs : [nearLeg]).map((l) => <g key={'L' + l.i}>{limb(l.r, l.k, 5, 3.4, false, 'l1' + l.i)}{limb(l.k, l.f, 3.4, 2.1, false, 'l2' + l.i)}<path d={cap(l.f, toe(l), 2, 1.5)} fill={BODY.base} stroke={BODY.line} strokeWidth="0.4" /></g>)}
      {/* neck + head */}
      <path d={cap(J.neck, add(J.neck, mul(B.u, 4)), 2.6, 2.4)} fill={BODY.base} stroke={BODY.line} strokeWidth="0.4" />
      <ellipse cx={f1(J.head[0])} cy={f1(J.head[1])} rx="5.2" ry="5.9" fill={BODY.base} stroke={BODY.line} strokeWidth="0.5" transform={`rotate(${f1((Math.atan2(B.u[1], B.u[0]) * 180) / Math.PI + 90)} ${f1(J.head[0])} ${f1(J.head[1])})`} />
      {(front ? arms : [nearArm]).map((a) => <g key={'A' + a.i}>{limb(a.r, a.e, 3.2, 2.6, false, 'a1' + a.i)}{limb(a.e, a.h, 2.6, 1.8, false, 'a2' + a.i)}<circle cx={f1(a.h[0])} cy={f1(a.h[1])} r="2.1" fill={BODY.base} stroke={BODY.line} strokeWidth="0.4" /></g>)}
      {overlays}
    </g>
  );
}
