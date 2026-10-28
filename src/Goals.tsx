import { useEffect, useRef, useState } from 'react';
import { Lang } from './i18n';
import { EXERCISES, MUSCLES } from './exercises';
import { P0, estimate } from './nutri';
import { dailyNutrition, ld } from './analytics';
import { Goal, R0, Rem, achievements, due, newlyUnlocked, progress, weekOf } from './goals';
import { t } from './i18n';
import * as db from './db';
import { I } from './Icon';

const G: Record<string, [string, string]> = {
  title:['الأهداف والإنجازات','Goals & achievements'], week:['الأسبوع','Week'], ach:['الإنجازات','Achievements'], rem:['التذكيرات','Reminders'],
  wsd:['بداية الأسبوع','Week starts on'], none:['لا توجد أهداف. أضف هدفك الأول.','No goals yet. Add your first goal.'], add:['إضافة هدف','Add goal'], target:['الهدف','Target'], save:['حفظ','Save'],
  workouts:['عدد التمارين','Workouts'], muscle:['جلسات لعضلة','Sessions for a muscle'], volume:['حجم التدريب (كغم × تكرار)','Training volume (kg × reps)'], meals:['أيام تسجيل الطعام','Days with food logged'],
  protein:['أيام بلوغ البروتين (≥90% من الهدف)','Days reaching protein (≥90% of target)'], weigh:['أيام تسجيل الوزن','Days with a weigh-in'],
  remain:['متبقٍ','left'], daysLeft:['أيام متبقية في الأسبوع','days left this week'], done:['اكتمل ','Complete '], na:['أكمل ملف التغذية لقياس هذا الهدف','Complete your nutrition profile to measure this goal'],
  volGate:['هدف الحجم يحتاج جلسات في أسبوعين على الأقل لتقدير هدف واقعي.','A volume goal needs sessions in at least 2 weeks to set a realistic target.'],
  last:['ملخص الأسبوع الماضي','Last week summary'], met:['أهداف مكتملة','goals met'], del:['حذف هذا الهدف؟','Delete this goal?'], motiv:['رسائل تحفيزية','Motivational messages'],
  m1:['أكملت أهداف أسبوعك. الراحة والتعافي جزء من التقدم.','You completed this week’s goals. Rest and recovery are part of progress.'], m2:['تقدّم جيد. حافظ على وتيرة مريحة وآمنة.','Good progress. Keep a comfortable, safe pace.'],
  prompts:['إشعارات الإنجازات داخل التطبيق','Achievement prompts in the app'], unlocked:['تم فتح إنجاز جديد!','New achievement unlocked!'], locked:['مقفل','Locked'],
  first_workout:['أول تمرين مكتمل','First completed workout'], sessions_10:['10 جلسات مكتملة','10 completed sessions'], sessions_25:['25 جلسة مكتملة','25 completed sessions'],
  first_week:['أول أسبوع تدريب كامل (أنهيت كل أيام خطتك أو بلغت هدف الأسبوع)','First complete training week (all plan days, or your weekly goal)'],
  consistency_4w:['انتظام: جلستان على الأقل في 4 أسابيع متتالية','Consistency: 2+ sessions in 4 consecutive weeks'], first_pr:['أول رقم شخصي (مجموعة أثقل من أدائك السابق)','First personal record (heavier set than before)'],
  log_7:['تسجيل الطعام في 7 أيام','Food logged on 7 days'], log_30:['تسجيل الطعام في 30 يوماً','Food logged on 30 days'], weigh_4w:['تسجيل الوزن في 4 أسابيع متتالية','Weight logged in 4 consecutive weeks'],
  achNote:['تعتمد الإنجازات على الانتظام والتسجيل فقط، لا على تقليل السعرات أو زيادة التمرين أو التمرّن مع الألم.','Achievements reward consistency and logging only, never calorie restriction, extra training or training through pain.'],
  master:['تفعيل التذكيرات','Enable reminders'], quiet:['ساعات الهدوء','Quiet hours'], from:['من','From'], to:['إلى','To'], time:['الوقت','Time'], every:['كل (يوم)','Every (days)'],
  workout:['تذكير بتمرين اليوم','Today’s workout'], upcoming:['تذكير بتمرين الغد','Tomorrow’s workout'], meal:['تسجيل الوجبات','Meal logging'], water:['شرب الماء','Water'],
  review:['مراجعة الأسبوع','Weekly review'], backup:['نسخة احتياطية','Backup'], cups:['أكواب اليوم','Cups today'], cupT:['هدف الأكواب','Cup target'], reset:['استعادة الإعدادات الافتراضية','Restore defaults'],
  confReset:['استعادة إعدادات التذكيرات الافتراضية؟','Restore default reminder settings?'],
  limits:['حدود مهمة: التذكيرات تظهر داخل التطبيق فقط عند فتحه. التطبيق لا يرسل إشعارات نظام iPhone، لأن ذلك يحتاج خادماً (Web Push) أو تطبيقاً أصلياً، ولا يدعم Safari جدولة إشعارات محلية في الخلفية. لم يُختبر أي إشعار على جهاز حقيقي.','Important: reminders only appear inside the app while it is open. It does not send iPhone system notifications: that needs a server (Web Push) or a native app, and Safari cannot schedule local background notifications. No notification has been tested on a real device.'],
  t_workout:['حان وقت تمرينك:','Time for your workout:'], t_upcoming:['تمرين الغد:','Tomorrow’s workout:'], t_meal:['لم تسجّل أي وجبة اليوم.','No meals logged today.'], t_water:['لم تبلغ هدف الماء اليوم.','Water target not reached today.'],
  t_review:['وقت مراجعة تقدمك الأسبوعي.','Time for your weekly progress review.'], t_backup:['صدّر نسخة احتياطية من المزيد ← بياناتي.','Export a backup from More → My Data.'],
  draft:['لديك جلسة تمرين غير مكتملة.','You have an unfinished workout session.'], resumeB:['متابعة الجلسة','Resume session'],
  ok:['تم','Done'], err:['خطأ: ','Error: '],
};
const WD = [0, 1, 2, 3, 4, 5, 6];
const ex = (id: string) => (EXERCISES as any[]).find((e) => e.id === id);

