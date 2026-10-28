import { useEffect, useState } from 'react';
import { Lang } from './i18n';
import { EXERCISES } from './exercises';
import * as db from './db';
import { I } from './Icon';

const S: Record<string, [string, string]> = {
  title:['الأداء والإحصاءات','Performance & stats'], d7:['جلسات آخر 7 أيام','Sessions, last 7 days'], d30:['جلسات آخر 30 يوماً','Sessions, last 30 days'],
  sets:['المجموعات المكتملة','Completed sets'], reps:['التكرارات المكتملة','Completed reps'], vol:['حجم التدريب (وزن × تكرارات)','Training volume (weight × reps)'],
  best:['أفضل أداء: أعلى وزن في مجموعة مكتملة (وعند التساوي الأكثر تكراراً)','Best performance: heaviest completed set (ties: more reps)'],
  bestVol:['أعلى حجم في جلسة واحدة (ليس رقماً قياسياً في الوزن)','Highest single-session volume (not a weight record)'],
  w:['تطور أعلى وزن في الجلسة','Top weight per session'], r:['تطور مجموع التكرارات في الجلسة','Total reps per session'],
  none:['لا توجد جلسات محفوظة بعد. أنهِ تمريناً ليظهر هنا.','No saved sessions yet. Finish a workout to see stats.'], few:['تحتاج جلستين على الأقل لرسم المنحنى','At least 2 sessions are needed for a chart'],
  kg:['كغم','kg'],
};
function Line({ pts, few }: { pts: number[]; few: string }) {
  if (pts.length < 2) return <p className="muted">{few}</p>;
  const mx = Math.max(...pts), mn = Math.min(...pts), r = mx - mn || 1;
  const xy = pts.map((v, k) => [10 + (k / (pts.length - 1)) * 280, 66 - ((v - mn) / r) * 52]);
  return (
    <svg viewBox="0 0 300 80" className="fig">
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" strokeWidth="3" style={{ stroke: 'var(--acc)' }} />
      {xy.map((p, k) => <circle key={k} cx={p[0]} cy={p[1]} r="3.5" style={{ fill: 'var(--acc)' }} />)}
      <text x="4" y="78" fontSize="9" fill="currentColor">{pts[0]}</text>
      <text x="296" y="78" fontSize="9" fill="currentColor" textAnchor="end">{pts[pts.length - 1]}</text>
    </svg>
  );
}
export default function Stats({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const s = (k: string) => S[k][i];
  const [hist, setHist] = useState<any[]>([]);
  const [cust, setCust] = useState<any[]>([]);
  const [sel, setSel] = useState('');
  useEffect(() => { (async () => {
    setHist((await db.getAll<any>('workouts')).filter((x) => x.id !== 'draft').sort((a, b) => a.date.localeCompare(b.date)));
    setCust(await db.getAll<any>('exercises'));
  })(); }, []);
  if (!hist.length) return <section className="card"><h2><I n="trend" /> {s('title')}</h2><p className="muted">{s('none')}</p></section>;
  const nm = (id: string) => (EXERCISES as any[]).find((e) => e.id === id)?.[lang] ?? cust.find((c) => c.id === id)?.name ?? id;
  const now = Date.now();
  const within = (d: number) => hist.filter((x) => now - Date.parse(x.date) <= d * 864e5).length;
  const allSets = hist.flatMap((x) => x.entries.flatMap((e: any) => e.sets));
  const sum = (a: any[], f: (r: any) => number) => a.reduce((t, r) => t + f(r), 0);
  const ids = Array.from(new Set(hist.flatMap((x) => x.entries.map((e: any) => e.exId)))) as string[];
  const cur = sel || ids[0];
  const rows = hist.map((x) => {
    const e = x.entries.find((y: any) => y.exId === cur);
    return e ? { date: x.date.slice(0, 10), kg: Math.max(...e.sets.map((r: any) => +r.kg || 0)), reps: sum(e.sets, (r) => +r.reps || 0), vol: sum(e.sets, (r) => (+r.kg || 0) * (+r.reps || 0)) } : null;
  }).filter(Boolean) as any[];
  const bestSet = hist.flatMap((x) => x.entries.filter((e: any) => e.exId === cur).flatMap((e: any) => e.sets.map((r: any) => ({ ...r, date: x.date.slice(0, 10) }))))
    .sort((a, b) => (+b.kg || 0) - (+a.kg || 0) || (+b.reps || 0) - (+a.reps || 0))[0];
  const bestVol = [...rows].sort((a, b) => b.vol - a.vol)[0];
  return (
    <section className="card">
      <h2><I n="trend" /> {s('title')}</h2>
      <p><I n="cal" /> {s('d7')}: <b>{within(7)}</b><br /><I n="cal" /> {s('d30')}: <b>{within(30)}</b><br /><I n="checkc" /> {s('sets')}: <b>{allSets.length}</b><br /><I n="repeat" /> {s('reps')}: <b>{sum(allSets, (r) => +r.reps || 0)}</b></p>
      <select value={cur} onChange={(e) => setSel(e.target.value)}>{ids.map((id) => <option key={id} value={id}>{nm(id)}</option>)}</select>
      <p><I n="pkg" /> {s('vol')}: <b>{Math.round(sum(rows, (r) => r.vol))}</b></p>
      {bestSet && <p><I n="trophy" /> <span className="muted">{s('best')}</span><br /><b>{bestSet.kg || 0} {s('kg')} × {bestSet.reps}</b> ({bestSet.date})</p>}
      {bestVol && <p><I n="chart" /> <span className="muted">{s('bestVol')}</span><br /><b>{Math.round(bestVol.vol)}</b> ({bestVol.date})</p>}
      <h3>{s('w')}</h3><Line pts={rows.map((r) => r.kg)} few={s('few')} />
      <h3>{s('r')}</h3><Line pts={rows.map((r) => r.reps)} few={s('few')} />
    </section>
  );
}
