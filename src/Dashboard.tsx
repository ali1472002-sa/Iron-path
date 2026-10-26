import { useEffect, useState } from 'react';
import { Lang } from './i18n';
import { EXERCISES } from './exercises';
import { P0, estimate } from './nutri';
import * as A from './analytics';
import * as db from './db';
import Coach from './Coach';

const D: Record<string, [string, string]> = {
  title:['لوحة التقدم','Progress dashboard'], load:['جارٍ التحميل…','Loading…'], err:['خطأ: ','Error: '],
  week:['هذا الأسبوع','This week'], month:['هذا الشهر','This month'], '7':['7 أيام','7 days'], '30':['30 يوماً','30 days'], '90':['90 يوماً','90 days'],
  empty:['لا توجد بيانات بعد. سجّل تمريناً أو وجبة أو وزناً لتظهر اللوحة.','No data yet. Log a workout, a meal or your weight to see the dashboard.'],
  sess:['الجلسات','Sessions'], weekMonth:['هذا الأسبوع / هذا الشهر','This week / this month'], vol:['حجم التدريب (كغم × تكرار)','Training volume (kg × reps)'],
  volNote:['تمارين وزن الجسم (0 كغم) لا تدخل في الحجم.','Bodyweight sets (0 kg) add no volume.'],
  adh:['الالتزام بالخطة','Plan adherence'], adhNote:['جلسات الخطة المستحقة حتى اليوم مقابل المرتبطة بها.','Plan sessions due so far vs sessions linked to them.'],
  noPlan:['لا توجد خطة مفعّلة','No active plan'], nut:['التغذية (أيام مسجلة فقط)','Nutrition (logged days only)'], kcal:['سعرة','kcal'], g:['غ','g'], days:['أيام','days'],
  noNut:['لا توجد سجلات طعام في هذه الفترة','No food logs in this period'], wt:['الوزن','Weight'], noW:['لا قياسات في هذه الفترة','No weigh-ins in this period'],
  next:['التمرين القادم','Next workout'], noNext:['لا يوجد تمرين مجدول','Nothing scheduled'],
  cFreq:['الجلسات الأسبوعية','Weekly sessions'], cVol:['الحجم الأسبوعي','Weekly volume'], cW:['منحنى الوزن','Weight trend'], cK:['السعرات اليومية مقابل الهدف','Daily calories vs target'],
  cP:['البروتين اليومي مقابل الهدف','Daily protein vs target'], cEx:['تقدم تمرين','Exercise progression'], target:['الهدف','target'], few:['بيانات غير كافية للرسم','Not enough data to chart'],
  ex:['التمرين','Exercise'], m:['المقياس','Metric'], top:['أعلى وزن','Top weight'], reps:['التكرارات','Total reps'], gaps:['الأيام الفارغة = غير مسجّلة، وليست صفراً.','Empty days = not logged, not zero.'],
  pr:['الأرقام الشخصية','Personal records'], prDef:['المعيار: أثقل مجموعة مكتملة (وعند التساوي الأكثر تكراراً). "جديد" = تحسّن عن أفضل أداء سابق ضمن الفترة.','Criterion: heaviest completed set (ties: more reps). "New" = beat the earlier best within the period.'],
  newB:['جديد','New'], noPr:['لا توجد مجموعات مسجلة','No recorded sets'],
  cmp:['مقارنة بالفترة السابقة','Compare with previous period'], cur:['الحالية','Current'], prev:['السابقة','Previous'], delta:['الفرق','Diff'],
  ins:['ملاحظات من بياناتك','Observations from your data'], noIns:['لا توجد ملاحظات: البيانات غير كافية أو لا شيء لافت.','No observations: not enough data or nothing notable.'],
  rule:['القاعدة','Rule'], basis:['البيانات','Data'], sugL:['اقتراح (اختياري)','Suggestion (optional)'], doneB:['تم ✔','Done ✔'], dis:['إخفاء','Dismiss'],
  restore:['إظهار المخفية','Show hidden'], hidden:['مخفية','hidden'],
  wNote:['هذه ملاحظة عن الأرقام فقط ولا تثبت زيادة عضل أو خسارة دهون.','This describes the numbers only; it does not prove muscle gain or fat loss.'],
  disc:['الملاحظات حسابات بسيطة مبنية على سجلاتك، وليست ذكاءً اصطناعياً أو تشخيصاً طبياً. لا تتمرّن رغم الألم، ولا تغيّر نظامك الغذائي بشكل متطرف.','Observations are simple rule-based calculations on your records, not AI or medical diagnosis. Never train through pain or make extreme diet changes.'],
  sug_schedule:['راجع جدولك الأسبوعي إن كان واقعياً لوقتك.','Review whether your weekly schedule fits your time.'],
  sug_recovery:['راجع الراحة والنوم وتقنية الأداء. إن وُجد ألم فتوقف واستشر مختصاً.','Review rest, sleep and technique. If there is pain, stop and see a professional.'],
  sug_logging:['راجع انتظام تسجيل الطعام قبل تفسير متوسطات السعرات أو تغيير أي شيء.','Review how consistently you log food before interpreting calorie averages or changing anything.'],
};
const ORD = ['sess', 'vol', 'kcal', 'prot', 'wavg'];
const CD: Record<string, number> = { week: 28, '7': 28, month: 56, '30': 56, '90': 91 };

