import { useEffect, useState } from 'react';
import { Lang, t } from './i18n';
import { EXERCISES, MUSCLES } from './exercises';
import { META, POSE, TIPS, LB, U } from './exerciseMeta';
import { normText, fromFedb, reconcile, Report } from './refdata';
import { Figure } from './Figure';
import ExerciseMedia from './ExerciseMedia';
import { MEDIA } from './media';
import { DEFAULT, alts, prescribe } from './planGen';
import * as db from './db';
import { I } from './Icon';

type Item = { id: string; name: string; muscle: string; steps: string[]; pose?: string; meta?: string[]; search: string; custom?: boolean; ref?: string };
const F0 = { m: 'all', eq: 'all', ty: 'all', lv: 'all' };
const OPT: Record<string, string[]> = { eq: ['bodyweight', 'dumbbell', 'barbell', 'bar', 'cable', 'machine', 'band', 'kettlebell', 'other'], ty: ['t_push', 't_pull', 't_legs', 't_core', 't_iso', 't_mob', 't_cond', 't_warm'], lv: ['b', 'i', 'a'] };

export default function Library({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const T = (k: any) => t(lang, k);
  const u = (k: string) => U[k]?.[i] ?? k;
  const lb = (k: string) => LB[k]?.[i] ?? k;
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(40);
  const [rep, setRep] = useState<Report | null>(null);
  const [msg, setMsg] = useState('');
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
      search: normText(e.ar + ' ' + e.en + ' ' + (LB[META[e.id][0]] ?? []).join(' ')) })),
    ...cust.map((c) => ({ id: c.id, name: c.name, muscle: c.muscle, steps: c.steps, meta: c.ref ? [c.pm, c.sm, c.eq, c.ty, c.lv] : undefined, search: normText(c.name), custom: !c.ref, ref: c.ref ? `${c.src} · ${c.license}` : undefined })),
  ];
  const items = all.filter((x) => x.search.includes(normText(q)) && (flt.m === 'all' || x.muscle === flt.m) &&
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
    const pi = x.pose ? POSE[x.pose] : TIPS[x.id] ?? null;
    const bi = (EXERCISES as any[]).find((e) => e.id === x.id);
    const rx = bi ? prescribe({ ...DEFAULT, goal: 'hyp', level: (x.meta?.[4] ?? 'b') as any }, x.id) : null;
    const alt = bi ? alts(x.id, { ...DEFAULT, equip: 'gym' }).slice(0, 4) : [];
    return (
      <section className="card">
        <button className="ghost" onClick={() => setOpen('')}>{lang === 'ar' ? '→' : '←'} {u('back')}</button>
        <h2>{bi ? `${bi.ar} · ${bi.en}` : x.name}</h2>
        {x.meta && <div className="chips">{[x.meta[4], x.meta[2], x.meta[3]].map((k) => <span key={k} className="chip on">{lb(k)}</span>)}</div>}
        {x.meta && <p><b>{u('primary')}:</b> {lb(x.meta[0])}<br /><b>{u('secondary')}:</b> {x.meta[1].split(',').filter(Boolean).map(lb).join(lang === 'ar' ? '، ' : ', ')}</p>}
        <ExerciseMedia exId={x.id} lang={lang} primary={x.meta ? [x.meta[0]] : []} secondary={x.meta ? x.meta[1].split(',').filter(Boolean) : []} />
        {!MEDIA[x.id] && <p className="muted">{u('noFig')}</p>}
        {x.ref && <p className="muted"><I n="book" /> {x.ref}</p>}
        <h3><I n="clip" /> {u('steps')}</h3>
        <ol>{x.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
        {pi && <>
          <h3><I n="wind" /> {u('breath')}</h3><p>{pi[0][i]}</p>
          <h3><I n="warn" /> {u('mistakes')}</h3><ul className="plain">{pi[1][i].split('|').map((s, k) => <li key={k}>• {s}</li>)}</ul>
          <p className="warn"><I n="shield" /> <b>{u('safety')}:</b> {pi[2][i]}</p>
        </>}
        {rx && <><h3><I n="target" /> {u('rx')}</h3><p>{rx.sets} × {rx.repMin}–{rx.repMax}{rx.unit ? 's' : ''} · {u('restW')} {rx.rest}s</p><p className="muted">{u('prog')}</p></>}
        {alt.length > 0 && <><h3><I n="refresh" /> {u('alts')}</h3><div className="chips">{alt.map((id) => <button key={id} className="chip" onClick={() => setOpen(id)}>{(EXERCISES as any[]).find((e) => e.id === id)?.[lang]}</button>)}</div></>}
        <div className="row">
          <button onClick={() => toggleFav(x.id)}><I n="star" className={favs.includes(x.id) ? 'fill' : ''} /></button>
          <button style={{ flex: 1 }} onClick={() => togglePlan(x.id)}>{plan.some((p) => p.exId === x.id) ? u('inPlan') : '' + u('addPlan')}</button>
          {x.custom && <button className="danger" onClick={async () => { await db.remove('exercises', x.id); setOpen(''); load(); }}><I n="trash" /></button>}
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2><I n="book" /> {T('lib')}</h2>
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
      <button className={'chip' + (onlyFav ? ' on' : '')} onClick={() => setOnlyFav(!onlyFav)}><I n="star" /> {u('favOnly')}</button>
      {plan.length > 0 && (
        <p className="muted"><I n="cal" /> {u('plan')}: {plan.map((p) => all.find((a) => a.id === p.exId)?.name).filter(Boolean).join(' • ')}</p>
      )}
      <ul>
        {items.length === 0 && <li className="muted">{u('none')}</li>}
        {items.slice(0, shown).map((e) => (
          <li key={e.id} className="ex">
            <div className="row" onClick={() => setOpen(e.id)}>
              <b style={{ flex: 1 }}>{favs.includes(e.id) ? <I n="star" className="fill" s={14} /> : ''}{e.name}</b>
              <span className="muted">{e.meta ? lb(e.meta[0]) : T(e.muscle)}</span>
            </div>
          </li>
        ))}
      </ul>
      {items.length > shown && <button className="ghost" onClick={() => setShown(shown + 40)}>{u('more')} ({items.length - shown})</button>}
      <div className="ent"><b><I n="download" s={16} /> {u('importEx')}</b><span className="muted">{u('importHelp')}</span>
        <input type="file" accept="application/json,.json" onChange={async (ev) => {
          const file = ev.target.files?.[0]; if (!file) return; setMsg(''); setRep(null);
          try {
            const { records, rejected } = fromFedb(JSON.parse(await file.text()));
            const existing: Record<string, any> = {}; cust.filter((c) => c.ref).forEach((c) => { existing[c.id] = c; });
            const known = [...(EXERCISES as any[]).flatMap((e) => [e.en, e.ar]), ...cust.filter((c) => !c.ref).map((c) => c.name)];
            const { put, rep: r } = reconcile(existing, known, records as any[], rejected);
            for (const rec of put) await db.put('exercises', rec);
            setRep(r); load();
          } catch (e: any) { setMsg(e.message); }
        }} />
        {msg && <p className="warn">{msg}</p>}
        {rep && <p><I n="clip" /> {rep.imported} / {rep.updated} / {rep.skipped} / {rep.rejected} / {rep.nearDup} <span className="muted">({u('repKey')})</span></p>}
        {cust.some((c) => c.ref) && <button className="ghost" onClick={async () => { if (confirm(u('delImp') + '?')) { for (const c of cust.filter((x) => x.ref)) await db.remove('exercises', c.id); load(); } }}><I n="trash" /> {u('delImp')} ({cust.filter((c) => c.ref).length})</button>}
      </div>
      {form ? (
        <>
          <input placeholder={T('exName')} value={n} onChange={(e) => setN(e.target.value)} />
          <select value={m} onChange={(e) => setM(e.target.value)}>{MUSCLES.map((k) => <option key={k} value={k}>{T(k)}</option>)}</select>
          <textarea rows={4} placeholder={T('exSteps')} value={st} onChange={(e) => setSt(e.target.value)} />
          <button className="primary" onClick={saveCustom}><I n="save" /> {T('save')}</button>
        </>
      ) : <button onClick={() => setForm(true)}><I n="plus" /> {T('newEx')}</button>}
    </section>
  );
}
