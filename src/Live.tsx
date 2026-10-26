import { useEffect, useRef, useState } from 'react';
import { Lang } from './i18n';
import { EXERCISES } from './exercises';
import { META } from './exerciseMeta';
import ExerciseMedia from './ExerciseMedia';
import * as L from './liveLogic';
import * as db from './db';

const V: Record<string, [string, string]> = {
  ex:['تمرين','Exercise'], sets:['مجموعات','Sets'], plan:['المخطط','Planned'], actual:['الفعلي','Actual'], reps:['تكرار','reps'], kg:['كغم','kg'], rest:['راحة','Rest'],
  restDone:['انتهت الراحة ✅','Rest over ✅'], next:['التالي','Next'], none:['— آخر تمرين —','— last exercise —'], skipEx:['تخطي التمرين','Skip exercise'], skipped:['تم تخطيه','Skipped'],
  unskip:['إلغاء التخطي','Undo skip'], addSet:['+ مجموعة','+ Set'], delSet:['− مجموعة','− Set'], done:['تم','Done'], undo:['تعديل','Edit'], rpe:['جهد (اختياري)','RPE (optional)'],
  note:['ملاحظة','Note'], warm:['إحماء','Warm-up'], pain:['🤕 ألم','🤕 Pain'], pause:['إيقاف مؤقت','Pause'], resume:['متابعة','Resume'], paused:['الجلسة متوقفة مؤقتاً','Session paused'],
  finish:['إنهاء وحفظ','Finish & save'], abandon:['التخلي عن الجلسة','Abandon session'], confAb:['التخلي عن هذه الجلسة؟ ستُحذف المجموعات غير المحفوظة نهائياً.','Abandon this session? Unsaved sets are deleted permanently.'],
  auto:['بدء الراحة تلقائياً','Auto-start rest'], media:['الرسم التوضيحي','Illustration'], prev:['آخر مرة','Last time'], planned:['مخطط','plan'],
  sug:['اقتراح (ليس رقماً قياسياً)','Suggestion (not a record)'], up:['زيادة الحمل إلى','increase load to'], keep:['ثبّت الحمل عند','stay at'], more:['حاول زيادة تكرار','try one more rep'],
  hold:['انخفض الأداء: لا زيادة','Performance dropped: no increase'], painS:['سجّلت ألماً: لا زيادة','Pain logged: no increase'], accept:['قبول','Accept'], dismiss:['تجاهل','Dismiss'],
  addEx:['إضافة تمرين','Add exercise'], rmEx:['إزالة التمرين','Remove exercise'], disc:['الاقتراحات إرشادية فقط. توقف عند الألم ولا تتمرّن رغمه.','Suggestions are guidance only. Stop at pain; never train through it.'],
  alert:['تنبيه عند انتهاء الراحة (حيث يدعمه جهازك)','Alert when rest ends (where your device supports it)'], alertNote:['الاهتزاز والإشعارات قد لا تعمل في iPhone Safari؛ اعتمد على الشاشة.','Vibration/notifications may not work in iPhone Safari; rely on the screen.'],
  sumT:['ملخص الجلسة','Session summary'], dur:['المدة','Duration'], exs:['تمارين مكتملة','Exercises done'], st:['مجموعات مكتملة','Sets done'], rp:['تكرارات','Total reps'], vol:['الحجم (كغم × تكرار)','Volume (kg × reps)'],
  noLoad:['لا بيانات حمل كافية','not enough load data'], sk:['تمارين متخطاة','Skipped'], pr:['رقم شخصي مؤكد (أثقل مجموعة مكتملة)','Confirmed personal record (heaviest completed set)'], close:['إغلاق','Close'],
};
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const hms = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}:` : '') + mmss(s % 3600);

export function SummaryCard({ lang, s, nm, onClose }: { lang: Lang; s: any; nm: (id: string) => string; onClose: () => void }) {
  const i = lang === 'ar' ? 0 : 1, v = (k: string) => V[k][i];
  return (
    <section className="card pop">
      <h2>🏁 {v('sumT')}</h2>
      <div className="grid2">
        <div className="stat">⏱️ {v('dur')}<b>{hms(s.durationSec)}</b></div><div className="stat">💪 {v('exs')}<b>{s.exercises}</b></div>
        <div className="stat">✅ {v('st')}<b>{s.sets}</b></div><div className="stat">🔁 {v('rp')}<b>{s.reps}</b></div>
        <div className="stat">📦 {v('vol')}<b>{s.volume ?? '—'}</b>{s.volume == null && <span className="muted">{v('noLoad')}</span>}</div><div className="stat">⏭️ {v('sk')}<b>{s.skipped}</b></div>
      </div>
      {s.prs.map((id: string) => <p key={id}>🏆 {nm(id)} — {v('pr')}</p>)}
      <button onClick={onClose}>{v('close')}</button>
    </section>
  );
}

export default function Live({ lang, draft, save, hist, suggest, nm, cust, onFinish, onAbandon }: any) {
  const i = lang === 'ar' ? 0 : 1, v = (k: string) => V[k][i];
  const [now, setNow] = useState(Date.now());
  const [dis, setDis] = useState<string[]>([]);
  const [showMedia, setShowMedia] = useState(true);
  const [alertOn, setAlertOn] = useState(false);
  const [pick, setPick] = useState('');
  const lock = useRef(0), fin = useRef(false);
  const d = draft;
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); const vis = () => setNow(Date.now()); document.addEventListener('visibilitychange', vis); return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); }; }, []);
  useEffect(() => {
    const nd = L.dueRest(d, now);
    if (!nd) return;
    save(nd);
    if (alertOn) { try { (navigator as any).vibrate?.(300); } catch {} try { if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('IRON PATH', { body: v('restDone') }); } catch {} }
  }, [now]);
  const tap = () => { const t = Date.now(); if (t - lock.current < 400) return false; lock.current = t; return true; };
  const cur = Math.min(d.cur ?? 0, d.entries.length - 1), e = d.entries[cur];
  const mut = (fn: (c: any) => void) => { const c = clone(d); fn(c); save(c); };
  const left = L.restLeft(d.rest, now), r = d.rest, el = L.elapsedSec(d, now);
  const total = d.entries.reduce((a: number, x: any) => a + (x.skipped ? 0 : x.sets.length), 0), done = d.entries.reduce((a: number, x: any) => a + x.sets.filter((s: any) => s.done).length, 0);
  const bi = e && (EXERCISES as any[]).find((x) => x.id === e.exId);
  const meta = e && META[e.exId];
  const nxt = d.entries[cur + 1];
  const name = (id: string) => { const b = (EXERCISES as any[]).find((x) => x.id === id); return b ? `${b.ar} · ${b.en}` : nm(id); };
  const prevE = e ? hist.map((s: any) => ({ date: s.date, e: s.entries.find((x: any) => x.exId === e.exId) })).find((x: any) => x.e && x.e.sets.length) : null;
  const sg = e ? suggest(e.exId, e.plan?.repMax ?? 10) : null;
  const adj = (si: number, f: 'reps' | 'kg', by: number) => { if (!tap()) return; mut((c) => { const s = c.entries[cur].sets[si]; const n = Math.max(0, (+s[f] || 0) + by); s[f] = String(f === 'kg' ? Math.round(n * 10) / 10 : n); }); };
  const setF = (si: number, patch: any) => mut((c) => Object.assign(c.entries[cur].sets[si], patch));
  const finish = async () => {
    if (fin.current) return; fin.current = true;
    const { session, summary } = L.finishSession(d, hist, Date.now(), crypto.randomUUID());
    try { if (session.entries.length) await db.put('workouts', session); await db.remove('workouts', 'draft'); onFinish(summary); } catch { fin.current = false; }
  };
  const addEx = (id: string) => { if (!id) return; mut((c) => { c.entries.push({ exId: id, plan: { sets: 3, repMin: 10, repMax: 10, rest: 90 }, sets: Array.from({ length: 3 }, () => ({ kg: '', reps: '10', pr: '10', done: false })) }); c.cur = c.entries.length - 1; }); setPick(''); };
  if (!e) return <section className="card"><button onClick={() => onAbandon()}>{v('abandon')}</button><select value={pick} onChange={(ev) => addEx(ev.target.value)}><option value="">➕ {v('addEx')}</option>{(EXERCISES as any[]).map((x) => <option key={x.id} value={x.id}>{x[lang]}</option>)}</select></section>;
  const ps = d.pausedAt != null;
  return (
    <section className="card" aria-live="polite">
      <div className="row" style={{ alignItems: 'center' }}>
        <b style={{ flex: 1 }}>🔥 {v('ex')} {cur + 1}/{d.entries.length} · {v('sets')} {done}/{total}</b>
        <span>⏱️ {hms(el)}</span>
      </div>
      <div className="bar"><i style={{ width: (total ? (done / total) * 100 : 0) + '%' }} /></div>
      {ps && <p className="warn">⏸️ {v('paused')} <button onClick={() => save(L.resumeSession(d, Date.now()))}>▶ {v('resume')}</button></p>}
      {!ps && <button className="ghost" onClick={() => save(L.pauseSession(d, Date.now()))}>⏸ {v('pause')}</button>}
      {r && (
        <div className={'timer' + (r.done ? ' flash' : '')}>
          <b style={{ fontSize: '1.6rem' }}>⏱️ {r.done ? v('restDone') : mmss(left)}</b>
          <span className="row" style={{ flexWrap: 'wrap' }}>
            {!r.done && (r.left != null ? <button className="chip" onClick={() => save(L.resumeRest(d, Date.now()))}>▶ {v('resume')}</button> : <button className="chip" onClick={() => save(L.pauseRest(d, Date.now()))}>⏸ {v('pause')}</button>)}
            <button className="chip" onClick={() => save(L.addRest(d, 15, Date.now()))}>+15s</button>
            <button className="chip" onClick={() => save(L.skipRest(d))}>⏭ {r.done ? v('close') : v('rest') + ' ✕'}</button>
          </span>
        </div>)}
      <div className="ent">
        <b style={{ fontSize: '1.15rem' }}>{name(e.exId)}</b>
        {e.plan && <span className="muted">{v('plan')}: {e.plan.sets} × {e.plan.repMin}–{e.plan.repMax} · {v('rest')} {e.plan.rest}s{e.sets[0]?.pk ? ` · ${e.sets[0].pk} ${v('kg')} (${v('planned')})` : ''}</span>}
        <button className="ghost" onClick={() => setShowMedia(!showMedia)}>🖼️ {v('media')}</button>
        {showMedia && <ExerciseMedia exId={e.exId} lang={lang} primary={meta ? [meta[0]] : []} secondary={meta ? meta[1].split(',').filter(Boolean) : []} />}
        {prevE && <p className="muted">🕘 {v('prev')} ({A_day(prevE.date)}): {prevE.e.sets.map((s: any) => `${s.reps}×${s.kg || 0}`).join(' · ')}</p>}
        {sg && !dis.includes(e.exId) && (
          <div className="sug"><span>💡 {v('sug')}: {sg.k === 'up' ? `${v('up')} ${sg.kg} ${v('kg')}` : sg.k === 'keep' ? `${v('keep')} ${sg.kg} ${v('kg')}` : sg.k === 'more' ? v('more') : sg.k === 'pain' ? v('painS') : v('hold')}</span>
            {(sg.k === 'up' || sg.k === 'more') && <button onClick={() => { mut((c) => c.entries[cur].sets.forEach((s: any) => { if (!s.done) { if (sg.k === 'up') s.kg = String(sg.kg); else s.reps = String((+s.reps || 0) + 1); } })); setDis([...dis, e.exId]); }}>✔ {v('accept')}</button>}
            <button className="ghost" onClick={() => setDis([...dis, e.exId])}>✕ {v('dismiss')}</button></div>)}
        {e.skipped ? <p className="warn">⏭️ {v('skipped')} <button className="ghost" onClick={() => mut((c) => { c.entries[cur].skipped = false; })}>{v('unskip')}</button></p> : e.sets.map((s: any, si: number) => (
          <div key={si} className={'setcard' + (s.done ? ' done' : '')}>
            <div className="row" style={{ alignItems: 'center' }}><b>#{si + 1}</b><span className="muted" style={{ flex: 1 }}>{v('planned')}: {s.pr ?? '—'} {v('reps')}{s.pk ? ` × ${s.pk} ${v('kg')}` : ''} → {v('actual')}</span>{s.done && <span>✅</span>}</div>
            <div className="row" style={{ justifyContent: 'space-around', flexWrap: 'wrap' }}>
              <span className="stepper"><button className="ghost big" disabled={ps} onClick={() => adj(si, 'reps', -1)}>−</button><input inputMode="numeric" aria-label={v('reps')} value={s.reps} disabled={ps} onChange={(ev) => setF(si, { reps: ev.target.value })} /><button className="ghost big" disabled={ps} onClick={() => adj(si, 'reps', 1)}>+</button><small>{v('reps')}</small></span>
              <span className="stepper"><button className="ghost big" disabled={ps} onClick={() => adj(si, 'kg', -2.5)}>−</button><input inputMode="decimal" aria-label={v('kg')} value={s.kg} disabled={ps} onChange={(ev) => setF(si, { kg: ev.target.value })} /><button className="ghost big" disabled={ps} onClick={() => adj(si, 'kg', 2.5)}>+</button><small>{v('kg')}</small></span>
            </div>
            <div className="row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
              {s.done ? <button className="ghost big" disabled={ps} onClick={() => { if (tap()) save(L.undoSet(d, cur, si)); }}>↺ {v('undo')}</button> : <button className="big" style={{ flex: 1 }} disabled={ps} onClick={() => { if (tap()) save(L.completeSet(d, cur, si, Date.now())); }}>✓ {v('done')}</button>}
              <select aria-label={v('rpe')} value={s.rpe ?? ''} onChange={(ev) => setF(si, { rpe: ev.target.value })}><option value="">RPE —</option>{[6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>RPE {n}</option>)}</select>
              <button className="ghost" onClick={() => { const t = prompt(v('note'), s.note ?? ''); if (t !== null) setF(si, { note: t }); }}>📝{s.note ? '•' : ''}</button>
              <button className={s.warm ? 'chip on' : 'chip'} disabled={s.done} onClick={() => setF(si, { warm: !s.warm })}>{v('warm')}</button>
            </div>
          </div>))}
        {!e.skipped && <div className="row"><button className="ghost" onClick={() => { if (tap()) mut((c) => { const l = c.entries[cur].sets.slice(-1)[0]; c.entries[cur].sets.push({ kg: l?.kg ?? '', pk: l?.pk, reps: l?.reps ?? '10', pr: l?.pr, done: false }); }); }}>{v('addSet')}</button>
          <button className="ghost" disabled={!e.sets.length || e.sets[e.sets.length - 1].done} onClick={() => { if (tap()) mut((c) => { c.entries[cur].sets.pop(); }); }}>{v('delSet')}</button>
          <button className="ghost" onClick={() => mut((c) => { c.entries[cur].skipped = true; if (cur < c.entries.length - 1) c.cur = cur + 1; })}>⏭ {v('skipEx')}</button></div>}
        <div className="row"><input placeholder={'📝 ' + v('note')} value={e.note ?? ''} onChange={(ev) => mut((c) => { c.entries[cur].note = ev.target.value; })} /><button className={e.pain ? 'danger' : 'ghost'} onClick={() => mut((c) => { c.entries[cur].pain = !c.entries[cur].pain; })}>{v('pain')}</button></div>
      </div>
      <div className="row"><button className="ghost big" disabled={cur === 0} onClick={() => mut((c) => { c.cur = cur - 1; })}>{lang === 'ar' ? '→' : '←'}</button>
        <span className="muted" style={{ flex: 1, textAlign: 'center' }}>{v('next')}: {nxt ? name(nxt.exId) : v('none')}</span>
        <button className="big" disabled={cur >= d.entries.length - 1} onClick={() => mut((c) => { c.cur = cur + 1; })}>{lang === 'ar' ? '←' : '→'}</button></div>
      <select value={pick} onChange={(ev) => addEx(ev.target.value)}><option value="">➕ {v('addEx')}</option>{[...(EXERCISES as any[]).map((x) => ({ id: x.id, name: x[lang] })), ...cust.map((c: any) => ({ id: c.id, name: c.name }))].map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      {d.entries.length > 1 && <button className="ghost" onClick={() => mut((c) => { c.entries.splice(cur, 1); c.cur = Math.max(0, cur - 1); })}>🗑️ {v('rmEx')}</button>}
      <label className="row"><input type="checkbox" checked={d.autoRest !== false} onChange={(ev) => mut((c) => { c.autoRest = ev.target.checked; })} style={{ flex: 'none', minHeight: 0 }} /> {v('auto')}</label>
      <label className="row"><input type="checkbox" checked={alertOn} onChange={(ev) => { setAlertOn(ev.target.checked); if (ev.target.checked && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); }} style={{ flex: 'none', minHeight: 0 }} /> {v('alert')}</label>
      <p className="muted">{v('alertNote')}</p><p className="muted">⚠️ {v('disc')}</p>
      <button className="big" onClick={finish}>💾 {v('finish')}</button>
      <button className="ghost" onClick={() => { if (confirm(v('confAb'))) onAbandon(); }}>🗑️ {v('abandon')}</button>
    </section>
  );
}
const A_day = (iso: string) => new Date(iso).toLocaleDateString('sv');