function Bars({ vals, labels, target }: { vals: (number | null)[]; labels: string[]; target?: number }) {
  const mx = Math.max(1, target ?? 0, ...vals.map((v) => v ?? 0)), w = 280 / vals.length;
  return (
    <svg viewBox="0 0 300 120" className="fig" role="img">
      {vals.map((v, k) => v == null ? null : <rect key={k} x={10 + k * w + 1} y={100 - (v / mx) * 80} width={Math.max(2, w - 2)} height={(v / mx) * 80} rx="2" style={{ fill: 'var(--acc)' }} />)}
      {target ? <line x1="10" x2="290" y1={100 - (target / mx) * 80} y2={100 - (target / mx) * 80} stroke="currentColor" strokeDasharray="4 3" opacity=".6" /> : null}
      <text x="10" y="114" fontSize="9" fill="currentColor">{labels[0]}</text>
      <text x="290" y="114" fontSize="9" fill="currentColor" textAnchor="end">{labels[labels.length - 1]}</text>
      <text x="290" y="12" fontSize="9" fill="currentColor" textAnchor="end">max {Math.round(mx)}</text>
    </svg>
  );
}
function Line({ pts, few }: { pts: { d: string; v: number }[]; few: string }) {
  if (pts.length < 2) return <p className="muted">{few}</p>;
  const mx = Math.max(...pts.map((p) => p.v)), mn = Math.min(...pts.map((p) => p.v)), rg = mx - mn || 1, span = A.diffDays(pts[0].d, pts[pts.length - 1].d) || 1;
  const xy = pts.map((p) => [10 + (A.diffDays(pts[0].d, p.d) / span) * 280, 90 - ((p.v - mn) / rg) * 70]);
  return (
    <svg viewBox="0 0 300 120" className="fig" role="img">
      <polyline points={xy.map((q) => q.join(',')).join(' ')} fill="none" strokeWidth="3" style={{ stroke: 'var(--acc)' }} />
      {xy.map((q, k) => <circle key={k} cx={q[0]} cy={q[1]} r="3" style={{ fill: 'var(--acc)' }} />)}
      <text x="10" y="114" fontSize="9" fill="currentColor">{pts[0].d.slice(5)} · {pts[0].v}</text>
      <text x="290" y="114" fontSize="9" fill="currentColor" textAnchor="end">{pts[pts.length - 1].d.slice(5)} · {pts[pts.length - 1].v}</text>
    </svg>
  );
}

