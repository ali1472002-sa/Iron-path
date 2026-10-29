import { useEffect, useMemo, useState } from 'react';
import { Lang, t } from './i18n';
import { EXERCISES, MUSCLES } from './exercises';
import { META, POSE, TIPS, LB, U } from './exerciseMeta';
import { DETAIL, PAT, dose, MUSCLE_REVIEW } from './gymLib';
import { normText, fromFedb, reconcile, Report } from './refdata';
import { Figure } from './Figure';
import ExerciseMedia from './ExerciseMedia';
import { MEDIA } from './media';
import { DEFAULT, alts } from './planGen';
import * as db from './db';
import { I } from './Icon';
import MuscleMap from './Anatomy';

type Item = { id: string; name: string; muscle: string; steps: string[]; pose?: string; meta?: string[]; search: string; custom?: boolean; ref?: string };
const F0 = { m: 'all', eq: 'all', pt: 'all', lv: 'all' };
const OPT_EQ = ['machine', 'cable', 'smith', 'dumbbell', 'barbell', 'bodyweight', 'bar', 'band', 'kettlebell', 'other'];
const OPT_LV = ['b', 'i', 'a'];

// data status of a built-in exercise: text = setup/positions/steps/breathing/mistakes/safety all present
function dataStatus(id: string, pose?: string): 'full' | 'text' | 'part' {
  const d = DETAIL[id];
  const text = !!(d?.su && d.a && d.z && (TIPS[id] || (pose && POSE[pose])));
  return text && MEDIA[id] ? 'full' : text ? 'text' : 'part';
}

