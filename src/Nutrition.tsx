import { useEffect, useState } from 'react';
import { Lang } from './i18n';
import { bundledFoods, recToFood, FoodRec } from './foodDb';
import FoodsPanel from './FoodsPanel';
import { normText } from './refdata';
import { ACT, Macros, NProfile, P0, estimate, validate } from './nutri';
import * as db from './db';

const N: Record<string, [string, string]> = {
  day:['اليوم','Day'], prog:['التقدم','Progress'], foods:['الأطعمة','Foods'], prof:['الملف','Profile'],
  b:['🍳 فطور','🍳 Breakfast'], l:['🍛 غداء','🍛 Lunch'], d:['🥗 عشاء','🥗 Dinner'], s:['🍎 وجبات خفيفة','🍎 Snacks'],
  kcal:['سعرة','kcal'], p:['بروتين','Protein'], c:['كربوهيدرات','Carbs'], f:['دهون','Fat'], g:['غ','g'], left:['المتبقي','Left'], target:['الهدف','Target'],
  noTarget:['أكمل ملفك الشخصي لتظهر الأهداف.','Complete your profile to see targets.'], search:['ابحث عن طعام…','Search foods…'], done:['تم','Done'],
  freq:['الأكثر استخداماً','Frequent'], saved:['وجباتي المحفوظة','Saved meals'], saveMeal:['حفظ كوجبة','Save as meal'], mealName:['اسم الوجبة','Meal name'],
  approx:['≈ قيمة تقريبية','≈ approximate'], mine:['قيمة أدخلتها','your value'], none:['لا توجد نتائج','No results'], empty:['لا توجد وجبات مسجلة لهذا اليوم.','No meals logged for this day.'],
  age:['العمر','Age'], sex:['الجنس (مطلوب للمعادلة)','Sex (needed for the equation)'], m:['ذكر','Male'], fm:['أنثى','Female'], h:['الطول (سم)','Height (cm)'], w:['الوزن (كغم)','Weight (kg)'],
  goal:['الهدف','Goal'], gain:['زيادة عضل','Muscle gain'], loss:['خسارة دهون','Fat loss'], keep:['ثبات الوزن','Maintenance'], act:['مستوى النشاط','Activity level'],
  rate:['معدل التغيّر (كغم/أسبوع)','Rate (kg/week)'], prefs:['تفضيلات غذائية أو قيود (اختياري)','Dietary preferences / restrictions (optional)'], opt:['اختياري','optional'],
  save:['حفظ','Save'], saved2:['تم الحفظ ✅','Saved ✅'], bad:['قيمة غير صالحة: ','Invalid value: '], err:['خطأ: ','Error: '],
  a0:['خامل (عمل مكتبي)','Sedentary'], a1:['خفيف (1–3 أيام)','Light (1–3 days)'], a2:['متوسط (3–5 أيام)','Moderate (3–5 days)'], a3:['عالٍ (6–7 أيام)','High (6–7 days)'], a4:['شديد جداً','Very high'],
  est:['⚠️ هذه تقديرات أولية وليست قياسات دقيقة. راقب وزنك 2–3 أسابيع وعدّل الهدف حسب النتيجة.','⚠️ These are starting estimates, not exact measurements. Watch your weight for 2–3 weeks and adjust.'],
  how:['طريقة الحساب','How it is calculated'], manual:['تعديل الأهداف يدوياً','Edit targets manually'], reset:['العودة للتقدير','Back to estimate'],
  floor:['رُفعت السعرات إلى الحد الأدنى الآمن العام.','Calories were raised to a general safe minimum.'], minor:['تحت 18 سنة لا يُطبَّق عجز سعرات. استشر مختصاً.','Under 18: no calorie deficit applied. Consult a professional.'],
  newFood:['طعام مخصص','Custom food'], fname:['الاسم','Name'], per100:['القيم لكل 100 غ','Values per 100 g'], serv:['حصة افتراضية (غ)','Default serving (g)'], del:['حذف','Delete'],
  note:['القيم التقريبية لكل 100 غ وتختلف حسب النوع والطبخ؛ أضف طعاماً مخصصاً بقيم العبوة للدقة.','Approximate values per 100 g; they vary by type and cooking. Add a custom food with package values for accuracy.'],
  week:['متوسط آخر 7 أيام','Last 7 days average'], daysLogged:['أيام مسجلة','days logged'], avgK:['متوسط السعرات','Avg calories'], avgP:['متوسط البروتين','Avg protein'],
  weight:['الوزن','Weight'], addW:['إضافة وزن','Add weight'], needMore:['تحتاج قياسين على الأقل لرسم المنحنى.','At least 2 entries are needed for the chart.'],
  tvA:['الفعلي مقابل الهدف','Actual vs target'], wo:['جلسات تدريب آخر 7 أيام','Workout sessions, last 7 days'], change:['التغيّر','Change'],
};
const ld = (d: Date) => d.toLocaleDateString('sv');
const MEALS = ['b', 'l', 'd', 's'];
type Per = Macros; // k,p,c,f per 100 g
type Food = FoodRec;
type Entry = { id: string; meal: string; foodId: string; name: string; g: number; per: Per; src: string };
const tot = (es: Entry[]): Macros => es.reduce((a, e) => ({ k: a.k + (e.per.k * e.g) / 100, p: a.p + (e.per.p * e.g) / 100, c: a.c + (e.per.c * e.g) / 100, f: a.f + (e.per.f * e.g) / 100 }), { k: 0, p: 0, c: 0, f: 0 });
const r = (x: number) => Math.round(x);

