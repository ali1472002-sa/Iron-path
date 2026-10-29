import { Lang } from './i18n';
import { LB } from './exerciseMeta';

// Simplified anatomical muscle map (front + back). Every muscle key matches the keys used in META / LB.
// Primary muscles use the accent colour, secondary muscles a second colour; muscles that are not involved stay neutral.
type Sh = { d?: string; e?: [number, number, number, number, number?]; m?: boolean }; // m = mirrored to the right side
const FRONT: Record<string, Sh[]> = {
  pecs: [{ d: 'M59,45 L47,43 Q38,45 39,56 Q47,64 59,60 Z', m: true }],
  delts: [{ e: [34, 47, 7.5, 9], m: true }],
  biceps: [{ e: [29.5, 67, 5, 11, -8], m: true }],
  forearms: [{ e: [25, 101, 4.8, 14, -6], m: true }],
  obliques: [{ d: 'M53,64 Q46,64 43,70 Q41,84 44,100 L53,102 Z', m: true }],
  abs: [{ d: 'M54,63 L66,63 L66,103 L54,103 Z' }],
  quads: [{ d: 'M51,118 L41,119 Q37,142 43,168 L53,168 Q56,144 53,120 Z', m: true }],
  adductors: [{ d: 'M54,120 L58,122 Q57,144 54,162 L51,162 Q53,142 54,120 Z', m: true }],
  abductors: [{ e: [40, 120, 4, 7], m: true }],
};
const BACK: Record<string, Sh[]> = {
  traps: [{ d: 'M60,32 L52,36 L42,41 L46,50 L60,74 L74,50 L78,41 L68,36 Z' }],
  upback: [{ d: 'M52,50 Q60,46 68,50 L68,68 Q60,72 52,68 Z' }],
  lats: [{ d: 'M44,52 Q39,72 48,96 L58,90 L58,66 Z', m: true }],
  delts: [{ e: [34, 47, 7.5, 9], m: true }],
  triceps: [{ e: [29.5, 67, 5.6, 11.5, -8], m: true }],
  forearms: [{ e: [25, 101, 4.8, 14, -6], m: true }],
  lowback: [{ d: 'M54,78 L59,78 L59,106 L53,106 Z', m: true }],
  glutes: [{ e: [50, 121, 10.5, 12], m: true }],
  abductors: [{ e: [41, 110, 5, 6], m: true }],
  hams: [{ d: 'M52,138 L41,137 Q38,156 44,170 L53,170 Q56,156 54,138 Z', m: true }],
  calves: [{ e: [47, 186, 6.8, 13], m: true }],
};
const FRONT_ONLY = new Set(['pecs', 'biceps', 'abs', 'obliques', 'tva', 'quads', 'adductors']);
const BACK_ONLY = new Set(['traps', 'upback', 'lats', 'triceps', 'lowback', 'glutes', 'hams', 'calves', 'abductors']);