export default function Library({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const T = (k: any) => t(lang, k);
  const u = (k: string) => U[k]?.[i] ?? k;
  const lb = (k: string) => LB[k]?.[i] ?? k;
  const pl = (k: string) => PAT[k]?.[i] ?? k;
  const [q, setQ] = useState('');
  const [shown, setShown] = useState(40);
  const [rep, setRep] = useState<Report | null>(null);
  const [msg, setMsg] = useState('');
  const [flt, setFlt] = useState(F0);
  const [onlyFav, setOnlyFav] = useState(false);
  const [onlyMedia, setOnlyMedia] = useState(false);
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

  const all: Item[] = useMemo(() => [
    ...EXERCISES.map((e: any) => ({ id: e.id, name: e[lang], muscle: e.m, steps: e['s' + lang].split('|'), pose: e.p, meta: META[e.id],
      search: normText([e.ar, e.en, ...META[e.id][0].split(',').flatMap((k) => LB[k] ?? []), ...(LB[META[e.id][2]] ?? []), ...(PAT[DETAIL[e.id]?.pat] ?? [])].join(' ')) })),
    ...cust.map((c) => ({ id: c.id, name: c.name, muscle: c.muscle, steps: c.steps, meta: c.ref ? [c.pm, c.sm, c.eq, c.ty, c.lv] : undefined, search: normText(c.name), custom: !c.ref, ref: c.ref ? `${c.src} · ${c.license}` : undefined })),
  ], [lang, cust]);
  const patOpts = useMemo(() => Object.keys(PAT).filter((k) => (EXERCISES as any[]).some((e) => DETAIL[e.id]?.pat === k)), []);
  const items = all.filter((x) => x.search.includes(normText(q)) && (flt.m === 'all' || x.muscle === flt.m) &&
    (flt.eq === 'all' || x.meta?.[2] === flt.eq) && (flt.pt === 'all' || DETAIL[x.id]?.pat === flt.pt) && (flt.lv === 'all' || x.meta?.[4] === flt.lv) &&
    (!onlyFav || favs.includes(x.id)) && (!onlyMedia || !!MEDIA[x.id]));
  const filtered = q !== '' || onlyFav || onlyMedia || Object.values(flt).some((v) => v !== 'all');

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
    const bi = (EXERCISES as any[]).find((e) => e.id === x.id);
    const pi = x.pose ? POSE[x.pose] : TIPS[x.id] ?? null;
    const d = DETAIL[x.id];
    const status = bi ? dataStatus(x.id, x.pose) : null;
    const doses = bi && x.meta ? dose(x.meta[3], x.meta[2], x.meta[4]) : [];
    const sameGroup = bi ? alts(x.id, { ...DEFAULT, equip: 'gym' }).filter((id) => !(d?.al ?? []).includes(id)).slice(0, 4) : [];
    const nameOf = (id: string) => (EXERCISES as any[]).find((e) => e.id === id)?.[lang] ?? id;
    const stLabel = status === 'full' ? u('dataFull') : status === 'text' ? u('dataNoMedia') : u('dataPart');
    return (
      <>
        <section className="card">
          <div className="hd">
            <button className="ghost" onClick={() => setOpen('')}><I n="chevl" /> {u('back')}</button>
            <button className="ghost" aria-label={T('fav')} onClick={() => toggleFav(x.id)}><I n="star" s={22} className={favs.includes(x.id) ? 'fill' : ''} /></button>
          </div>
          <h2 style={{ fontSize: '1.2rem' }}>{bi ? (lang === 'ar' ? `${bi.ar} · ${bi.en}` : `${bi.en} · ${bi.ar}`) : x.name}</h2>
          {x.meta && <div className="chips wrap">{[x.meta[4], x.meta[2]].map((k) => <span key={k} className="chip on">{lb(k)}</span>)}{d && <span className="chip">{pl(d.pat)}</span>}{d?.uni && <span className="chip">{u('uniTag')}</span>}</div>}
          {status && <div className={'status ' + (status === 'full' ? 'ok' : status === 'text' ? 'mid' : 'low')}><I n={status === 'full' ? 'checkc' : 'info'} s={16} /> {stLabel}</div>}
          <ExerciseMedia exId={x.id} lang={lang} primary={x.meta ? x.meta[0].split(',') : []} secondary={x.meta ? x.meta[1].split(',').filter(Boolean) : []} />
          {!MEDIA[x.id] && <p className="muted"><I n="image" s={15} /> {u('noFig')}</p>}
          {x.ref && <p className="muted"><I n="book" s={15} /> {x.ref}</p>}
        </section>

        {x.meta && (
          <section className="card">
            <h3 style={{ margin: 0 }}><I n="target" s={18} /> {u('muscles')}</h3>
            <MuscleMap lang={lang} primary={x.meta[0].split(',')} secondary={x.meta[1].split(',').filter(Boolean)} />
            {d?.nd && <div className="box"><span className="l"><I n="dumbbell" s={15} /> {u('need')}</span><span>{d.nd[i]}</span></div>}
            <p className="muted"><I n="info" s={14} /> {x.ref ? u('muscleImp') : MUSCLE_REVIEW.has(x.id) ? u('muscleRev') : u('muscleNote')}</p>
          </section>
        )}

        {d?.su && (
          <section className="card">
            <h3 style={{ margin: 0 }}><I n="settings" s={18} /> {u('setup')}</h3>
            <p>{d.su[i]}</p>
            <div className="grid2">
              <div className="pos"><span className="l"><I n="play" s={13} /> {u('startP')}</span>{d.a?.[i]}</div>
              <div className="pos"><span className="l"><I n="flag" s={13} /> {u('endP')}</span>{d.z?.[i]}</div>
            </div>
          </section>
        )}

        <section className="card">
          <h3 style={{ margin: 0 }}><I n="clip" s={18} /> {u('steps')}</h3>
          <ol>{x.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
          {pi && <>
            <h3 style={{ margin: 0 }}><I n="wind" s={18} /> {u('breath')}</h3><p>{pi[0][i]}</p>
            <h3 style={{ margin: 0 }}><I n="warn" s={18} /> {u('mistakes')}</h3><ul className="plain">{pi[1][i].split('|').map((s, k) => <li key={k}>• {s}</li>)}</ul>
            <p className="warn"><I n="shield" s={16} /> <b>{u('safety')}:</b> {pi[2][i]}</p>
          </>}
        </section>

        {(doses.length > 0 || (d?.al?.length ?? 0) > 0 || sameGroup.length > 0) && (
          <section className="card">
            {doses.length > 0 && <>
              <h3 style={{ margin: 0 }}><I n="target" s={18} /> {u('doseT')}</h3>
              <div className="dose">
                {doses.map((r) => <span key={r.k} style={{ display: 'contents' }}><b>{u(r.k === 'str' ? 'dStr' : r.k === 'hyp' ? 'dHyp' : 'dEnd')}</b><span>{r.sets} {u('sets')} × {r.reps} {u('reps')} · {u('restW')} {r.rest}s</span></span>)}
              </div>
              <p className="muted">{u('doseNote')} {u('prog')}</p>
              {d?.uni && <p className="muted"><I n="repeat" s={14} /> {u('uni')}</p>}
            </>}
            {(d?.al?.length ?? 0) > 0 && <>
              <h3 style={{ margin: 0 }}><I n="refresh" s={18} /> {u('noMach')}</h3>
              <div className="chips wrap">{d!.al!.map((id) => <button key={id} className="chip" onClick={() => setOpen(id)}>{nameOf(id)}</button>)}</div>
            </>}
            {sameGroup.length > 0 && <>
              <h3 style={{ margin: 0 }}><I n="layers" s={18} /> {u('alts')}</h3>
              <div className="chips wrap">{sameGroup.map((id) => <button key={id} className="chip" onClick={() => setOpen(id)}>{nameOf(id)}</button>)}</div>
            </>}
          </section>
        )}

        <div className="row">
          <button className={plan.some((p) => p.exId === x.id) ? 'block' : 'primary block'} onClick={() => togglePlan(x.id)}><I n={plan.some((p) => p.exId === x.id) ? 'check' : 'plus'} /> {plan.some((p) => p.exId === x.id) ? u('inPlan') : u('addPlan')}</button>
          {x.custom && <button className="danger" aria-label="delete" onClick={async () => { await db.remove('exercises', x.id); setOpen(''); load(); }}><I n="trash" /></button>}
        </div>
      </>
    );
  }

  return (
    <section className="card">
      <input placeholder={T('search')} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="filters">
        <select aria-label={u('m')} value={flt.m} onChange={(e) => setFlt({ ...flt, m: e.target.value })}>
          <option value="all">{u('m')}: {u('all')}</option>{MUSCLES.map((k) => <option key={k} value={k}>{T(k)}</option>)}
        </select>
        <select aria-label={u('eq')} value={flt.eq} onChange={(e) => setFlt({ ...flt, eq: e.target.value })}>
          <option value="all">{u('eq')}: {u('all')}</option>{OPT_EQ.map((k) => <option key={k} value={k}>{lb(k)}</option>)}
        </select>
        <select aria-label={u('pat')} value={flt.pt} onChange={(e) => setFlt({ ...flt, pt: e.target.value })}>
          <option value="all">{u('pt')}: {u('all')}</option>{patOpts.map((k) => <option key={k} value={k}>{pl(k)}</option>)}
        </select>
        <select aria-label={u('lv')} value={flt.lv} onChange={(e) => setFlt({ ...flt, lv: e.target.value })}>
          <option value="all">{u('lv')}: {u('all')}</option>{OPT_LV.map((k) => <option key={k} value={k}>{lb(k)}</option>)}
        </select>
      </div>
      <div className="chips wrap">
        <button className={'chip' + (onlyFav ? ' on' : '')} onClick={() => setOnlyFav(!onlyFav)}><I n="star" s={15} /> {u('favOnly')}</button>
        <button className={'chip' + (onlyMedia ? ' on' : '')} onClick={() => setOnlyMedia(!onlyMedia)}><I n="image" s={15} /> {u('withMedia')}</button>
        {filtered && <button className="chip" onClick={() => { setQ(''); setFlt(F0); setOnlyFav(false); setOnlyMedia(false); }}><I n="x" s={15} /> {u('clear')}</button>}
      </div>
      <p className="muted">{items.length} {u('count')}{plan.length > 0 ? ` · ${u('plan')}: ${plan.length}` : ''}</p>
      <ul>
        {items.length === 0 && <li className="muted">{u('none')}</li>}
        {items.slice(0, shown).map((e) => {
          const g = e.meta ? DETAIL[e.id] : null;
          return (
            <li key={e.id} className="ex">
              <button className="exitem" onClick={() => setOpen(e.id)}>
                <span className="t"><span>{e.name}</span><small>{e.meta ? `${lb(e.meta[0])} · ${lb(e.meta[2])}` : T(e.muscle)}{g?.uni ? ` · ${u('uniTag')}` : ''}</small></span>
                {favs.includes(e.id) && <I n="star" s={15} className="fill mi" />}
                {MEDIA[e.id] && <I n="image" s={16} className="mi" />}
                <I n="chevr" s={18} className="chev" />
              </button>
            </li>
          );
        })}
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