function useData() {
  const [S, setS] = useState<any>({ ready: false, ss: [], plans: [], active: '', goals: { id: 'goals', wsd: 6, items: [], motivation: true }, ach: { id: 'ach', unlocked: {}, prompts: true }, rem: R0, logs: [], prof: null, ws: [], cust: [], cups: 0, err: '' });
  const load = async () => {
    try {
      const pl = await db.getAll<any>('plans'), ns = await db.getAll<any>('nutrition');
      const today = ld(new Date());
      const wsAll = await db.getAll<any>('workouts');
      setS({ ready: true, err: '', hasDraft: wsAll.some((x) => x.id === 'draft'), ss: wsAll.filter((x) => x.id !== 'draft'), plans: pl.filter((x) => x.id.startsWith('plan:')), active: pl.find((x) => x.id === 'activePlan')?.planId ?? '',
        goals: { id: 'goals', wsd: 6, items: [], motivation: true, ...(pl.find((x) => x.id === 'goals') ?? {}) }, ach: { id: 'ach', unlocked: {}, prompts: true, ...(pl.find((x) => x.id === 'ach') ?? {}) },
        rem: { ...R0, ...(pl.find((x) => x.id === 'reminders') ?? {}), cats: { ...R0.cats, ...(pl.find((x) => x.id === 'reminders')?.cats ?? {}) } },
        logs: ns.filter((x) => x.id.startsWith('log:')), prof: ns.find((x) => x.id === 'profile')?.profile ?? null, cups: ns.find((x) => x.id === 'water:' + today)?.cups ?? 0,
        ws: await db.getAll<any>('measurements'), cust: await db.getAll<any>('exercises') });
    } catch (e: any) { setS((p: any) => ({ ...p, ready: true, err: e.message })); }
  };
  useEffect(() => { load(); }, []);
  const put = async (store: 'plans' | 'nutrition', rec: any) => { try { await db.put(store, rec); await load(); } catch (e: any) { setS((p: any) => ({ ...p, err: e.message })); } };
  const pr = S.prof ? { ...P0, ...S.prof } : null, est = pr ? estimate(pr) : null;
  const pTarget = pr ? pr.manual?.p ?? est?.p ?? null : null;
  const data = { ss: S.ss, daily: dailyNutrition(S.logs), ws: S.ws, pTarget, mOf: (id: string) => ex(id)?.m ?? S.cust.find((c: any) => c.id === id)?.muscle };
  return { S, put, data, act: S.plans.find((p: any) => p.id === S.active), load };
}