const Limb = ({ a, b, w }: { a: [number, number]; b: [number, number]; w: number }) => (
  <>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w + 1.6} strokeLinecap="round" stroke="var(--mm-line)" />
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} strokeLinecap="round" stroke="var(--mm-body)" />
  </>
);
function Body() {
  const half = (
    <>
      <Limb a={[31, 44]} b={[26, 84]} w={13} /><Limb a={[26, 86]} b={[22, 122]} w={11} /><circle cx="21" cy="127" r="5" fill="var(--mm-body)" stroke="var(--mm-line)" />
      <Limb a={[50, 114]} b={[48, 170]} w={19} /><Limb a={[48, 172]} b={[47, 214]} w={13} /><ellipse cx="46" cy="222" rx="8" ry="4" fill="var(--mm-body)" stroke="var(--mm-line)" />
    </>
  );
  return (
    <>
      {half}<g transform="translate(120 0) scale(-1 1)">{half}</g>
      <path d="M34,40 Q60,31 86,40 L82,70 L77,100 L80,116 L40,116 L43,100 L38,70 Z" fill="var(--mm-body)" stroke="var(--mm-line)" strokeWidth="1.2" />
      <rect x="55" y="26" width="10" height="10" fill="var(--mm-body)" /><circle cx="60" cy="17" r="11" fill="var(--mm-body)" stroke="var(--mm-line)" strokeWidth="1.2" />
    </>
  );
}
function Shape({ s, fill, op }: { s: Sh; fill: string; op: number }) {
  const one = (k: string) => s.d ? <path key={k} d={s.d} /> : <ellipse key={k} cx={s.e![0]} cy={s.e![1]} rx={s.e![2]} ry={s.e![3]} transform={s.e![4] ? `rotate(${s.e![4]} ${s.e![0]} ${s.e![1]})` : undefined} />;
  return <g fill={fill} opacity={op} stroke="var(--mm-line)" strokeWidth="0.6">{one('a')}{s.m && <g transform="translate(120 0) scale(-1 1)">{one('b')}</g>}</g>;
}
function View({ reg, pri, sec, back }: { reg: Record<string, Sh[]>; pri: Set<string>; sec: Set<string>; back: boolean }) {
  const order = Object.keys(reg).sort((a, b) => Number(pri.has(a) || sec.has(a)) - Number(pri.has(b) || sec.has(b)));
  const deep = pri.has('tva') || sec.has('tva');
  return (
    <svg viewBox="0 0 120 232" className="mmsvg" aria-hidden="true">
      <Body />
      {order.map((k) => reg[k].map((s, n) => {
        const on = pri.has(k) ? 'var(--acc)' : sec.has(k) ? 'var(--sec)' : 'var(--mm-idle)';
        return <Shape key={k + n} s={s} fill={on} op={pri.has(k) || sec.has(k) ? 0.95 : 0.7} />;
      }))}
      {!back && (pri.has('abs') || sec.has('abs')) && [72, 82, 92].map((y) => <line key={y} x1="54" x2="66" y1={y} y2={y} stroke="var(--card)" strokeWidth="0.9" />)}
      {!back && deep && (
        <g><rect x="44" y="80" width="32" height="22" rx="8" fill={pri.has('tva') ? 'var(--acc)' : 'var(--sec)'} opacity="0.42" />
          <rect x="44" y="80" width="32" height="22" rx="8" fill="none" stroke={pri.has('tva') ? 'var(--acc)' : 'var(--sec)'} strokeWidth="1.3" strokeDasharray="3 2" /></g>
      )}
    </svg>
  );
}

export default function MuscleMap({ lang, primary, secondary }: { lang: Lang; primary: string[]; secondary: string[] }) {
  const i = lang === 'ar' ? 0 : 1;
  const pri = new Set(primary), sec = new Set(secondary.filter((k) => !pri.has(k)));
  const all = [...pri, ...sec];
  const hasF = all.some((k) => FRONT_ONLY.has(k)), hasB = all.some((k) => BACK_ONLY.has(k));
  const showF = hasF || !hasB, showB = hasB;
  const nm = (k: string) => `${LB[k]?.[i] ?? k} · ${LB[k]?.[1 - i] ?? ''}`;
  const T = lang === 'ar' ? { f: 'أمامي', b: 'خلفي', p: 'أساسية', s: 'مساعدة', deep: 'عضلة عميقة: تُرسم كحزام منقّط حول الخصر' } : { f: 'Front', b: 'Back', p: 'Primary', s: 'Secondary', deep: 'Deep muscle: drawn as a dashed band around the waist' };
  return (
    <div className="mm">
      <div className={'mmrow' + (showF && showB ? ' two' : '')}>
        {showF && <figure><View reg={FRONT} pri={pri} sec={sec} back={false} /><figcaption>{T.f}</figcaption></figure>}
        {showB && <figure><View reg={BACK} pri={pri} sec={sec} back={true} /><figcaption>{T.b}</figcaption></figure>}
      </div>
      <ul className="mmleg" aria-label="muscles">
        {[...pri].map((k) => <li key={k}><i style={{ background: 'var(--acc)' }} /><b>{T.p}</b> {nm(k)}</li>)}
        {[...sec].map((k) => <li key={k}><i style={{ background: 'var(--sec)' }} /><b>{T.s}</b> {nm(k)}</li>)}
      </ul>
      {all.includes('tva') && <p className="muted">{T.deep}</p>}
    </div>
  );
}