export default function Dashboard({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const d = (k: string) => D[k]?.[i] ?? k;
  const [ready, setReady] = useState(false);
  const [ss, setSs] = useState<A.Session[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [activeId, setActiveId] = useState('');
  const [insR, setInsR] = useState<any>({ id: 'insights', dismissed: {}, done: {} });
  const [logs, setLogs] = useState<any[]>([]);
  const [prof, setProf] = useState<any>(null);
  const [ws, setWs] = useState<any[]>([]);
  const [cust, setCust] = useState<any[]>([]);
  const [kind, setKind] = useState<A.Kind>('30');
  const [exSel, setExSel] = useState('');
  const [met, setMet] = useState<'top' | 'reps' | 'vol'>('top');
  const [showHid, setShowHid] = useState(false);
  const [msg, setMsg] = useState('');
  const [sub, setSub] = useState<'ov' | 'coach'>('ov');

  const load = async () => {
    try {
      setSs((await db.getAll<any>('workouts')).filter((x) => x.id !== 'draft'));
      const pl = await db.getAll<any>('plans');
      setPlans(pl.filter((x) => x.id.startsWith('plan:')));
      setActiveId(pl.find((x) => x.id === 'activePlan')?.planId ?? '');
      setInsR(pl.find((x) => x.id === 'insights') ?? { id: 'insights', dismissed: {}, done: {} });
      const ns = await db.getAll<any>('nutrition');
      setLogs(ns.filter((x) => x.id.startsWith('log:')));
      setProf(ns.find((x) => x.id === 'profile')?.profile ?? null);
      setWs(await db.getAll<any>('measurements'));
      setCust(await db.getAll<any>('exercises'));
    } catch (e: any) { setMsg(d('err') + e.message); }
    setReady(true);
  };
  useEffect(() => { load(); }, []);
  if (!ready) return <section className="card"><p className="muted">⏳ {d('load')}</p></section>;

  const nm = (id: string) => (EXERCISES as any[]).find((e) => e.id === id)?.[lang] ?? cust.find((c) => c.id === id)?.name ?? id;
  const today = A.ld(new Date());
  const { cur, prev } = A.periods(kind, today);
  const act = plans.find((p) => p.id === activeId);
  const pr = prof ? { ...P0, ...prof } : null;
  const est = pr ? estimate(pr) : null;
  const target = pr ? pr.manual ?? (est ? { k: est.k, p: est.p, c: est.c, f: est.f } : null) : null;
  const daily = A.dailyNutrition(logs);
  const sc = A.inRange(ss, cur), sp = A.inRange(ss, prev);
  const nc = A.nutritionAvg(daily, cur, today), np = A.nutritionAvg(daily, prev, today);
  const wc = A.weightTrend(ws, cur), wp = A.weightTrend(ws, prev);
  const adc = A.adherence(act, ss, cur, today);
  const nxt = A.nextWorkout(act, ss, today);
  const wkN = A.inRange(ss, A.periods('week', today).cur).length, moN = A.inRange(ss, A.periods('month', today).cur).length;
  const chartR: A.Range = [A.addDays(today, -(CD[kind] - 1)), today];
  const wk = A.weekly(ss, chartR, today);
  const kDays = Array.from({ length: Math.min(30, A.diffDays(cur[0], today) + 1) }, (_, k) => A.addDays(today, -(Math.min(30, A.diffDays(cur[0], today) + 1) - 1 - k)));
  const exIds = Array.from(new Set(ss.flatMap((s) => s.entries.map((e) => e.exId))));
  const curEx = exSel || exIds[0];
  const exS = curEx ? A.exerciseSeries(ss, curEx, chartR) : [];
  const recs = A.records(ss);
  const fmt = (v: number | null | undefined, dp = 0) => (v == null ? '—' : v.toFixed(dp));
  const dl = (a: number | null, b: number | null, dp = 0) => (a == null || b == null ? '—' : (a - b > 0 ? '+' : '') + (a - b).toFixed(dp));
  const all = A.insights({ ss, plan: act, daily, ws, target }, kind, today);
  const hidden = all.filter((x) => insR.dismissed[x.key] || insR.done[x.key]);
  const shown = all.filter((x) => showHid || !(insR.dismissed[x.key] || insR.done[x.key]));
  const mark = async (key: string, f: 'dismissed' | 'done') => { try { await db.put('plans', { ...insR, [f]: { ...insR[f], [key]: Date.now() } }); await load(); } catch (e: any) { setMsg(d('err') + e.message); } };
  const empty = !ss.length && !logs.length && !ws.length;

  const txt = (x: A.Insight): [string, string] => {
    const p: any = x.p, e = x.ex ? nm(x.ex) : '';
    const T: Record<string, [[string, string], [string, string]]> = {
      cons_up: [[`عدد الجلسات ارتفع: ${p.c} مقابل ${p.p} في الفترة السابقة.`, `Sessions increased: ${p.c} vs ${p.p} in the previous period.`], ['مقارنة عدد الجلسات المحفوظة في فترتين متساويتين؛ زيادة ≥ 30%.', 'Compares saved sessions in two equal periods; increase ≥ 30%.']],
      cons_down: [[`عدد الجلسات انخفض: ${p.c} مقابل ${p.p} في الفترة السابقة.`, `Sessions decreased: ${p.c} vs ${p.p} in the previous period.`], ['مقارنة عدد الجلسات في فترتين متساويتين؛ انخفاض ≥ 30% مع 3 جلسات على الأقل سابقاً.', 'Compares sessions in two equal periods; drop ≥ 30% with at least 3 earlier sessions.']],
      missed: [[`${p.m} من ${p.d} جلسات مخططة لم تُسجَّل.`, `${p.m} of ${p.d} planned sessions were not logged.`], ['جلسات الخطة المستحقة حتى اليوم دون جلسة مرتبطة؛ تظهر عند ≥ 3 مستحقة وإنجاز ≤ 50%.', 'Plan sessions due so far without a linked session; shown at ≥ 3 due and ≤ 50% done.']],
      ex_up: [[`${e}: ${p.u === 'kg' ? 'أعلى وزن' : 'التكرارات'} تحسّن من ${p.a} إلى ${p.b}.`, `${e}: ${p.u === 'kg' ? 'top weight' : 'reps'} improved from ${p.a} to ${p.b}.`], ['مقارنة أول وآخر جلسة من آخر 3 جلسات خلال 60 يوماً.', 'Compares the first and last of your last 3 sessions within 60 days.']],
      ex_down: [[`${e}: حجم التمرين انخفض في آخر 3 جلسات (${p.a} ← ${p.b} ← ${p.c}).`, `${e}: volume fell across the last 3 sessions (${p.a} → ${p.b} → ${p.c}).`], ['الحجم (كغم × تكرار) يتناقص باستمرار في آخر 3 جلسات خلال 60 يوماً.', 'Volume (kg × reps) strictly decreases over the last 3 sessions within 60 days.']],
      log_cov: [[`سجّلت الطعام في ${p.d} من ${p.n} يوماً.`, `You logged food on ${p.d} of ${p.n} days.`], ['تسجيل أقل من نصف أيام فترة لا تقل عن 7 أيام.', 'Food logged on fewer than half the days of a period of at least 7 days.']],
      prot_low: [[`متوسط البروتين ${p.a} غ مقابل الهدف ${p.t} غ (${p.d} أيام مسجلة).`, `Average protein ${p.a} g vs target ${p.t} g (${p.d} logged days).`], ['متوسط الأيام المسجلة فقط أقل من 85% من الهدف، بحد أدنى 4 أيام.', 'Average over logged days only is below 85% of target, minimum 4 days.']],
      prot_high: [[`متوسط البروتين ${p.a} غ مقابل الهدف ${p.t} غ (${p.d} أيام مسجلة).`, `Average protein ${p.a} g vs target ${p.t} g (${p.d} logged days).`], ['متوسط الأيام المسجلة فقط أعلى من 115% من الهدف، بحد أدنى 4 أيام.', 'Average over logged days only is above 115% of target, minimum 4 days.']],
      w_up: [[`الوزن يميل للارتفاع بنحو ${p.s} كغم/أسبوع (${p.n} قياسات).`, `Weight trends upward by about ${p.s} kg/week (${p.n} weigh-ins).`], ['ميل خط انحدار على قياسات الفترة؛ يلزم ≥ 3 قياسات تمتد ≥ 7 أيام و|الميل| ≥ 0.1.', 'Regression slope over the period; needs ≥ 3 weigh-ins spanning ≥ 7 days and |slope| ≥ 0.1.']],
      w_down: [[`الوزن يميل للانخفاض بنحو ${p.s} كغم/أسبوع (${p.n} قياسات).`, `Weight trends downward by about ${p.s} kg/week (${p.n} weigh-ins).`], ['ميل خط انحدار على قياسات الفترة؛ يلزم ≥ 3 قياسات تمتد ≥ 7 أيام و|الميل| ≥ 0.1.', 'Regression slope over the period; needs ≥ 3 weigh-ins spanning ≥ 7 days and |slope| ≥ 0.1.']],
    };
    return [T[x.id][0][i], T[x.id][1][i]];
  };

  const subTabs = <div className="chips" style={{ marginBottom: 12 }}><button className={'chip' + (sub === 'ov' ? ' on' : '')} onClick={() => setSub('ov')}>📊 {lang === 'ar' ? 'نظرة عامة' : 'Overview'}</button><button className={'chip' + (sub === 'coach' ? ' on' : '')} onClick={() => setSub('coach')}>🧠 {lang === 'ar' ? 'المدرب' : 'Coach'}</button></div>;
  if (sub === 'coach') return <>{subTabs}<Coach lang={lang} /></>;
  const chips = (['week', 'month', '7', '30', '90'] as A.Kind[]).map((k) => <button key={k} className={'chip' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>{d(k)}</button>);
  return (
    <>
      {subTabs}
      <section className="card">
        <h2>📊 {d('title')}</h2>
        <div className="chips">{chips}</div>
        <p className="muted">{cur[0]} → {cur[1]} · {d('prev')}: {prev[0]} → {prev[1]}</p>
        {msg && <p className="warn">{msg}</p>}
        {empty ? <p className="muted">{d('empty')}</p> : (
          <div className="grid2">
            <div className="stat">🏋️ {d('sess')}<b>{sc.length}</b><span className="muted">{d('weekMonth')}: {wkN} / {moN}</span></div>
            <div className="stat">📦 {d('vol')}<b>{Math.round(A.volume(sc))}</b><span className="muted">{d('volNote')}</span></div>
            <div className="stat">📋 {d('adh')}<b>{adc ? `${adc.completed}/${adc.planned}` : '—'}</b><span className="muted">{act ? d('adhNote') : d('noPlan')}</span></div>
            <div className="stat">🍽️ {d('nut')}<b>{nc ? `${Math.round(nc.k)} ${d('kcal')}` : '—'}</b><span className="muted">{nc ? `${d('prot' as any) === 'prot' ? '' : ''}P ${Math.round(nc.p)}${d('g')} · ${nc.days}/${nc.span} ${d('days')}` : d('noNut')}</span></div>
            <div className="stat">⚖️ {d('wt')}<b>{wc.avg != null ? wc.avg.toFixed(1) + ' kg' : '—'}</b><span className="muted">{wc.avg == null ? d('noW') : `${wc.pts.length} ${d('days')}`}</span></div>
            <div className="stat">⏭️ {d('next')}<b>{nxt ? nxt.day.name[i] : '—'}</b><span className="muted">{nxt ? nxt.date : d('noNext')}</span></div>
          </div>)}
      </section>
      {!empty && <>
        <section className="card" style={{ marginTop: 12 }} dir="ltr">
          <h3>{d('cFreq')}</h3>{wk.length ? <Bars vals={wk.map((w) => w.n)} labels={[wk[0].start.slice(5), wk[wk.length - 1].start.slice(5)]} /> : <p className="muted">{d('few')}</p>}
          <h3>{d('cVol')}</h3>{wk.length ? <Bars vals={wk.map((w) => Math.round(w.vol))} labels={[wk[0].start.slice(5), wk[wk.length - 1].start.slice(5)]} /> : <p className="muted">{d('few')}</p>}
          <h3>{d('cW')}</h3><Line pts={ws.filter((w) => A.inR(w.date, chartR)).sort((a, b) => a.date.localeCompare(b.date)).map((w) => ({ d: w.date, v: w.weightKg }))} few={d('few')} />
          <h3>{d('cK')}</h3>
          {target && nc ? <Bars vals={kDays.map((x) => (daily[x] ? Math.round(daily[x].k) : null))} labels={[kDays[0].slice(5), kDays[kDays.length - 1].slice(5)]} target={target.k} /> : <p className="muted">{d('few')}</p>}
          <h3>{d('cP')}</h3>
          {target && nc ? <Bars vals={kDays.map((x) => (daily[x] ? Math.round(daily[x].p) : null))} labels={[kDays[0].slice(5), kDays[kDays.length - 1].slice(5)]} target={target.p} /> : <p className="muted">{d('few')}</p>}
          <p className="muted" dir={lang === 'ar' ? 'rtl' : 'ltr'}>{d('gaps')}</p>
        </section>
        <section className="card" style={{ marginTop: 12 }}>
          <h3>{d('cEx')}</h3>
          {exIds.length === 0 ? <p className="muted">{d('few')}</p> : <>
            <div className="filters">
              <select value={curEx} onChange={(e) => setExSel(e.target.value)}>{exIds.map((id) => <option key={id} value={id}>{nm(id)}</option>)}</select>
              <select value={met} onChange={(e) => setMet(e.target.value as any)}>{(['top', 'reps', 'vol'] as const).map((k) => <option key={k} value={k}>{k === 'vol' ? d('vol') : d(k)}</option>)}</select>
            </div>
            <div dir="ltr"><Line pts={exS.map((x) => ({ d: x.date, v: Math.round(met === 'top' ? x.top : met === 'reps' ? x.reps : x.vol) }))} few={d('few')} /></div></>}
          <h3>🏆 {d('pr')}</h3><p className="muted">{d('prDef')}</p>
          {Object.keys(recs).length === 0 ? <p className="muted">{d('noPr')}</p> : Object.entries(recs).sort((a, b) => b[1].date.localeCompare(a[1].date)).slice(0, 6).map(([id, r]) => (
            <div key={id} className="row srow"><span style={{ flex: 1 }}>{nm(id)}</span><b>{r.kg > 0 ? `${r.kg} kg × ${r.reps}` : `${r.reps} ${d('reps')}`}</b><span className="muted">{r.date}</span>{r.prior && A.inR(r.date, cur) && <span className="chip on">{d('newB')}</span>}</div>))}
        </section>
        <section className="card" style={{ marginTop: 12 }}>
          <h3>🔁 {d('cmp')}</h3>
          {[['sess', sc.length, sp.length, 0], ['vol', Math.round(A.volume(sc)), sp.length ? Math.round(A.volume(sp)) : null, 0], ['kcal', nc ? nc.k : null, np ? np.k : null, 0], ['P', nc ? nc.p : null, np ? np.p : null, 0], ['kg', wc.avg, wp.avg, 1]].map(([k, a, b, dp]: any) => (
            <div key={k} className="row srow"><span style={{ flex: 1 }}>{k === 'sess' ? d('sess') : k === 'vol' ? d('vol') : k === 'kcal' ? d('kcal') : k === 'P' ? '🥩 P' : d('wt')}</span>
              <span>{fmt(a, dp)}</span><span className="muted">{fmt(b, dp)}</span><b>{dl(a, b, dp)}</b></div>))}
          <p className="muted">{d('cur')} · {d('prev')} · {d('delta')} — {d('gaps')}</p>
        </section>
        <section className="card" style={{ marginTop: 12 }}>
          <h3>💡 {d('ins')}</h3>
          {shown.length === 0 && <p className="muted">{d('noIns')}</p>}
          {shown.map((x) => {
            const [obs, rule] = txt(x), off = insR.dismissed[x.key] || insR.done[x.key];
            return (
              <div key={x.key} className="ent" style={off ? { opacity: 0.5 } : undefined}>
                <b>📌 {obs}</b>
                <span className="muted">{d('basis')}: {x.range[0]} → {x.range[1]} · n={x.n}<br />{d('rule')}: {rule}</span>
                {x.id.startsWith('w_') && <span className="muted">{d('wNote')}</span>}
                {x.sug && <p className="warn">💭 {d('sugL')}: {d('sug_' + x.sug)}</p>}
                {!off && <div className="row">{x.sug && <button className="ghost" onClick={() => mark(x.key, 'done')}>{d('doneB')}</button>}<button className="ghost" onClick={() => mark(x.key, 'dismissed')}>✕ {d('dis')}</button></div>}
              </div>);
          })}
          {hidden.length > 0 && <button className="ghost" onClick={() => setShowHid(!showHid)}>{d('restore')} ({hidden.length})</button>}
          <p className="muted">⚠️ {d('disc')}</p>
        </section></>}
    </>
  );
}
