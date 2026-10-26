import { useEffect, useState } from 'react';
import { Lang, t } from './i18n';
import { EXERCISES } from './exercises';
import { META, LB } from './exerciseMeta';
import { DEFAULT, alts } from './planGen';
import * as A from './analytics';
import * as C from './coach';
import * as db from './db';

const K: Record<string, [string, string]> = {
  title:['مدرب التدريب (قواعد حسابية، وليس ذكاءً اصطناعياً)','Training coach (rule-based, not AI)'], load:['جارٍ التحميل…','Loading…'], err:['خطأ: ','Error: '],
  sum:['ملخص','Summary'], sess:['جلسات آخر 4 أسابيع','Sessions, last 4 weeks'], adh:['الالتزام بالخطة (4 أسابيع)','Plan adherence (4 weeks)'], noPlan:['لا توجد خطة مفعّلة','No active plan'],
  q1:['بعض التمارين بلا ربط عضلي كامل: لن تُقدَّم استنتاجات عن نقص عضلة محددة.','Some exercises lack complete muscle mapping: no conclusions about a specific muscle are drawn.'],
  q2:['لا بيانات جهد (RPE) في أغلب السجلات: لا أعرف مدى صعوبة المجموعات.','Most records have no effort (RPE): I cannot know how hard sets felt.'],
  recs:['التوصيات','Recommendations'], none:['لا توصيات الآن: البيانات غير كافية أو لا شيء لافت.','No recommendations: not enough data or nothing notable.'],
  obs:['الملاحظة','Observation'], data:['البيانات','Data'], rule:['القاعدة','Rule'], chg:['التغيير المقترح','Proposed change'], unc:['عدم اليقين','Uncertainty'],
  accept:['قبول (مراجعة أولاً)','Accept (review first)'], reject:['رفض','Reject'], dismiss:['إخفاء','Dismiss'], review:['مراجعة التغيير قبل التطبيق','Review the change before applying'], apply:['تطبيق','Apply'], cancel:['إلغاء','Cancel'],
  tgt:['الحمل المخطط لهذا التمرين في الجلسات القادمة','Planned load for this exercise in future sessions'], swapT:['نسخة جديدة من الخطة مع استبدال التمرين (الخطة الأصلية تبقى كما هي)','A NEW copy of the plan with the exercise swapped (your original plan stays unchanged)'],
  noAuto:['لا يتغير شيء إلا بعد تأكيدك. الأحمال لا تُعدَّل تلقائياً.','Nothing changes until you confirm. Loads are never changed automatically.'],
  vol:['الحجم الأسبوعي (مجموعات عمل)','Weekly volume (working sets)'], wk:['الأسبوع','Week'], direct:['مباشر','direct'], indirect:['غير مباشر','indirect'], freq:['التكرار الأسبوعي (جلسات)','Weekly frequency (sessions)'],
  nodata:['لا سجلات في هذا الأسبوع (ليس صفراً)','No records this week (not zero)'], below:['أقل من مداك','below your range'], within:['ضمن مداك','within your range'], above:['أعلى من مداك','above your range'],
  mapMiss:['تمارين غير مربوطة بعضلة (لم تُحسب)','Exercises with no muscle mapping (not counted)'], mapCoarse:['تمارين بربط عام فقط (تُحسب للمجموعة لا للعضلة الدقيقة)','Group-level mapping only (counted for the group, not the fine muscle)'],
  ex:['أداء التمرين','Exercise performance'], date:['التاريخ','Date'], top:['أثقل مجموعة','Top set'], done:['منجز/مخطط','done/planned'], volL:['الحجم','Volume'], e1:['1RM تقديري','Est. 1RM'],
  set:['إعدادات القواعد','Rule settings'], inc:['أقصى زيادة حمل (كغم)','Max load step (kg)'], rpe:['أعلى متوسط جهد مقبول للزيادة','Max average RPE allowed for an increase'], rng:['مدى المجموعات الأسبوعي (إرشاد قابل للتعديل، وليس متطلباً علمياً عاماً)','Weekly set range (adjustable guidance, not a universal requirement)'],
  hist:['سجل التوصيات','Recommendation history'], accepted:['مقبولة','accepted'], rejected:['مرفوضة','rejected'], dismissed:['مخفية','dismissed'], undo:['تراجع','Undo'], undone:['تم التراجع','undone'], act:['تفعيل النسخة','Activate copy'],
  defs:['كيف تُحسب المقاييس','How metrics are defined'], safe:['⚠️ لا تشخيص طبي. لا تتمرّن رغم الألم، ولا تزد الحمل بقفزات كبيرة. انخفاض الأداء سبب للمراجعة وليس دليلاً على سبب بعينه.','⚠️ Not medical advice. Never train through pain or jump loads aggressively. A decline is a reason to review, not proof of a cause.'],
  d1:['مجموعة عمل = مجموعة مكتملة بتكرارات > 0 وغير موسومة كإحماء. المجموعات المخطط لها أو غير المكتملة لا تُحسب.','Working set = completed set with reps > 0, not flagged warm-up. Planned or incomplete sets are not counted.'],
  d2:['الحجم المباشر: مجموعات يكون فيها العضلة رئيسية للتمرين. غير المباشر: عضلة ثانوية، ويُعرض منفصلاً ولا يُضاف للمباشر.','Direct volume: sets where the muscle is the exercise’s primary muscle. Indirect: secondary muscle, shown separately and never added to direct.'],
  d3:['حجم التدريب = Σ (حمل × تكرار) للمجموعات العاملة. تمارين وزن الجسم (0 كغم) لا تضيف حجماً.','Training volume = Σ (load × reps) of working sets. Bodyweight sets (0 kg) add no volume.'],
  d4:['أثقل مجموعة = أعلى حمل ثم أكثر تكرار. 1RM التقديري = حمل × (1 + تكرار/30) (معادلة Epley) للمجموعات 1–10 تكرارات فقط؛ هو تقدير وليس قياساً مباشراً.','Top set = highest load, ties by reps. Est. 1RM = load × (1 + reps/30) (Epley) for 1–10 reps only; an estimate, not a direct measurement.'],
  d5:['الزيادة المقترحة: جلستان متتاليتان بنفس الحمل وكل المجموعات عند أعلى نطاق التكرار، بلا ألم، وجهد ≤ العتبة إن سُجّل. الزيادة ≤ 5% (≥ 1 كغم) وضمن حدك.','Load increase: 2 consecutive sessions at the same load with every set at the top of the rep range, no pain, effort ≤ threshold if recorded. Step ≤ ~5% (min 1 kg) and within your cap.'],
  d6:['الأسبوع يبدأ السبت. الأيام بلا سجلات تُعتبر "لا بيانات" وليست صفراً.','Weeks start Saturday. Days without records mean "no data", not zero.'],
  r_load_up:['التمرين {ex}: أكملت كل المجموعات عند {t} تكراراً بحمل {top} كغم في جلستين متتاليتين.','{ex}: every set reached {t} reps at {top} kg in 2 consecutive sessions.'],
  r_load_up_c:['رفع الحمل المخطط إلى {kg} كغم','Raise planned load to {kg} kg'],
  r_hold:['{ex}: النتائج متفاوتة ({h} من {of} جلسات بلغت أعلى النطاق ({t})). الأنسب تثبيت الحمل الحالي.','{ex}: mixed results ({h} of {of} sessions reached the top of the range ({t})). Keeping the current load fits best.'],
  r_decline:['{ex}: حجم التمرين انخفض في آخر 3 جلسات ({v}).','{ex}: volume fell across the last 3 sessions ({v}).'],
  r_decline_c:['راجع التقنية والراحة والنوم وبرمجة الجلسات. هذا ليس تشخيصاً لسبب. إن وُجد ألم فتوقف واستشر مختصاً.','Review technique, rest, sleep and programming. This is not a diagnosis of a cause. If there is pain, stop and see a professional.'],
  r_substitute:['{ex}: انخفاض مستمر في 4 جلسات.','{ex}: continued decline over 4 sessions.'], r_substitute_c:['استبدال بتمرين {to} في نسخة جديدة من الخطة','Swap to {to} in a new copy of the plan'],
  r_volume_gap:['{g}: المسجَّل أقل من 60% من المخطط ({p} مجموعة/أسبوع) في أسبوعين ({w}).','{g}: recorded sets were below 60% of the plan ({p}/week) in two weeks ({w}).'], r_volume_gap_c:['راجع حجم الخطة الأسبوعي أو جدولك. لم يتغير شيء.','Review the plan’s weekly volume or your schedule. Nothing was changed.'],
  r_below_range:['{g}: مجموعات العمل المسجلة {w} أقل من حدك الأدنى ({lo}) في أسبوعين.','{g}: recorded working sets {w} are below your minimum ({lo}) in two weeks.'], r_above_range:['{g}: مجموعات العمل المسجلة {w} أعلى من حدك الأعلى ({hi}) في أسبوعين.','{g}: recorded working sets {w} are above your maximum ({hi}) in two weeks.'],
  r_range_c:['راجع حجمك الأسبوعي إن كان هذا مقصوداً. المدى إرشاد قابل للتعديل.','Review your weekly volume if this is unintended. The range is adjustable guidance.'],
  u_small:['عينة صغيرة','small sample'], u_no_effort:['لا بيانات جهد: لا أعرف مدى صعوبة المجموعات','no effort data: I do not know how hard the sets felt'], u_cause:['السبب غير معروف','cause unknown'], u_partial:['قد يكون التسجيل ناقصاً','logging may be incomplete'], u_range:['المدى تقريبي وقابل للتعديل','the range is approximate and adjustable'],
};
const fill = (s: string, p: Record<string, any>) => s.replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? ''));
const UNC: Record<string, string> = { 'small-sample': 'u_small', 'no-effort-data': 'u_no_effort', 'cause-unknown': 'u_cause', 'partial-logging': 'u_partial', 'range-is-guidance': 'u_range' };
const ld = (d: Date) => d.toLocaleDateString('sv');