function Line({ pts }: { pts: number[] }) {
  const mx = Math.max(...pts), mn = Math.min(...pts), rg = mx - mn || 1;
  const xy = pts.map((v, k) => [10 + (k / (pts.length - 1)) * 280, 66 - ((v - mn) / rg) * 52]);
  return (
    <svg viewBox="0 0 300 80" className="fig" role="img">
      <polyline points={xy.map((q) => q.join(',')).join(' ')} fill="none" strokeWidth="3" style={{ stroke: 'var(--acc)' }} />
      {xy.map((q, k) => <circle key={k} cx={q[0]} cy={q[1]} r="3" style={{ fill: 'var(--acc)' }} />)}
      <text x="4" y="78" fontSize="9" fill="currentColor">{pts[0]}</text>
      <text x="296" y="78" fontSize="9" fill="currentColor" textAnchor="end">{pts[pts.length - 1]}</text>
    </svg>
  );
}
const Bar = ({ v, max }: { v: number; max: number }) => <div className="bar"><i style={{ width: Math.min(100, max ? (v / max) * 100 : 0) + '%' }} /></div>;

export default function Nutrition({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const n = (k: string) => N[k]?.[i] ?? k;
  const [view, setView] = useState<'day' | 'prog' | 'foods' | 'prof'>('day');
  const [date, setDate] = useState(ld(new Date()));
  const [prof, setProf] = useState<NProfile>(P0);
  const [customs, setCustoms] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [adding, setAdding] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [wIn, setWIn] = useState('');
  const [cf, setCf] = useState<any>(null);

  const load = async () => {
    try {
      const ns = await db.getAll<any>('nutrition');
      setProf({ ...P0, ...(ns.find((x) => x.id === 'profile')?.profile ?? {}) });
      setCustoms(ns.filter((x) => x.id.startsWith('food:') || x.id.startsWith('ref:')));
      setMeals(ns.filter((x) => x.id.startsWith('meal:')));
      setLogs(ns.filter((x) => x.id.startsWith('log:')));
      setWeights((await db.getAll<any>('measurements')).sort((a, b) => a.date.localeCompare(b.date)));
      setSessions((await db.getAll<any>('workouts')).filter((x) => x.id !== 'draft'));
    } catch (e: any) { setMsg(n('err') + e.message); }
  };
  useEffect(() => { load(); }, []);
  const run = async (f: () => Promise<any>) => { try { await f(); await load(); } catch (e: any) { setMsg(n('err') + e.message); } };

  const foods: Food[] = [...bundledFoods(lang), ...customs.map((c) => recToFood(c, n))];
  const found = foods.filter((f) => f.search.includes(normText(q))).slice(0, 12);
  const entries: Entry[] = logs.find((l) => l.id === 'log:' + date)?.entries ?? [];
  const setEntries = (next: Entry[]) => run(() => (next.length ? db.put('nutrition', { id: 'log:' + date, date, entries: next }) : db.remove('nutrition', 'log:' + date)));
  const addFood = (f: Food, meal: string) => setEntries([...entries, { id: crypto.randomUUID(), meal, foodId: f.id, name: f.name, g: f.g, per: f.per, src: f.src }]);
  const editG = (id: string, g: number) => setEntries(entries.map((e) => (e.id === id ? { ...e, g: g > 0 ? g : 0 } : e)));
  const freq = (() => {
    const cnt: Record<string, number> = {};
    logs.filter((l) => l.date >= ld(new Date(Date.now() - 30 * 864e5))).forEach((l) => l.entries.forEach((e: Entry) => { cnt[e.foodId] = (cnt[e.foodId] ?? 0) + 1; }));
    return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).map((id) => foods.find((f) => f.id === id)).filter(Boolean).slice(0, 6) as Food[];
  })();
  const est = estimate(prof);
  const tg: Macros | null = prof.manual ?? (est ? { k: est.k, p: est.p, c: est.c, f: est.f } : null);
  const shift = (d: number) => { const x = new Date(date + 'T12:00:00'); x.setDate(x.getDate() + d); setDate(ld(x)); };

  const tabs = <div className="chips">{(['day', 'prog', 'foods', 'prof'] as const).map((v) => <button key={v} className={'chip' + (view === v ? ' on' : '')} onClick={() => { setView(v); setMsg(''); setAdding(''); }}>{n(v)}</button>)}</div>;
  const err = msg && <p className="warn">{msg}</p>;
  const num = (k: 'age' | 'h' | 'w', label: string) => <label>{label}<input inputMode="decimal" value={prof[k] ?? ''} onChange={(e) => setProf({ ...prof, [k]: e.target.value === '' ? undefined : +e.target.value })} /></label>;

  if (view === 'prof') {
    const save = () => { const b = validate(prof); if (b) { setMsg(n('bad') + n(b)); return; } run(async () => { await db.put('nutrition', { id: 'profile', profile: prof }); setMsg(n('saved2')); }); };
    return (
      <section className="card">{tabs}
        <p className="warn">{n('est')}</p>
        {num('age', n('age'))}
        <label>{n('sex')}<select value={prof.sex ?? ''} onChange={(e) => setProf({ ...prof, sex: (e.target.value || undefined) as any })}><option value="">—</option><option value="m">{n('m')}</option><option value="f">{n('fm')}</option></select></label>
        {num('h', n('h'))}{num('w', n('w'))}
        <label>{n('goal')}<select value={prof.goal} onChange={(e) => setProf({ ...prof, goal: e.target.value as any })}>{['gain', 'loss', 'keep'].map((g) => <option key={g} value={g}>{n(g)}</option>)}</select></label>
        <label>{n('act')}<select value={prof.act} onChange={(e) => setProf({ ...prof, act: +e.target.value })}>{ACT.map((a, k) => <option key={a} value={a}>{n('a' + k)}</option>)}</select></label>
        <label>{n('rate')}<select value={prof.rate} onChange={(e) => setProf({ ...prof, rate: +e.target.value })}>{[0.25, 0.5, 0.75].map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
        <label>{n('prefs')}<input value={prof.prefs ?? ''} onChange={(e) => setProf({ ...prof, prefs: e.target.value })} /></label>
        <button onClick={save}>💾 {n('save')}</button>{err}
        {!est ? <p className="muted">{n('noTarget')}</p> : (
          <div className="ent"><h3>🧮 {n('how')}</h3>
            <p className="muted">BMR = 10×{prof.w} + 6.25×{prof.h} − 5×{prof.age} {prof.sex === 'm' ? '+ 5' : '− 161'} = <b>{est.bmr}</b><br />
              × {prof.act} → <b>{est.tdee}</b> {n('kcal')} (maintenance)<br />{est.adj >= 0 ? '+' : ''}{est.adj} → <b>{est.k}</b> {n('kcal')}<br />
              {n('p')} {est.p}{n('g')} · {n('c')} {est.c}{n('g')} · {n('f')} {est.f}{n('g')}</p>
            {est.floored && <p className="muted">{n('floor')}</p>}{est.minor && <p className="warn">{n('minor')}</p>}</div>)}
        {est && (prof.manual ? (
          <div className="ent"><b>{n('manual')}</b>
            {(['k', 'p', 'c', 'f'] as const).map((k) => <label key={k}>{n(k === 'k' ? 'kcal' : k)}<input inputMode="numeric" value={prof.manual![k]} onChange={(e) => setProf({ ...prof, manual: { ...prof.manual!, [k]: +e.target.value || 0 } })} /></label>)}
            <button className="ghost" onClick={() => setProf({ ...prof, manual: null })}>{n('reset')}</button></div>
        ) : <button className="ghost" onClick={() => setProf({ ...prof, manual: { k: est.k, p: est.p, c: est.c, f: est.f } })}>✏️ {n('manual')}</button>)}
      </section>
    );
  }

  if (view === 'foods') return <FoodsPanel lang={lang} tabs={tabs} foods={foods} customs={customs} meals={meals} reload={load} />;

  if (view === 'prog') {
    const days = Array.from({ length: 7 }, (_, k) => ld(new Date(Date.now() - (6 - k) * 864e5)));
    const per = days.map((d) => ({ d, t: tot(logs.find((l) => l.id === 'log:' + d)?.entries ?? []), has: !!logs.find((l) => l.id === 'log:' + d) }));
    const used = per.filter((x) => x.has);
    const avg = (f: (m: Macros) => number) => (used.length ? r(used.reduce((a, x) => a + f(x.t), 0) / used.length) : 0);
    const wl = weights.slice(-30);
    const woW = sessions.filter((s) => Date.now() - Date.parse(s.date) <= 7 * 864e5).length;
    return (
      <section className="card">{tabs}{err}
        <h3>📅 {n('week')}</h3>
        {used.length === 0 ? <p className="muted">{n('empty')}</p> : <p>{n('avgK')}: <b>{avg((m) => m.k)}</b> · {n('avgP')}: <b>{avg((m) => m.p)}{n('g')}</b> ({used.length} {n('daysLogged')})</p>}
        <h3>🎯 {n('tvA')}</h3>
        {!tg ? <p className="muted">{n('noTarget')}</p> : per.map((x) => <div key={x.d}><span className="muted">{x.d.slice(5)} · {x.has ? `${r(x.t.k)} / ${tg.k}` : '—'}</span><Bar v={x.t.k} max={tg.k} /></div>)}
        <h3>⚖️ {n('weight')}</h3>
        <div className="row"><input inputMode="decimal" placeholder={n('w')} value={wIn} onChange={(e) => setWIn(e.target.value)} />
          <button onClick={() => { const v = parseFloat(wIn); if (!(v > 20 && v < 400)) { setMsg(n('bad') + n('w')); return; } run(async () => { await db.put('measurements', { id: crypto.randomUUID(), date: ld(new Date()), weightKg: v }); setWIn(''); setMsg(''); }); }}>{n('addW')}</button></div>
        {wl.length < 2 ? <p className="muted">{n('needMore')}</p> : <><Line pts={wl.map((x) => x.weightKg)} /><p className="muted">{n('change')}: {(wl[wl.length - 1].weightKg - wl[0].weightKg).toFixed(1)} kg ({wl[0].date} → {wl[wl.length - 1].date})</p></>}
        <h3>🏋️ {n('wo')}: {woW}</h3>
      </section>
    );
  }

  const T = tot(entries);
  const mac = (k: 'p' | 'c' | 'f') => (
    <div><span className="muted">{n(k)}: {r(T[k])}{tg ? ` / ${tg[k]} · ${n('left')} ${r(tg[k] - T[k])}` : ''}{n('g')}</span><Bar v={T[k]} max={tg?.[k] ?? 0} /></div>
  );
  return (
    <section className="card">{tabs}
      <div className="row"><button className="ghost" onClick={() => shift(-1)}>{lang === 'ar' ? '▶' : '◀'}</button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <button className="ghost" onClick={() => shift(1)}>{lang === 'ar' ? '◀' : '▶'}</button></div>
      {err}
      <div className="ent"><b>🔥 {r(T.k)}{tg ? ` / ${tg.k}` : ''} {n('kcal')}{tg ? ` · ${n('left')} ${r(tg.k - T.k)}` : ''}</b>
        {tg && <Bar v={T.k} max={tg.k} />}{mac('p')}{mac('c')}{mac('f')}{!tg && <p className="muted">{n('noTarget')}</p>}</div>
      {entries.length === 0 && <p className="muted">{n('empty')}</p>}
      {MEALS.map((m) => {
        const es = entries.filter((e) => e.meal === m);
        return (
          <div key={m} className="ent"><div className="row"><b style={{ flex: 1 }}>{n(m)} · {r(tot(es).k)} {n('kcal')}</b>
            {es.length > 0 && <button className="ghost" onClick={() => { const nm = prompt(n('mealName')); if (nm) run(() => db.put('nutrition', { id: 'meal:' + crypto.randomUUID(), name: nm, entries: es.map(({ id, meal, ...x }) => x) })); }}>💾</button>}
            <button className="ghost" onClick={() => { setAdding(adding === m ? '' : m); setQ(''); }}>{adding === m ? n('done') : '➕'}</button></div>
            {es.map((e) => (
              <div key={e.id} className="row srow"><span style={{ flex: 1 }}>{e.name}<br /><span className="muted">{r((e.per.k * e.g) / 100)} {n('kcal')} · {e.src === 'custom' ? n('mine') : n('approx')}</span></span>
                <input style={{ maxWidth: 70 }} inputMode="decimal" value={e.g} onChange={(ev) => editG(e.id, +ev.target.value)} /><span className="muted">{n('g')}</span>
                <button className="ghost" onClick={() => setEntries(entries.filter((x) => x.id !== e.id))}>✕</button></div>))}
            {adding === m && (
              <div className="ent"><input placeholder={n('search')} value={q} onChange={(e) => setQ(e.target.value)} />
                {!q && freq.length > 0 && <div className="chips">{freq.map((f) => <button key={f.id} className="chip" onClick={() => addFood(f, m)}>{f.name}</button>)}</div>}
                {!q && meals.length > 0 && <div className="chips">{meals.map((x) => <button key={x.id} className="chip" onClick={() => setEntries([...entries, ...x.entries.map((y: any) => ({ ...y, id: crypto.randomUUID(), meal: m }))])}>⭐ {x.name}</button>)}</div>}
                {found.length === 0 && <p className="muted">{n('none')}</p>}
                {found.map((f) => <button key={f.id} className="ghost" style={{ textAlign: 'start' }} onClick={() => addFood(f, m)}>{f.name} · {f.label} · {r((f.per.k * f.g) / 100)} {n('kcal')}</button>)}</div>)}
          </div>
        );
      })}
    </section>
  );
}
