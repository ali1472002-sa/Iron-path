import { Lang } from './i18n';

// Hand-built animated diagrams for movements that a side-view stick figure cannot show correctly.
// Each view receives t in [0,1] (0 = start position, 1 = end position) and draws one SVG scene (viewBox 0 0 100 100).
type P = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function elbow(S: P, H: P, l1: number, l2: number, side: number): P {
  const dx = H[0] - S[0], dy = H[1] - S[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01) || 0.01;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), ux = dx / d, uy = dy / d;
  return [S[0] + ux * a + side * -uy * h, S[1] + uy * a + side * ux * h];
}
const TXT: Record<string, [string, string]> = {
  cable: ['الكابل', 'Cable'], pull: ['سحب الكابل', 'Cable pull'], press: ['دفع للأمام', 'Press out'],
  still: ['الجذع ثابت بلا دوران', 'Torso stays square, no rotation'], resist: ['مقاومة', 'Resist'],
};

// Pallof press seen from ABOVE: the person stands side-on to the cable (cable comes from the left), faces up the screen.
function Pallof({ t, lang }: { t: number; lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1, tx = (k: string) => TXT[k][i];
  const hy = lerp(53, 29, t), H: P = [58, hy];
  const SL: P = [46, 64], SR: P = [70, 64];
  const EL = elbow(SL, H, 19, 17, -1), ER = elbow(SR, H, 19, 17, 1);
  const pul: P = [13, 58];
  const ang = Math.atan2(pul[1] - hy, pul[0] - H[0]), ar: P = [H[0] + Math.cos(ang) * 16, hy + Math.sin(ang) * 16];
  const arrow = (a: P, b: P, c: string, dash = true) => {
    const th = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 3.2;
    return <g stroke={c} fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeDasharray={dash ? '2.6 2' : undefined} />
      <path d={`M${b[0] - Math.cos(th - 0.5) * h},${b[1] - Math.sin(th - 0.5) * h} L${b[0]},${b[1]} L${b[0] - Math.cos(th + 0.5) * h},${b[1] - Math.sin(th + 0.5) * h}`} /></g>;
  };
  const ln = { stroke: 'currentColor', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <g>
      {/* cable stack + pulley */}
      <rect x="2" y="44" width="9" height="30" rx="1.5" fill="currentColor" opacity="0.35" /><circle cx={pul[0]} cy={pul[1]} r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text x="6.5" y="40" fontSize="4" textAnchor="middle" fill="currentColor" opacity="0.75">{tx('cable')}</text>
      {/* spine reference (fixed) */}
      <line x1="58" y1="18" x2="58" y2="96" stroke="currentColor" opacity="0.25" strokeDasharray="1.5 2.5" strokeWidth="0.9" />
      {/* feet */}
      <ellipse cx="52" cy="92" rx="3" ry="6" fill="currentColor" opacity="0.35" /><ellipse cx="64" cy="92" rx="3" ry="6" fill="currentColor" opacity="0.35" />
      {/* torso (core highlighted: it must stay still) */}
      <rect x="44" y="58" width="28" height="26" rx="10" fill="var(--acc)" opacity="0.32" />
      <rect x="44" y="58" width="28" height="26" rx="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="58" cy="62" r="6.5" fill="var(--card)" stroke="currentColor" strokeWidth="1.5" />
      {/* arms */}
      <g {...ln} strokeWidth="3.2"><polyline points={`${SL[0]},${SL[1]} ${EL[0]},${EL[1]} ${H[0]},${H[1]}`} /><polyline points={`${SR[0]},${SR[1]} ${ER[0]},${ER[1]} ${H[0]},${H[1]}`} /></g>
      {/* cable + handle */}
      <line x1={pul[0]} y1={pul[1]} x2={H[0]} y2={H[1]} stroke="currentColor" strokeWidth="1.1" opacity="0.8" />
      <circle cx={H[0]} cy={H[1]} r="2.8" fill="var(--acc)" stroke="currentColor" strokeWidth="1" />
      {/* force direction (cable pulls toward the machine) and movement direction */}
      {arrow(H, ar, '#16a34a')}<text x={(H[0] + pul[0]) / 2 - 2} y={(hy + pul[1]) / 2 - 4} fontSize="3.8" textAnchor="middle" fill="#16a34a" fontWeight="700" stroke="var(--surf2)" strokeWidth="1.6" paintOrder="stroke">{tx('pull')}</text>
      {arrow([86, 56], [86, 30], 'var(--acc)', false)}<text x="86" y="26" fontSize="3.8" textAnchor="middle" fill="currentColor" stroke="var(--surf2)" strokeWidth="1.6" paintOrder="stroke">{tx('press')}</text>
      <text x="50" y="11" fontSize="4.2" textAnchor="middle" fill="currentColor" fontWeight="650">{tx('still')}</text>
    </g>
  );
}
export const CUSTOM: Record<string, (p: { t: number; lang: Lang }) => JSX.Element> = { pallof: Pallof };