export function Banner({ lang, tab, onGo }: { lang: Lang; tab?: string; onGo?: () => void }) {
  const i = lang === 'ar' ? 0 : 1, g = (k: string) => G[k]?.[i] ?? k;
  const { S, put, data, act } = useData();
  const [hid, setHid] = useState<string[]>([]);
  if (!S.ready) return null;
  const resume = S.hasDraft && tab !== 'wk' ? <div className="card" style={{ marginBottom: 12 }} role="status"><div className="row srow"><span style={{ flex: 1 }}><I n="flame" /> {g('draft')}</span><button onClick={onGo}>{g('resumeB')}</button></div></div> : null;
  if (!S.rem.master) return resume;
  const n = new Date(), date = ld(n);
  const list = due(S.rem, { date, hm: n.toTimeString().slice(0, 5), dow: n.getDay() }, { plan: act, ss: S.ss, mealsToday: !!data.daily[date], cups: S.cups }).filter((x) => !hid.includes(x.key));
  if (!list.length) return resume;
  return (
    <>{resume}<div className="card" style={{ marginBottom: 12 }} role="status">
      {list.slice(0, 3).map((x) => (
        <div key={x.key} className="row srow"><span style={{ flex: 1 }}><I n="bell" /> {g('t_' + x.cat)} {x.day ? x.day.split('|')[i] : ''}</span>
          {x.cat === 'water' && <button className="ghost" onClick={() => put('nutrition', { id: 'water:' + date, date, cups: S.cups + 1 })}>+<I n="drop" /></button>}
          <button className="ghost" onClick={() => { setHid([...hid, x.key]); put('plans', { ...S.rem, seen: { ...S.rem.seen, [x.cat + ':' + date]: Date.now() } }); }}>{g('ok')}</button></div>))}
    </div></>
  );
}

