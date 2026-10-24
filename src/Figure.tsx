const B = 'M50 20V52M50 52L44 90M50 52L56 90';
type Ph = [number, number, string];
const P: Record<string, [Ph, Ph]> = {
  squat: [[50, 12, B + 'M50 26L66 28'], [50, 38, 'M50 46L44 68L64 70L54 90M50 50L68 52']],
  push: [[12, 52, 'M18 56L84 74M24 58V86'], [12, 72, 'M18 72L84 80M26 74L36 82L24 86']],
  hinge: [[50, 12, B + 'M50 26V56'], [26, 42, 'M34 46L62 54L56 90M36 48L40 78']],
  pull: [[50, 28, 'M50 36V66M50 66L46 88M50 66L54 88M50 38L38 8M50 38L62 8M30 6H70'], [50, 14, 'M50 24V54M50 54L46 76M50 54L54 76M50 26L40 18L40 6M50 26L60 18L60 6M30 6H70']],
  press: [[50, 12, B + 'M50 24L40 34L42 20M50 24L60 34L58 20'], [50, 12, B + 'M50 24L42 6M50 24L58 6']],
  curl: [[50, 12, B + 'M50 24L54 40V58'], [50, 12, B + 'M50 24L54 40L58 24']],
  raise: [[50, 12, B + 'M50 24L42 52M50 24L58 52'], [50, 12, B + 'M50 24L20 28M50 24L80 28']],
  plank: [[12, 62, 'M18 66L84 72M26 68L34 86'], [12, 62, 'M18 66L84 72M26 68L34 86']],
};
export function Figure({ pose, labels }: { pose?: string; labels: [string, string] }) {
  const p = pose && P[pose];
  if (!p) return null;
  return (
    <svg viewBox="0 0 220 112" className="fig" role="img">
      {p.map(([x, y, d], i) => (
        <g key={i} transform={`translate(${i * 110 + 5},2)`} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx={x} cy={y} r="7" />
          <path d={d} />
          <path d="M0 93H100" strokeWidth="1" opacity=".3" />
          <text x="50" y="108" textAnchor="middle" fontSize="9" fill="currentColor" stroke="none">{labels[i]}</text>
        </g>
      ))}
      <path d="M103 50h10m-4-4l4 4l-4 4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
