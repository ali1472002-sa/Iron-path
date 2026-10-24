import { useEffect, useState } from 'react';
import { Lang, t } from './i18n';
import { EXERCISES, MUSCLES } from './exercises';
import { META, POSE, LB, U } from './exerciseMeta';
import { Figure } from './Figure';
import * as db from './db';

type Item = { id: string; name: string; muscle: string; steps: string[]; pose?: string; meta?: string[]; search: string; custom?: boolean };
const F0 = { m: 'all', eq: 'all', ty: 'all', lv: 'all' };
const OPT: Record<string, string[]> = { eq: ['bodyweight', 'dumbbell', 'barbell', 'bar'], ty: ['t_push', 't_pull', 't_legs', 't_core', 't_iso'], lv: ['b', 'i', 'a'] };

export default function Library({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const T = (k: any) => t(lang, k);
  const u = (k: string) => U[k]?.[i] ?? k;
  const lb = (k: string) => LB[k]?.[i] ?? k;
  const [q, setQ] = useState('');
  const [flt, setFlt] = useState(F0);
  const [onlyFav, setOnlyFav] = useState(false);
  const [open, setOpen] = useState('');
  const [favs, setFavs] = useState<string[]>([]);
  const [cust, setCust] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [form, setForm] = useState(false);
  const [n, setN] = useState('');
  const [m, setM] = useState('chest');
  const [st, setSt] = useState('');

  const load = async () => {
    setFavs((await db.getAll<{ id: string }>('favorites')).map((x) => x.id));
    setCust(await db.getAll<any>('exercises'));
    setPlan((await db.getAll<any>('plans')).find((p) => p.id === 'current')?.items ?? []);
  };
  useEffect(() => { load(); }, []);

  const all: Item[] = [
    ...EXERCISES.map((e: any) => ({ id: e.id, name: e[lang], muscle: e.m, steps: e['s' + lang].split('|'), pose: e.p, meta: META[e.id],
      search: (e.ar + ' ' + e.en + ' ' + LB[META[e.id][0]].join(' ')).toLowerCase() })),
    ...cust.map((c) => ({ id: c.id, name: c.name, muscle: c.muscle, steps: c.steps, search: c.name.toLowerCase(), custom: true })),
  ];
  const items = all.filter((x) => x.search.includes(q.trim().toLowerCase()) && (flt.m === 'all' || x.muscle === flt.m) &&
    (flt.eq === 'all' || x.meta?.[2] === flt.eq) && (flt.ty === 'all' || x.meta?.[3] === flt.ty) && (flt.lv === 'all' || x.meta?.[4] === flt.lv) &&
    (!onlyFav || favs.includes(x.id)));

  const toggleFav = async (id: string) => { favs.includes(id) ? await db.remove('favorites', id) : await db.put('favorites', { id }); load(); };
  const savePlan = async (it: any[]) => { await db.put('plans', { id: 'current', items: it }); load(); };
  const togglePlan = (id: string) => savePlan(plan.some((p) => p.exId === id) ? plan.filter((p) => p.exId !== id) : [...plan, { exId: id, sets: 3, reps: 10 }]);
  const saveCustom = async () => {
    if (!n.trim()) return;
    await db.put('exercises', { id: crypto.randomUUID(), name: n.trim(), muscle: m, steps: st.split('\n').filter(Boolean) });
    setN(''); setSt(''); setForm(false); load();
  };

  const x = all.find((a) => a.id === open);
  if (x) {
    const pi = x.pose ? POSE[x.pose] : null;
    return (
      <section className="card">
        <button className="ghost" onClick={() => setOpen('')}>{lang === 'ar' ? '→' : '←'} {u('back')}</button>
        <h2>{x.name}</h2>
        {x.meta && <div className="chips">{[x.meta[4], x.meta[2], x.meta[3]].map((k) => <span key={k} className="chip on">{lb(k)}</span>)}</div>}
        {x.meta && <p><b>{u('primary')}:</b> {lb(x.meta[0])}<br /><b>{u('secondary')}:</b> {x.meta[1].split(',').map(lb).join(lang === 'ar' ? '، ' : ', ')}</p>}
        <Figure pose={x.pose} labels={[T('start'), T('end')]} />
        {x.pose && <p className="muted">{u('diagram')}</p>}
        <h3>📋 {u('steps')}</h3>
        <ol>{x.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
        {pi && <>
          <h3>🫁 {u('breath')}</h3><p>{pi[0][i]}</p>
          <h3>⚠️ {u('mistakes')}</h3><ul className="plain">{pi[1][i].split('|').map((s, k) => <li key={k}>• {s}</li>)}</ul>
          <p className="warn">🛡️ <b>{u('safety')}:</b> {pi[2][i]}</p>
        </>}
        <div className="row">
          <button onClick={() => toggleFav(x.id)}>{favs.includes(x.id) ? '⭐' : '☆'}</button>
          <button style={{ flex: 1 }} onClick={() => togglePlan(x.id)}>{plan.some((p) => p.exId === x.id) ? u('inPlan') : '🗓️ ' + u('addPlan')}</button>
          {x.custom && <button className="danger" onClick={async () => { await db.remove('exercises', x.id); setOpen(''); load(); }}>🗑️</button>}
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>📚 {T('lib')}</h2>
      <input placeholder={T('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="filters">
        <select value={flt.m} onChange={(e) => setFlt({ ...flt, m: e.target.value })}>
          <option value="all">{u('m')}: {u('all')}</option>{MUSCLES.map((k) => <option key={k} value={k}>{T(k)}</option>)}
        </select>
        {(['eq', 'ty', 'lv'] as const).map((f) => (
          <select key={f} value={flt[f]} onChange={(e) => setFlt({ ...flt, [f]: e.target.value })}>
            <option value="all">{u(f)}: {u('all')}</option>{OPT[f].map((k) => <option key={k} value={k}>{lb(k)}</option>)}
          </select>
        ))}
      </div>
      <button className={'chip' + (onlyFav ? ' on' : '')} onClick={() => setOnlyFav(!onlyFav)}>⭐ {u('favOnly')}</button>
      {plan.length > 0 && (
        <p className="muted">🗓️ {u('plan')}: {plan.map((p) => all.find((a) => a.id === p.exId)?.name).filter(Boolean).join(' • ')}</p>
      )}
      <ul>
        {items.length === 0 && <li className="muted">{u('none')}</li>}
        {items.map((e) => (
          <li key={e.id} className="ex">
            <div className="row" onClick={() => setOpen(e.id)}>
              <b style={{ flex: 1 }}>{favs.includes(e.id) ? '⭐ ' : ''}{e.name}</b>
              <span className="muted">{e.meta ? lb(e.meta[0]) : T(e.muscle)}</span>
            </div>
          </li>
        ))}
      </ul>
      {form ? (
        <>
          <input placeholder={T('exName')} value={n} onChange={(e) => setN(e.target.value)} />
          <select value={m} onChange={(e) => setM(e.target.value)}>{MUSCLES.map((k) => <option key={k} value={k}>{T(k)}</option>)}</select>
          <textarea rows={4} placeholder={T('exSteps')} value={st} onChange={(e) => setSt(e.target.value)} />
          <button onClick={saveCustom}>💾 {T('save')}</button>
        </>
      ) : <button onClick={() => setForm(true)}>➕ {T('newEx')}</button>}
    </section>
  );
}
