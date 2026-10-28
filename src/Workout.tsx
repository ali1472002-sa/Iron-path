import { useEffect, useState } from 'react';
import { Lang } from './i18n';
import { EXERCISES } from './exercises';
import * as db from './db';
import Live, { SummaryCard } from './Live';
import { I } from './Icon';

type SetRow = { kg: string; reps: string; done: boolean; rest?: number };
type Entry = { exId: string; sets: SetRow[]; note?: string; pain?: boolean };
type Session = { id: string; date: string; entries: Entry[]; planId?: string; dayId?: string };

const W: Record<string, [string, string]> = {
  plan:['خطة التدريب','Training plan'], emptyPlan:['أضف تمارين من المزيد ← التمارين.','Add exercises from More → Exercises.'],
  start:['ابدأ التمرين','Start workout'], finish:['إنهاء وحفظ','Finish & save'], cancel:['إلغاء','Cancel'],
  kg:['كغم','kg'], reps:['تكرار','reps'], sets:['مجموعات','sets'], addSet:['مجموعة','Set'], rest:['الراحة','Rest'],
  hist:['السجل','History'], noHist:['لا توجد تمارين محفوظة','No saved workouts'], vol:['الحجم','Volume'],
  up:['اقتراح: ارفع الوزن إلى','Suggestion: increase to'], keep:['اقتراح: ثبّت الوزن عند','Suggestion: stay at'],
  more:['اقتراح: حاول زيادة تكرار واحد','Suggestion: try one more rep'],
  note:['الاقتراح مبني على آخر تمرين لك: إن أكملت كل التكرارات المستهدفة يُقترح رفع 2.5 كغم.','Based on your last session: if you hit all target reps, +2.5 kg is suggested.'],
  over:['انتهت الراحة ','Rest over '],
  hold:['الأداء انخفض عن الجلسة السابقة: لا زيادة مقترحة','Performance dropped vs the previous session: no increase suggested'],
  pain:['سجّلت ألماً في آخر جلسة: لا زيادة مقترحة','You logged pain last session: no increase suggested'],
  accept:['قبول','Accept'], reject:['تجاهل','Dismiss'], last:['آخر مرة:','Last time:'], today:['حجم اليوم / آخر مرة:','Volume today / last:'],
  add:['إضافة تمرين','Add exercise'], empty:['ابدأ جلسة فارغة','Start empty session'], noteP:['ملاحظة (اختياري)','Note (optional)'],
  disc:['الاقتراحات إرشادية فقط وليست توصية طبية. توقف عند الألم.','Suggestions are guidance only, not medical advice. Stop if you feel pain.'],
};