export default function Goals({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1, g = (k: string) => G[k]?.[i] ?? k, T = (k: any) => t(lang, k);
  const { S, put, data, act } = useData();
  const [view, setView] = useState<'week' | 'ach' | 'rem'>('week');
  const [form, setForm] = useState<any>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  const busy = useRef(false);
  const today = ld(new Date());
  const wdn = (d: number) => new Date(2024, 0, 7 + d).toLocaleDateString(lang, { weekday: 'long' });
  const A = S.ready ? achievements({ ...data, plans: S.plans, goals: S.goals.items, wsd: S.goals.wsd }, today) : [];
  const nu = S.ready ? newlyUnlocked(A, S.ach.unlocked) : [];
  useEffect(() => {
    if (!nu.length || busy.current) return;
    busy.current = true;
    const un = { ...S.ach.unlocked }; nu.forEach((k) => { un[k] = { date: today }; });
    put('plans', { ...S.ach, unlocked: un }).then(() => { if (S.ach.prompts) setFresh(nu); busy.current = false; });
  }, [nu.join(',')]);
  if (!S.ready) return <section className="card"><p className="muted"><I n="hourglass" /></p></section>;

  const tabs = <div className="chips">{(['week', 'ach', 'rem'] as const).map((v) => <button key={v} className={'chip' + (view === v ? ' on' : '')} onClick={() => setView(v)}>{g(v)}</button>)}</div>;
  const wsd: number = S.goals.wsd, gl: Goal[] = S.goals.items;
  const saveGoals = (p: any) => put('plans', { ...S.goals, ...p });
  const nm = (m: string) => T(m);
  const label = (x: Goal) => `${g(x.type)}${x.type === 'muscle' ? ' · ' + nm(x.muscle!) : ''}`;

  if (view === 'ach') return (
    <section className="card">{tabs}
      {fresh.length > 0 && <p className="warn pop"><I n="party" /> {g('unlocked')} {fresh.map((k) => g(k)).join(' · ')}</p>}
      <label className="row"><input type="checkbox" checked={S.ach.prompts} onChange={(e) => put('plans', { ...S.ach, prompts: e.target.checked })} style={{ flex: 'none', minHeight: 0 }} /> {g('prompts')}</label>
      {A.map((a) => { const u = S.ach.unlocked[a.key]; return (
        <div key={a.key} className="ent" style={u ? undefined : { opacity: 0.85 }}>
          <b>{u ? <I n="medal" /> : <I n="lock" />} {g(a.key)}</b>
          {u ? <span className="muted">{u.date}</span> : <><div className="bar"><i style={{ width: (a.value / a.target) * 100 + '%' }} /></div><span className="muted">{a.value}/{a.target}</span></>}
        </div>); })}
      <p className="muted">{g('achNote')}</p>
    </section>);

  if (view === 'rem') {
    const R: Rem = S.rem, sv = (p: Partial<Rem>) => put('plans', { ...R, ...p });
    const cat = (c: string, p: any) => sv({ cats: { ...R.cats, [c]: { ...R.cats[c], ...p } } });
    return (
      <section className="card">{tabs}
        <p className="warn">{g('limits')}</p>
        <label className="row"><input type="checkbox" checked={R.master} onChange={(e) => sv({ master: e.target.checked })} style={{ flex: 'none', minHeight: 0 }} /> <b>{g('master')}</b></label>
        <div className="row"><label style={{ flex: 1 }}>{g('quiet')} · {g('from')}<input type="time" value={R.quiet.from} onChange={(e) => sv({ quiet: { ...R.quiet, from: e.target.value } })} /></label>
          <label style={{ flex: 1 }}>{g('to')}<input type="time" value={R.quiet.to} onChange={(e) => sv({ quiet: { ...R.quiet, to: e.target.value } })} /></label></div>
        {['workout', 'upcoming', 'meal', 'water', 'review', 'backup'].map((c) => { const x = R.cats[c]; return (
          <div key={c} className="ent">
            <label className="row"><input type="checkbox" checked={x.on} onChange={(e) => cat(c, { on: e.target.checked })} style={{ flex: 'none', minHeight: 0 }} /> <b>{g(c)}</b></label>
            {x.on && <>
              <input type="time" value={x.time} onChange={(e) => cat(c, { time: e.target.value })} />
              {c === 'backup' ? <label>{g('every')}<select value={x.every ?? 7} onChange={(e) => cat(c, { every: +e.target.value })}>{[3, 7, 14, 30].map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
                : <div className="chips">{WD.map((d) => <button key={d} className={'chip' + (x.days.includes(d) ? ' on' : '')} onClick={() => cat(c, { days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d] })}>{wdn(d).slice(0, 3)}</button>)}</div>}</>}
          </div>); })}
        <div className="ent"><b><I n="drop" /> {g('cups')}: {S.cups} / {R.waterTarget}</b>
          <div className="row"><button className="ghost" onClick={() => put('nutrition', { id: 'water:' + today, date: today, cups: Math.max(0, S.cups - 1) })}>−</button>
            <button onClick={() => put('nutrition', { id: 'water:' + today, date: today, cups: S.cups + 1 })}>+ <I n="drop" /></button></div>
          <label>{g('cupT')}<input inputMode="numeric" value={R.waterTarget} onChange={(e) => sv({ waterTarget: Math.max(1, +e.target.value || 1) })} /></label></div>
        <button className="ghost" onClick={() => confirm(g('confReset')) && put('plans', { ...R0, lastBackup: R.lastBackup })}>{g('reset')}</button>
      </section>);
  }

  const cur = weekOf(today, wsd, 0), prv = weekOf(today, wsd, -1);
  const weeksWithData = new Set(S.ss.map((s: any) => weekOf(ld(new Date(s.date)), wsd, 0)[0])).size;
  const res = gl.map((x) => ({ x, p: progress(x, data, cur) }));
  const lastMet = gl.filter((x) => { const p = progress(x, data, prv); return p.value != null && p.pct >= 100; }).length;
  const daysLeft = Math.max(0, Math.round((Date.parse(cur[1]) - Date.parse(today)) / 864e5));
  const msg = S.goals.motivation !== false && gl.length ? (res.every((r) => r.p.pct >= 100) ? g('m1') : res.some((r) => r.p.pct > 0) ? g('m2') : '') : '';
  const saveGoal = () => {
    const tg = +form.target;
    if (!(tg > 0)) return;
    saveGoals({ items: [...gl, { id: crypto.randomUUID(), type: form.type, target: tg, ...(form.type === 'muscle' ? { muscle: form.muscle } : {}) }] }).then(() => setForm(null));
  };
  return (
    <section className="card">{tabs}
      {S.err && <p className="warn">{g('err')}{S.err}</p>}
      <h3><I n="target" /> {cur[0]} → {cur[1]}</h3>
      <label>{g('wsd')}<select value={wsd} onChange={(e) => saveGoals({ wsd: +e.target.value })}>{WD.map((d) => <option key={d} value={d}>{wdn(d)}</option>)}</select></label>
      {gl.length === 0 && <p className="muted">{g('none')}</p>}
      {res.map(({ x, p }) => (
        <div key={x.id} className={'ent' + (p.pct >= 100 ? ' pop' : '')}>
          <div className="row"><b style={{ flex: 1 }}>{label(x)}</b><button className="ghost" onClick={() => confirm(g('del')) && saveGoals({ items: gl.filter((y) => y.id !== x.id) })}><I n="trash" /></button></div>
          {p.value == null ? <p className="muted">{g('na')}</p> : <>
            <div className="bar"><i style={{ width: p.pct + '%' }} /></div>
            <span className="muted">{p.value}/{p.target} · {p.pct}% · {p.pct >= 100 ? g('done') : `${p.remaining} ${g('remain')} · ${daysLeft} ${g('daysLeft')}`}</span></>}
        </div>))}
      {msg && <p className="muted"><I n="msg" /> {msg}</p>}
      {gl.length > 0 && <p className="muted"><I n="clip" /> {g('last')} ({prv[0]} → {prv[1]}): {lastMet}/{gl.length} {g('met')}</p>}
      {form ? (
        <div className="ent">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['workouts', 'muscle', 'volume', 'meals', 'protein', 'weigh'].map((k) => <option key={k} value={k} disabled={k === 'volume' && weeksWithData < 2}>{g(k)}</option>)}</select>
          {weeksWithData < 2 && <span className="muted">{g('volGate')}</span>}
          {form.type === 'muscle' && <select value={form.muscle} onChange={(e) => setForm({ ...form, muscle: e.target.value })}>{MUSCLES.map((m) => <option key={m} value={m}>{nm(m)}</option>)}</select>}
          <label>{g('target')}<input inputMode="numeric" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></label>
          <button className="primary" onClick={saveGoal}><I n="save" /> {g('save')}</button><button className="ghost" onClick={() => setForm(null)}><I n="x" /></button>
        </div>) : <button onClick={() => setForm({ type: 'workouts', muscle: 'chest', target: '3' })}><I n="plus" /> {g('add')}</button>}
      <label className="row"><input type="checkbox" checked={S.goals.motivation !== false} onChange={(e) => saveGoals({ motivation: e.target.checked })} style={{ flex: 'none', minHeight: 0 }} /> {g('motiv')}</label>
    </section>);
}