export default function Coach({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1, k = (x: string) => K[x]?.[i] ?? x, T = (x: any) => t(lang, x), lb = (x: string) => LB[x]?.[i] ?? x;
  const [ready, setReady] = useState(false);
  const [ss, setSs] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [activeId, setActiveId] = useState('');
  const [cust, setCust] = useState<any[]>([]);
  const [co, setCo] = useState<any>({ id: 'coach', dismissed: {}, rejected: {}, accepted: {}, targets: {} });
  const [cfg, setCfg] = useState<C.Cfg>(C.CFG0);
  const [off, setOff] = useState(0);
  const [exSel, setExSel] = useState('');
  const [rev, setRev] = useState<C.Rec | null>(null);
  const [msg, setMsg] = useState('');
  const load = async () => {
    try {
      const pl = await db.getAll<any>('plans');
      setSs((await db.getAll<any>('workouts')).filter((x) => x.id !== 'draft'));
      setPlans(pl.filter((x) => x.id.startsWith('plan:'))); setActiveId(pl.find((x) => x.id === 'activePlan')?.planId ?? '');
      setCo({ id: 'coach', dismissed: {}, rejected: {}, accepted: {}, targets: {}, ...(pl.find((x) => x.id === 'coach') ?? {}) });
      const cf = pl.find((x) => x.id === 'coachcfg'); setCfg({ ...C.CFG0, ...(cf?.cfg ?? {}), ranges: { ...C.CFG0.ranges, ...(cf?.cfg?.ranges ?? {}) } });
      setCust(await db.getAll<any>('exercises'));
    } catch (e: any) { setMsg(k('err') + e.message); }
    setReady(true);
  };
  useEffect(() => { load(); }, []);
  const run = async (f: () => Promise<any>) => { try { await f(); await load(); } catch (e: any) { setMsg(k('err') + e.message); } };
  if (!ready) return <section className="card"><p className="muted">⏳ {k('load')}</p></section>;

  const today = ld(new Date()), act = plans.find((p) => p.id === activeId);
  const exName = (id: string) => { const b = (EXERCISES as any[]).find((e) => e.id === id); return b ? b[lang] : cust.find((c) => c.id === id)?.name ?? id; };
  const mapEx = (id: string): C.Map | null => {
    const b = (EXERCISES as any[]).find((e) => e.id === id);
    if (b && META[id]) return { g: b.m, pm: META[id][0], sm: META[id][1].split(',').filter(Boolean) };
    const c = cust.find((x) => x.id === id);
    if (!c) return null;
    return { g: c.muscle, pm: c.ref ? c.pm : undefined, sm: c.ref ? (c.sm ?? '').split(',').filter(Boolean) : [] };
  };
  const altsOf = (id: string) => alts(id, act?.profile ?? { ...DEFAULT, equip: 'gym' });
  const recsAll = C.recommend({ ss, plan: act, mapEx, alts: altsOf, cfg, today });
  const open = recsAll.filter((r) => !co.dismissed[r.key] && !co.rejected[r.key] && !co.accepted[r.key]);
  const wk0 = A.weekStart(today), ws = A.addDays(wk0, -7 * off), wr: A.Range = [ws, A.addDays(ws, 6)];
  const vol = C.weeklyVolume(ss, mapEx, wr);
  const adh = A.adherence(act, ss, [A.addDays(today, -27), today], today);
  const sess4 = A.inRange(C.dedupe(ss), [A.addDays(today, -27), today]).length;
  const allSets = C.dedupe(ss).flatMap((s) => s.entries.flatMap((e: any) => C.workingSets(e)));
  const noRpe = allSets.length > 0 && allSets.filter((s: any) => s.rpe !== undefined && s.rpe !== '').length / allSets.length < 0.5;
  const exIds = Array.from(new Set(C.dedupe(ss).flatMap((s) => s.entries.map((e: any) => e.exId))));
  const curEx = exSel || exIds[0];
  const eh = curEx ? C.exerciseHistory(ss, curEx).slice(-6).reverse() : [];

  const save = (rec: any) => run(() => db.put('plans', rec));
  const mark = (key: string, f: 'dismissed' | 'rejected') => save({ ...co, [f]: { ...co[f], [key]: Date.now() } });
  const apply = (r: C.Rec) => {
    const ch = r.change; setRev(null); if (!ch) return;
    if (ch.type === 'target') save({ ...co, targets: { ...co.targets, [ch.exId]: { kg: ch.kg, ts: Date.now(), key: r.key } }, accepted: { ...co.accepted, [r.key]: { ts: Date.now(), type: 'target', exId: ch.exId, kg: ch.kg, prev: co.targets[ch.exId] ?? null } } });
    else run(async () => { const id = 'plan:' + crypto.randomUUID(); await db.put('plans', C.applySwap(act, ch, id, lang === 'ar' ? 'مدرب' : 'coach', new Date().toISOString())); await db.put('plans', { ...co, accepted: { ...co.accepted, [r.key]: { ts: Date.now(), type: 'swap', newPlanId: id, basePlanId: act.id, from: ch.from, to: ch.to } } }); });
  };
  const undo = (key: string) => {
    const a = co.accepted[key]; if (!a || a.undone) return;
    if (a.type === 'target') { const t = { ...co.targets }; if (a.prev) t[a.exId] = a.prev; else delete t[a.exId]; save({ ...co, targets: t, accepted: { ...co.accepted, [key]: { ...a, undone: Date.now() } } }); }
    else run(async () => { await db.remove('plans', a.newPlanId); if (activeId === a.newPlanId) await db.put('plans', { id: 'activePlan', planId: a.basePlanId }); await db.put('plans', { ...co, accepted: { ...co.accepted, [key]: { ...a, undone: Date.now() } } }); });
  };
  const text = (r: C.Rec) => {
    const p: any = { ...r.p, ex: r.ex ? exName(r.ex) : '', g: r.group ? T(r.group) : '', t: r.p.target, top: r.p.top, h: r.p.hits, of: r.p.of, v: (r.p.v ?? []).join(' ← '), w: (r.p.w ?? []).join(' / '), p: r.p.planned, to: r.p.to ? exName(r.p.to) : '' };
    const ch = r.change?.type === 'target' ? fill(k('r_load_up_c'), p) : r.change?.type === 'swap' ? fill(k('r_substitute_c'), p) : k(r.rule === 'decline' ? 'r_decline_c' : r.rule === 'volume_gap' ? 'r_volume_gap_c' : r.rule.endsWith('_range') ? 'r_range_c' : 'r_hold_c');
    const obs = fill(k('r_' + r.rule), p);
    return { obs, ch: r.rule === 'hold' ? '' : ch };
  };
  const setCfgSave = (c: C.Cfg) => run(() => db.put('plans', { id: 'coachcfg', cfg: c }));

  return (
    <>
      <section className="card">
        <h2>🧠 {k('title')}</h2>
        {msg && <p className="warn">{msg}</p>}
        <div className="grid2">
          <div className="stat">🏋️ {k('sess')}<b>{sess4}</b></div>
          <div className="stat">📋 {k('adh')}<b>{adh ? `${adh.completed}/${adh.planned}` : '—'}</b><span className="muted">{act ? '' : k('noPlan')}</span></div>
        </div>
        {vol.missing.length + vol.coarse.length > 0 && <p className="muted">ℹ️ {k('q1')}</p>}
        {noRpe && <p className="muted">ℹ️ {k('q2')}</p>}
        <p className="muted">🔒 {k('noAuto')}</p>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>💡 {k('recs')}</h3>
        {open.length === 0 && <p className="muted">{k('none')}</p>}
        {open.map((r) => { const x = text(r); const target = r.change; return (
          <div key={r.key} className="ent">
            <b>📌 {x.obs}</b>
            <span className="muted">{k('data')}: {r.range[0]} → {r.range[1]} · n={r.n}</span>
            {x.ch && <p>👉 <b>{k('chg')}:</b> {x.ch}</p>}
            <span className="muted">{k('unc')}: {r.unc.map((u) => k(UNC[u])).join(' · ')}</span>
            {r.p.pain && <p className="warn">🤕 {k('r_decline_c')}</p>}
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {target && <button onClick={() => setRev(r)}>✔ {k('accept')}</button>}
              {target && <button className="ghost" onClick={() => mark(r.key, 'rejected')}>✕ {k('reject')}</button>}
              <button className="ghost" onClick={() => mark(r.key, 'dismissed')}>{k('dismiss')}</button>
            </div>
          </div>); })}
        {rev && rev.change && (
          <div className="ent pop"><b>🔎 {k('review')}</b>
            {rev.change.type === 'target' ? <p>{k('tgt')}: <b>{exName(rev.change.exId)}</b>: {rev.change.from} → <b>{rev.change.kg}</b> kg</p>
              : <p>{k('swapT')}: <b>{exName(rev.change.from)}</b> → <b>{exName(rev.change.to)}</b></p>}
            <div className="row"><button onClick={() => apply(rev)}>✔ {k('apply')}</button><button className="ghost" onClick={() => setRev(null)}>{k('cancel')}</button></div></div>)}
        <p className="muted">{k('safe')}</p>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>📊 {k('vol')}</h3>
        <div className="row" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button className="ghost" disabled={off >= 12} onClick={() => setOff(off + 1)}>{lang === 'ar' ? '▶' : '◀'}</button><b>{k('wk')}: {wr[0]} → {wr[1]}</b>
          <button className="ghost" disabled={off === 0} onClick={() => setOff(off - 1)}>{lang === 'ar' ? '◀' : '▶'}</button></div>
        {vol.sessions === 0 ? <p className="muted">{k('nodata')}</p> : <>
          {C.GROUPS.filter((g) => vol.grp[g] != null).map((g) => { const [lo, hi] = cfg.ranges[g] ?? [0, 999], n = vol.grp[g]; return (
            <div key={g}><div className="row"><b style={{ flex: 1 }}>{T(g)}</b><span>{n} · {k('freq').split(' ')[0]} {vol.freq[g] ?? 0}</span><span className="muted">{n < lo ? k('below') : n > hi ? k('above') : k('within')} ({lo}–{hi})</span></div>
              <div className="bar"><i style={{ width: Math.min(100, (n / Math.max(hi, 1)) * 100) + '%' }} /></div></div>); })}
          <p className="muted">{k('freq')}: {C.GROUPS.filter((g) => vol.freq[g]).map((g) => `${T(g)} ${vol.freq[g]}`).join(' · ') || '—'}</p>
          {Object.keys(vol.direct).map((m) => <div key={m} className="row srow"><span style={{ flex: 1 }}>{lb(m)}</span><span>{vol.direct[m]} {k('direct')}</span><span className="muted">{vol.indirect[m] ?? 0} {k('indirect')}</span></div>)}
          {vol.missing.length > 0 && <p className="muted">⚠️ {k('mapMiss')}: {vol.missing.map(exName).join(', ')}</p>}
          {vol.coarse.length > 0 && <p className="muted">ℹ️ {k('mapCoarse')}: {vol.coarse.map(exName).join(', ')}</p>}</>}
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>📈 {k('ex')}</h3>
        {exIds.length === 0 ? <p className="muted">{k('nodata')}</p> : <>
          <select value={curEx} onChange={(e) => setExSel(e.target.value)}>{exIds.map((id) => <option key={id} value={id}>{exName(id)}</option>)}</select>
          {eh.map((h) => <div key={h.date} className="row srow"><span style={{ flex: 1 }}>{h.date}</span><span>{h.top > 0 ? `${h.top}kg×${h.topReps}` : `${h.topReps} ${k('top')}`}</span><span className="muted">{h.workSets}/{h.prescribed ?? '—'} · {k('volL')} {Math.round(h.vol)} · {k('e1')} {h.e1rm ?? '—'}</span></div>)}</>}
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>⚙️ {k('set')}</h3>
        <label>{k('inc')}<input inputMode="decimal" value={cfg.inc} onChange={(e) => setCfgSave({ ...cfg, inc: Math.min(5, Math.max(0.5, +e.target.value || 0.5)) })} /></label>
        <label>{k('rpe')}<input inputMode="decimal" value={cfg.maxRpe} onChange={(e) => setCfgSave({ ...cfg, maxRpe: Math.min(10, Math.max(5, +e.target.value || 8.5)) })} /></label>
        <p className="muted">{k('rng')}</p>
        {C.GROUPS.map((g) => <div key={g} className="row srow"><span style={{ flex: 1 }}>{T(g)}</span>
          <input style={{ maxWidth: 64 }} inputMode="numeric" value={cfg.ranges[g][0]} onChange={(e) => setCfgSave({ ...cfg, ranges: { ...cfg.ranges, [g]: [Math.max(0, +e.target.value || 0), cfg.ranges[g][1]] } })} />
          <input style={{ maxWidth: 64 }} inputMode="numeric" value={cfg.ranges[g][1]} onChange={(e) => setCfgSave({ ...cfg, ranges: { ...cfg.ranges, [g]: [cfg.ranges[g][0], Math.max(1, +e.target.value || 1)] } })} /></div>)}
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>🗂️ {k('hist')}</h3>
        {Object.keys(co.accepted).length + Object.keys(co.rejected).length + Object.keys(co.dismissed).length === 0 && <p className="muted">—</p>}
        {Object.entries(co.accepted).map(([key, a]: any) => (
          <div key={key} className="row srow"><span style={{ flex: 1 }}>✔ {k('accepted')} · {new Date(a.ts).toLocaleDateString('sv')} · {a.type === 'target' ? `${exName(a.exId)} → ${a.kg} kg` : `${exName(a.from)} → ${exName(a.to)}`}{a.undone ? ` · ${k('undone')}` : ''}</span>
            {a.type === 'swap' && !a.undone && activeId !== a.newPlanId && <button className="ghost" onClick={() => save({ id: 'activePlan', planId: a.newPlanId })}>{k('act')}</button>}
            {!a.undone && <button className="ghost" onClick={() => undo(key)}>↩ {k('undo')}</button>}</div>))}
        {Object.entries(co.rejected).map(([key, ts]: any) => <p key={key} className="muted">✕ {k('rejected')} · {new Date(ts).toLocaleDateString('sv')} · {key.split(':').slice(0, 2).join(' ')}</p>)}
        {Object.entries(co.dismissed).map(([key, ts]: any) => <p key={key} className="muted">• {k('dismissed')} · {new Date(ts).toLocaleDateString('sv')} · {key.split(':').slice(0, 2).join(' ')}</p>)}
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h3>📖 {k('defs')}</h3>
        {['d1', 'd2', 'd3', 'd4', 'd5', 'd6'].map((d) => <p key={d} className="muted">• {k(d)}</p>)}
      </section>
    </>
  );
}
