import { useEffect, useState } from 'react';
import { Lang, t } from './i18n';
import { EXERCISES, MUSCLES } from './exercises';
import { DEFAULT, Day, Plan, Profile, alts, generate } from './planGen';
import * as db from './db';

const P: Record<string, [string, string]> = {
  week:['الأسبوع','Week'], plans:['خططي','My plans'], newPlan:['إنشاء خطة','Create plan'], load:['جارٍ التحميل…','Loading…'], err:['خطأ: ','Error: '],
  noPlans:['لا توجد خطط بعد. أنشئ خطتك الأولى.','No plans yet. Create your first plan.'], noActive:['لا توجد خطة مفعّلة. فعّل خطة من تبويب خططي.','No active plan. Activate one in My plans.'],
  goal:['الهدف','Goal'], level:['الخبرة','Experience'], days:['أيام التدريب أسبوعياً','Training days per week'], dur:['مدة الجلسة (دقيقة)','Session length (min)'],
  equip:['المعدات','Equipment'], split:['نظام التقسيم (اختياري)','Split (optional)'], prio:['عضلات تريد التركيز عليها (اختياري)','Priority muscles (optional)'],
  avoid:['تمارين تتجنبها أو تسبب لك ألماً (اختياري)','Exercises to avoid or that cause pain (optional)'],
  gen:['توليد الخطة','Generate plan'], regen:['إعادة التوليد','Regenerate'], save:['حفظ','Save'], saveCopy:['حفظ كخطة جديدة','Save as new plan'], back:['رجوع','Back'],
  name:['اسم الخطة','Plan name'], nameReq:['أدخل اسماً للخطة','Enter a plan name'], activate:['تفعيل','Activate'], active:['مفعّلة ✔','Active ✔'], dup:['نسخ','Duplicate'], del:['حذف','Delete'], edit:['فتح وتعديل','Open & edit'],
  confirmDel:['حذف هذه الخطة؟ سجل تمارينك المكتمل لن يُحذف.','Delete this plan? Your completed workout history is kept.'],
  confirmSave:['سيتم استبدال التعديلات على هذه الخطة. متابعة؟','This will overwrite the saved plan. Continue?'],
  confirmReg:['سيُنشأ مقترح جديد ولن تتغير خطتك المحفوظة إلا إذا حفظته كخطة جديدة.','A new proposal is created; your saved plan stays unchanged unless you save it as new.'],
  sets:['مجموعات','sets'], rest:['راحة','rest'], swap:['استبدال','Swap'], rm:['حذف','Remove'], restDay:['😴 راحة','😴 Rest'], start:['ابدأ','Start'], toToday:['انقل لليوم','Move to today'],
  done:['✅ تم','✅ Done'], missed:['⚠️ فائت','⚠️ Missed'], thisWeek:['هذا الأسبوع','This week'], lastWeek:['الأسبوع الماضي','Last week'], planned:['مخطط','planned'], completed:['مكتمل','completed'],
  prog:['التدرّج: عند إكمال كل المجموعات بأعلى تكرار في النطاق، يقترح التطبيق زيادة صغيرة (2.5 كغم) وتقبلها أو تتجاهلها أنت. لا تُقترح زيادة بعد انخفاض الأداء أو تسجيل ألم. لا تتمرّن رغم الألم، وخفّف الحمل أو استبدل التمرين.',
        'Progression: when you complete every set at the top of the rep range, the app suggests a small increase (2.5 kg) that you can accept or dismiss. No increase is suggested after a performance drop or a pain note. Never train through pain; reduce load or swap the exercise.'],
  disc:['إرشاد لياقة عام وليس تشخيصاً أو علاجاً طبياً. استشر مختصاً عند وجود مرض أو إصابة.','General fitness guidance, not medical diagnosis or treatment. See a professional if you have an illness or injury.'],
  band:['مكتبة التمارين لا تحتوي تمارين بالأربطة بعد، فاستُخدمت تمارين وزن الجسم.','The library has no resistance-band exercises yet, so bodyweight exercises were used.'],
  miss:['لا توجد تمارين متاحة لعضلة','No available exercises for'], sec:['ث','s'],
  progOk:['الجلسات المرتبطة بالخطة','Sessions linked to the plan'],
};
const O: Record<string, [string, string, string][]> = {
  goal:[['hyp','ضخامة عضلية','Muscle hypertrophy'],['str','قوة','Strength'],['fat','خسارة دهون','Fat loss'],['gen','لياقة عامة','General fitness']],
  level:[['b','مبتدئ','Beginner'],['i','متوسط','Intermediate'],['a','متقدم','Advanced']],
  equip:[['gym','نادٍ كامل','Full gym'],['db','دمبل','Dumbbells'],['band','أربطة مقاومة','Resistance bands'],['bw','وزن الجسم','Bodyweight']],
  split:[['auto','تلقائي','Auto'],['full','جسم كامل','Full body'],['ul','علوي / سفلي','Upper / Lower'],['ppl','دفع / سحب / أرجل','Push / Pull / Legs']],
};
const ld = (d: Date) => d.toLocaleDateString('sv');
const ORDER = [6, 0, 1, 2, 3, 4, 5];

