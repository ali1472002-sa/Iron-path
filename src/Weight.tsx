import { useState } from 'react';
import { Lang, t } from './i18n';
import * as db from './db';
import { I } from './Icon';

type Meas = { id: string; date: string; weightKg: number };
// accepts Arabic-Indic digits and decimal separators typed on an Arabic keyboard
const norm = (s: string) => s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[٫,،]/g, '.').trim();

function Spark({ pts }: { pts: Meas[] }) {
  const asc = [...pts].reverse().slice(-30);
  if (asc.length < 2) return null;
  const vs = asc.map((p) => p.weightKg), mx = Math.max(...vs), mn = Math.min(...vs), rg = mx - mn || 1;
  const xy = asc.map((p, k) => [8 + (k / (asc.length - 1)) * 284, 70 - ((p.weightKg - mn) / rg) * 52]);
  return (
    <div dir="ltr">
      <svg viewBox="0 0 300 84" className="spark" role="img" aria-label="weight trend">
        <polyline points={xy.map((q) => q.join(',')).join(' ')} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--acc)' }} />
        {xy.map((q, k) => k === xy.length - 1 ? <circle key={k} cx={q[0]} cy={q[1]} r="4" style={{ fill: 'var(--acc)' }} /> : null)}
        <text x="8" y="82" fontSize="9" fill="var(--mut)">{asc[0].date.slice(5)} · {asc[0].weightKg}</text>
        <text x="292" y="82" fontSize="9" fill="var(--mut)" textAnchor="end">{asc[asc.length - 1].date.slice(5)} · {asc[asc.length - 1].weightKg}</text>
      </svg>
    </div>
  );
}

export default function Weight({ lang, meas, reload }: { lang: Lang; meas: Meas[]; reload: () => void }) {
  const T = (k: any) => t(lang, k);
  const [w, setW] = useState('');
  const [err, setErr] = useState('');
  const [del, setDel] = useState('');
  const [all, setAll] = useState(false);

  const add = async () => {
    const v = parseFloat(norm(w));
    if (!(v > 20 && v < 400)) { setErr(T('badW')); return; }
    await db.put('measurements', { id: crypto.randomUUID(), date: new Date().toLocaleDateString('sv'), weightKg: Math.round(v * 10) / 10 });
    setW(''); setErr(''); reload();
  };
  const last = meas[0], prev = meas[1];
  const diff = last && prev ? last.weightKg - prev.weightKg : null;
  const shown = all ? meas : meas.slice(0, 7);

  return (
    <>
      <section className="card">
        <h2 className="row"><I n="scale" s={20} /> {T('weight')}</h2>
        {last && (
          <div>
            <div className="big-num" dir="ltr" style={{ textAlign: 'start' }}>{last.weightKg}<small>{T('unit')}</small></div>
            <div className="muted">{T('latest')} · {last.date}{diff != null && <span className="delta"> · {T('change')} {diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>}</div>
          </div>
        )}
        <div className="row">
          <div className="field"><input inputMode="decimal" placeholder="0.0" aria-label={T('kg')} value={w} onChange={(e) => { setW(e.target.value); setErr(''); }} onKeyDown={(e) => e.key === 'Enter' && add()} /><span className="u">{T('unit')}</span></div>
          <button className="primary" onClick={add}><I n="plus" s={18} /> {T('add')}</button>
        </div>
        {err && <p className="bad" role="alert" style={{ fontSize: '.88rem' }}>{err}</p>}
      </section>

      {meas.length >= 2 && <section className="card"><h3 style={{ margin: 0 }}>{T('wTrend')}</h3><Spark pts={meas} /></section>}

      <section className="card">
        <h3 style={{ margin: 0 }}>{T('recent')}</h3>
        {meas.length === 0 ? <p className="muted">{T('empty')}</p> : (
          <div>
            {shown.map((m) => (
              <div className="wrow" key={m.id}>
                <span className="d">{m.date}</span>
                {del === m.id ? (
                  <>
                    <span className="muted">{T('delQ')}</span>
                    <button className="danger solid sm" onClick={async () => { await db.remove('measurements', m.id); setDel(''); reload(); }}>{T('yes')}</button>
                    <button className="ghost sm" onClick={() => setDel('')}>{T('cancel')}</button>
                  </>
                ) : (
                  <>
                    <b dir="ltr">{m.weightKg} {T('unit')}</b>
                    <button className="ghost" aria-label={T('yes')} onClick={() => setDel(m.id)}><I n="trash" s={18} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {meas.length > 7 && <button className="ghost sm" onClick={() => setAll(!all)}>{all ? T('showLess') : `${T('showAll')} (${meas.length})`}</button>}
      </section>
    </>
  );
}