export default function Workout({ lang, link, clearLink }: { lang: Lang; link?: { planId: string; dayId: string } | null; clearLink?: () => void }) {
  const i = lang === 'ar' ? 0 : 1;
  const w = (k: string) => W[k][i];
  const [plan, setPlan] = useState<any[]>([]);
  const [hist, setHist] = useState<Session[]>([]);
  const [draft, setDraft] = useState<Session | null>(null);
  const [cust, setCust] = useState<any[]>([]);
  const [rest, setRest] = useState(0);
  const [restLen, setRestLen] = useState(90);
  const [flash, setFlash] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [coachT, setCoachT] = useState<Record<string, any>>({});
  const [paused, setPaused] = useState(false);
  const [dis, setDis] = useState<string[]>([]);
  const [pick, setPick] = useState('');

  const load = async () => {
    const pls = await db.getAll<any>('plans');
    setPlan(pls.find((p) => p.id === 'current')?.items ?? []);
    setCoachT(pls.find((p) => p.id === 'coach')?.targets ?? {});
    const ws = await db.getAll<Session>('workouts');
    setDraft(ws.find((x) => x.id === 'draft') ?? null);
    setHist(ws.filter((x) => x.id !== 'draft').sort((a, b) => b.date.localeCompare(a.date)));
    setCust(await db.getAll<any>('exercises'));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (rest <= 0 || paused) return;
    const id = setTimeout(() => {
      setRest(rest - 1);
      if (rest === 1) {
        setFlash(true); setTimeout(() => setFlash(false), 4000);
        try { (navigator as any).vibrate?.(300); const c = new AudioContext(); const o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 880; o.start(); setTimeout(() => { o.stop(); c.close(); }, 300); } catch {}
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [rest, paused]);

  const nm = (id: string) => (EXERCISES as any[]).find((e) => e.id === id)?.[lang] ?? cust.find((c) => c.id === id)?.name ?? id;
  const vol = (e: Entry) => e.sets.reduce((t, r) => t + (+r.kg || 0) * (+r.reps || 0), 0);
  const volDone = (e: Entry) => vol({ ...e, sets: e.sets.filter((r) => r.done) });
  const prev = (exId: string) => hist.map((x) => ({ date: x.date, e: x.entries.find((y) => y.exId === exId) })).filter((x) => x.e && x.e.sets.length);
  const suggest = (exId: string, target: number): any => {
    const p = prev(exId);
    if (!p.length) return null;
    const e = p[0].e!;
    const kg = Math.max(...e.sets.map((r) => +r.kg || 0));
    if (e.pain) return { kg, k: 'pain', date: p[0].date, e };
    if (p[1] && vol(e) < vol(p[1].e!)) return { kg, k: 'hold', date: p[0].date, e };
    const hit = e.sets.every((r) => (+r.reps || 0) >= target);
    return { kg: hit ? (kg > 0 ? kg + 2.5 : 0) : kg, k: hit ? (kg > 0 ? 'up' : 'more') : 'keep', base: kg, date: p[0].date, e };
  };
  const lastKg = (sg: any) => (sg ? (sg.k === 'up' ? sg.base : sg.kg) : 0);
  const editPlan = (idx: number, patch: any) =>
    db.put('plans', { id: 'current', items: plan.map((p, k) => (k === idx ? { ...p, ...patch, ...(patch.reps != null ? { repMax: patch.reps, repMin: Math.min(p.repMin ?? patch.reps, patch.reps) } : {}) } : p)) }).then(load);
  const removePlan = (idx: number) => db.put('plans', { id: 'current', items: plan.filter((_, k) => k !== idx) }).then(load);

  const save = (d: Session) => { setDraft(d); db.put('workouts', d); };
  const start = () => {
    const t0 = Date.now();
    save({ id: 'draft', date: new Date(t0).toISOString(), startedAt: t0, pausedMs: 0, autoRest: true, cur: 0, ...(link ? { planId: link.planId, dayId: link.dayId } : {}),
      entries: plan.map((p) => {
        const sg = suggest(p.exId, p.reps);
        const kg = coachT[p.exId]?.kg ? String(coachT[p.exId].kg) : lastKg(sg) ? String(lastKg(sg)) : '', rMax = p.repMax ?? p.reps, rMin = p.repMin ?? p.reps;
        return { exId: p.exId, plan: { sets: p.sets, repMin: rMin, repMax: rMax, rest: p.rest ?? 90 }, sets: Array.from({ length: p.sets }, () => ({ kg, pk: kg, reps: String(rMax), pr: rMin === rMax ? String(rMax) : `${rMin}–${rMax}`, done: false })) };
      }) } as any);
    clearLink?.();
  };
  const setRow = (ei: number, si: number, patch: Partial<SetRow>) => {
    const d: Session = JSON.parse(JSON.stringify(draft));
    Object.assign(d.entries[ei].sets[si], patch.done ? { ...patch, rest: restLen } : patch); save(d);
    if (patch.done) setRest(restLen);
  };
  const addSet = (ei: number) => {
    const d: Session = JSON.parse(JSON.stringify(draft));
    const l = d.entries[ei].sets.slice(-1)[0];
    d.entries[ei].sets.push({ kg: l?.kg ?? '', reps: l?.reps ?? '10', done: false }); save(d);
  };
  const addEx = (id: string) => {
    if (!id || !draft) return;
    const d: Session = JSON.parse(JSON.stringify(draft));
    d.entries.push({ exId: id, sets: Array.from({ length: 3 }, () => ({ kg: '', reps: '10', done: false })) }); save(d);
  };
  const setEntry = (ei: number, patch: Partial<Entry>) => { const d: Session = JSON.parse(JSON.stringify(draft)); Object.assign(d.entries[ei], patch); save(d); };
  const accept = (ei: number, sg: any) => {
    const d: Session = JSON.parse(JSON.stringify(draft));
    d.entries[ei].sets.forEach((r) => { if (r.done) return; if (sg.k === 'up') r.kg = String(sg.kg); else r.reps = String((+r.reps || 0) + 1); });
    save(d); setDis([...dis, d.entries[ei].exId]);
  };
  const finish = async () => {
    const entries = draft!.entries.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })).filter((e) => e.sets.length);
    await db.remove('workouts', 'draft');
    if (entries.length) await db.put('workouts', { ...draft!, id: crypto.randomUUID(), entries });
    setDraft(null); setRest(0); load();
  };
  const cancel = async () => { await db.remove('workouts', 'draft'); setDraft(null); setRest(0); };
  const volume = (s: Session) => Math.round(s.entries.reduce((a, e) => a + e.sets.reduce((b, r) => b + (+r.kg || 0) * (+r.reps || 0), 0), 0));

  return (
    <>
      {summary && <SummaryCard lang={lang} s={summary} nm={nm} onClose={() => setSummary(null)} />}
      {draft ? (
        <Live lang={lang} draft={draft} save={save} hist={hist} suggest={suggest} nm={nm} cust={cust}
          onFinish={(s: any) => { setSummary(s); setDraft(null); load(); }} onAbandon={async () => { await db.remove('workouts', 'draft'); setDraft(null); load(); }} />
      ) : (
        <section className="card">
          <h2><I n="cal" /> {w('plan')}</h2>
          {plan.length === 0 ? <p className="muted">{w('emptyPlan')}</p> : plan.map((p, k) => (
            <div key={p.exId} className="row srow">
              <b style={{ flex: 1 }}>{nm(p.exId)}</b>
              <button className="ghost" onClick={() => editPlan(k, { sets: Math.max(1, p.sets - 1) })}>−</button>
              <span>{p.sets}×</span>
              <button className="ghost" onClick={() => editPlan(k, { sets: p.sets + 1 })}>+</button>
              <button className="ghost" onClick={() => editPlan(k, { reps: Math.max(1, p.reps - 1) })}>−</button>
              <span>{p.reps}</span>
              <button className="ghost" onClick={() => editPlan(k, { reps: p.reps + 1 })}>+</button>
              <button className="ghost" onClick={() => removePlan(k)}><I n="x" /></button>
            </div>
          ))}
          <button className="primary" onClick={start}><I n="play" /> {plan.length ? w('start') : w('empty')}</button>{plan.length > 0 && <p className="muted">{w('note')}</p>}
        </section>
      )}
      <section className="card" style={{ marginTop: 12 }}>
        <h2><I n="file" /> {w('hist')}</h2>
        {hist.length === 0 && <p className="muted">{w('noHist')}</p>}
        {hist.slice(0, 15).map((s) => (
          <div key={s.id} className="row srow">
            <span style={{ flex: 1 }}>{s.date.slice(0, 10)} · {s.entries.length} · {w('vol')} {volume(s)}</span>
            <button className="ghost" onClick={async () => { await db.remove('workouts', s.id); load(); }}><I n="trash" /></button>
          </div>
        ))}
      </section>
    </>
  );
}