export default function PlanTab({ lang, onStart }: { lang: Lang; onStart: (d: Day, planId: string) => void }) {
  const i = lang === 'ar' ? 0 : 1;
  const p = (k: string) => P[k]?.[i] ?? k;
  const T = (k: any) => t(lang, k);
  const opt = (g: string, v: any) => O[g].find((x) => x[0] === v)?.[1 + i] ?? v;
  const ex = (id: string) => (EXERCISES as any[]).find((e) => e.id === id);
  const exn = (id: string) => (ex(id) ? `${ex(id).ar} · ${ex(id).en}` : id);
  const wdn = (wd: number) => new Date(2024, 0, 7 + wd).toLocaleDateString(lang, { weekday: 'long' });
  const [ready, setReady] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [active, setActive] = useState('');
  const [prof, setProf] = useState<Profile>(DEFAULT);
  const [hist, setHist] = useState<any[]>([]);
  const [view, setView] = useState<'week' | 'plans' | 'wizard' | 'edit'>('plans');
  const [cur, setCur] = useState<Plan | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async (first = false) => {
    try {
      const ws = await db.getAll<any>('plans');
      setPlans(ws.filter((x) => x.id.startsWith('plan:')));
      const a = ws.find((x) => x.id === 'activePlan')?.planId ?? '';
      setActive(a);
      setProf({ ...DEFAULT, ...(ws.find((x) => x.id === 'profile')?.profile ?? {}) });
      setHist((await db.getAll<any>('workouts')).filter((x) => x.id !== 'draft'));
      if (first) setView(a ? 'week' : 'plans');
    } catch (e: any) { setMsg(p('err') + e.message); }
    setReady(true);
  };
  useEffect(() => { load(true); }, []);
  const run = async (f: () => Promise<any>) => { try { await f(); await load(); } catch (e: any) { setMsg(p('err') + e.message); } };

  const setWd = (c: Plan, dayId: string, wd: number) => {
    const d = c.days.find((x) => x.id === dayId)!;
    const o = c.days.find((x) => x.weekday === wd && x.id !== dayId);
    if (o) o.weekday = d.weekday;
    d.weekday = wd;
  };
  const moveDay = (pl: Plan, dayId: string, wd: number) => run(() => { const c: Plan = JSON.parse(JSON.stringify(pl)); setWd(c, dayId, wd); return db.put('plans', c); });
  const upd = (fn: (c: Plan) => void) => { const c: Plan = JSON.parse(JSON.stringify(cur)); fn(c); setCur(c); };
  const generateNow = () => run(async () => {
    await db.put('plans', { id: 'profile', profile: prof });
    const pl = generate(prof); pl.name = `${opt('goal', prof.goal)} · ${prof.days}`;
    setCur(pl); setIsNew(true); setView('edit');
  });
  const saveCur = (asNew: boolean) => {
    if (!cur || !cur.name.trim()) { setMsg(p('nameReq')); return; }
    if (!asNew && !isNew && !confirm(p('confirmSave'))) return;
    const c: Plan = JSON.parse(JSON.stringify(cur));
    if (asNew && !isNew) { c.id = 'plan:' + crypto.randomUUID(); c.createdAt = new Date().toISOString(); }
    run(async () => { await db.put('plans', c); setCur(null); setView('plans'); setMsg(''); });
  };
  const activate = (id: string) => run(() => db.put('plans', { id: 'activePlan', planId: id }));
  const dup = (pl: Plan) => run(() => db.put('plans', { ...pl, id: 'plan:' + crypto.randomUUID(), name: pl.name + ' (2)', createdAt: new Date().toISOString() }));
  const del = (pl: Plan) => { if (confirm(p('confirmDel'))) run(async () => { await db.remove('plans', pl.id); if (active === pl.id) await db.remove('plans', 'activePlan'); }); };

  if (!ready) return <section className="card"><p className="muted">⏳ {p('load')}</p></section>;
  const tabs = (
    <div className="chips">
      {(['week', 'plans'] as const).map((v) => <button key={v} className={'chip' + (view === v ? ' on' : '')} onClick={() => { setView(v); setMsg(''); }}>{v === 'week' ? '📅' : '🗂️'} {p(v)}</button>)}
    </div>
  );
  const err = msg && <p className="warn">{msg}</p>;

  if (view === 'wizard') {
    const sel = (k: keyof Profile, g: string) => (
      <label>{p(k)}<select value={prof[k] as any} onChange={(e) => setProf({ ...prof, [k]: e.target.value })}>{O[g].map((x) => <option key={x[0]} value={x[0]}>{x[1 + i]}</option>)}</select></label>
    );
    const num = (k: 'days' | 'dur', vals: number[]) => (
      <label>{p(k)}<select value={prof[k]} onChange={(e) => setProf({ ...prof, [k]: +e.target.value })}>{vals.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
    );
    const tog = (k: 'prio' | 'avoid', v: string) => setProf({ ...prof, [k]: prof[k].includes(v) ? prof[k].filter((x) => x !== v) : [...prof[k], v] });
    return (
      <section className="card">
        <button className="ghost" onClick={() => setView('plans')}>{lang === 'ar' ? '→' : '←'} {p('back')}</button>
        <h2>🧭 {p('newPlan')}</h2>
        {sel('goal', 'goal')}{sel('level', 'level')}{num('days', [2, 3, 4, 5, 6])}{num('dur', [30, 45, 60, 90])}{sel('equip', 'equip')}{sel('split', 'split')}
        <div><b>{p('prio')}</b><div className="chips">{MUSCLES.map((m) => <button key={m} className={'chip' + (prof.prio.includes(m) ? ' on' : '')} onClick={() => tog('prio', m)}>{T(m)}</button>)}</div></div>
        <div><b>{p('avoid')}</b><div className="chips" style={{ flexWrap: 'wrap' }}>{(EXERCISES as any[]).map((e) => <button key={e.id} className={'chip' + (prof.avoid.includes(e.id) ? ' on' : '')} onClick={() => tog('avoid', e.id)}>{e[lang]}</button>)}</div></div>
        <p className="muted">⚠️ {p('disc')}</p>
        {err}
        <button onClick={generateNow}>✨ {p('gen')}</button>
      </section>
    );
  }

  if (view === 'edit' && cur) {
    return (
      <section className="card">
        <button className="ghost" onClick={() => { setCur(null); setView('plans'); }}>{lang === 'ar' ? '→' : '←'} {p('back')}</button>
        <input placeholder={p('name')} value={cur.name} onChange={(e) => upd((c) => { c.name = e.target.value; })} />
        {cur.notes.map((n) => <p key={n} className="warn">{n === 'band' ? p('band') : `${p('miss')} ${T(n.split(':')[1])}`}</p>)}
        {cur.days.slice().sort((a, b) => ORDER.indexOf(a.weekday) - ORDER.indexOf(b.weekday)).map((d) => (
          <div key={d.id} className="ent">
            <div className="row"><b style={{ flex: 1 }}>{d.name[i]}</b>
              <select value={d.weekday} onChange={(e) => upd((c) => setWd(c, d.id, +e.target.value))}>{ORDER.map((w) => <option key={w} value={w}>{wdn(w)}</option>)}</select></div>
            {d.items.map((it, k) => (
              <div key={it.exId} className="srow">
                <div><b>{k + 1}. {exn(it.exId)}</b><div className="muted">{T(ex(it.exId)?.m)} · {it.sets} × {it.repMin}–{it.repMax}{it.unit ? p('sec') : ''} · {p('rest')} {it.rest}{p('sec')}</div></div>
                <div className="row">
                  <button className="ghost" onClick={() => upd((c) => { const x = c.days.find((y) => y.id === d.id)!.items[k]; x.sets = Math.max(1, x.sets - 1); })}>−</button>
                  <button className="ghost" onClick={() => upd((c) => { c.days.find((y) => y.id === d.id)!.items[k].sets++; })}>+</button>
                  <button className="ghost" disabled={k === 0} onClick={() => upd((c) => { const a = c.days.find((y) => y.id === d.id)!.items; [a[k - 1], a[k]] = [a[k], a[k - 1]]; })}>▲</button>
                  <button className="ghost" disabled={k === d.items.length - 1} onClick={() => upd((c) => { const a = c.days.find((y) => y.id === d.id)!.items; [a[k + 1], a[k]] = [a[k], a[k + 1]]; })}>▼</button>
                  <button className="ghost" onClick={() => upd((c) => { c.days.find((y) => y.id === d.id)!.items.splice(k, 1); })}>✕</button>
                </div>
                {alts(it.exId, cur.profile).length > 0 && (
                  <select value="" onChange={(e) => e.target.value && upd((c) => { const x = c.days.find((y) => y.id === d.id)!.items; x[k] = { ...x[k], exId: e.target.value }; })}>
                    <option value="">🔄 {p('swap')}</option>{alts(it.exId, cur.profile).map((id) => <option key={id} value={id}>{exn(id)}</option>)}
                  </select>)}
              </div>
            ))}
          </div>
        ))}
        <p className="muted">📈 {p('prog')}</p><p className="muted">⚠️ {p('disc')}</p>
        {err}
        <button onClick={() => saveCur(false)}>💾 {isNew ? p('save') : p('save')}</button>
        {!isNew && <button className="ghost" onClick={() => saveCur(true)}>{p('saveCopy')}</button>}
        <button className="ghost" onClick={() => { if (isNew || confirm(p('confirmReg'))) { setProf(cur.profile); setView('wizard'); } }}>🔁 {p('regen')}</button>
      </section>
    );
  }

  if (view === 'plans') return (
    <section className="card">
      {tabs}
      <button onClick={() => setView('wizard')}>➕ {p('newPlan')}</button>
      {err}
      {plans.length === 0 && <p className="muted">{p('noPlans')}</p>}
      {plans.map((pl) => (
        <div key={pl.id} className="ent">
          <b>{pl.name} {active === pl.id ? '✔' : ''}</b>
          <span className="muted">{opt('goal', pl.profile.goal)} · {opt('level', pl.profile.level)} · {pl.days.length}×/{p('week')}</span>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <button className="ghost" onClick={() => { setCur(pl); setIsNew(false); setView('edit'); }}>✏️ {p('edit')}</button>
            <button className="ghost" disabled={active === pl.id} onClick={() => activate(pl.id)}>{active === pl.id ? p('active') : p('activate')}</button>
            <button className="ghost" onClick={() => dup(pl)}>📄 {p('dup')}</button>
            <button className="ghost" onClick={() => del(pl)}>🗑️ {p('del')}</button>
          </div>
        </div>
      ))}
      <p className="muted">⚠️ {p('disc')}</p>
    </section>
  );

  const act = plans.find((x) => x.id === active);
  const today = new Date();
  const start = new Date(); start.setDate(today.getDate() - ((today.getDay() + 1) % 7));
  const weekDates = (off: number) => ORDER.map((_, k) => { const d = new Date(start); d.setDate(start.getDate() + k - 7 * off); return ld(d); });
  const doneIn = (dates: string[]) => new Set(hist.filter((s) => s.planId === act?.id && dates.includes(ld(new Date(s.date)))).map((s) => s.dayId));
  const wk = weekDates(0), done0 = doneIn(wk), done1 = doneIn(weekDates(1));
  return (
    <section className="card">
      {tabs}{err}
      {!act ? <p className="muted">{p('noActive')}</p> : (
        <>
          <h2>{act.name}</h2>
          <p className="muted">📊 {p('thisWeek')}: {done0.size}/{act.days.length} · {p('lastWeek')}: {done1.size}/{act.days.length} ({p('completed')}/{p('planned')})</p>
          {ORDER.map((wd, k) => {
            const d = act.days.find((x) => x.weekday === wd);
            const isToday = wk[k] === ld(today), past = wk[k] < ld(today);
            const ok = d && done0.has(d.id);
            return (
              <div key={wd} className="ent" style={isToday ? { outline: '2px solid var(--acc)', borderRadius: 12, padding: 8 } : undefined}>
                <div className="row"><b style={{ flex: 1 }}>{wdn(wd)} <span className="muted">{wk[k].slice(5)}</span></b>
                  <span>{!d ? p('restDay') : ok ? p('done') : past ? p('missed') : ''}</span></div>
                {d && <>
                  <span className="muted">{d.name[i]} · {d.items.length}</span>
                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    {!ok && <button onClick={() => onStart(d, act.id)}>▶️ {p('start')}</button>}
                    {!ok && past && <button className="ghost" onClick={() => moveDay(act, d.id, today.getDay())}>↪ {p('toToday')}</button>}
                    <select value={wd} onChange={(e) => moveDay(act, d.id, +e.target.value)}>{ORDER.map((w) => <option key={w} value={w}>{wdn(w)}</option>)}</select>
                  </div></>}
              </div>
            );
          })}
        </>
      )}
      <p className="muted">⚠️ {p('disc')}</p>
    </section>
  );
}
