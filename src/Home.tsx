import { useEffect, useState } from 'react';
import { Lang, t } from './i18n';
import * as db from './db';
import * as A from './analytics';
import { I, IconName } from './Icon';
import type { Day } from './planGen';

type Meas = { id: string; date: string; weightKg: number };
type Go = (tab: 'wk' | 'pl' | 'lib' | 'gl' | 'weight' | 'nu' | 'db') => void;

export default function Home({ lang, go, onStart, meas }: { lang: Lang; go: Go; onStart: (d: Day, planId: string) => void; meas: Meas[] }) {
  const T = (k: any) => t(lang, k);
  const i = lang === 'ar' ? 0 : 1;
  const loc = lang === 'ar' ? 'ar-u-nu-latn' : 'en-US';
  const [data, setData] = useState<{ ss: A.Session[]; plan: any; draft: boolean; kcal: number | null } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ws = await db.getAll<any>('workouts');
        const pl = await db.getAll<any>('plans');
        const ns = await db.getAll<any>('nutrition');
        const activeId = pl.find((x) => x.id === 'activePlan')?.planId;
        const today = A.ld(new Date());
        const day = A.dailyNutrition(ns.filter((x) => x.id.startsWith('log:')))[today];
        setData({
          ss: ws.filter((x) => x.id !== 'draft'),
          plan: pl.find((x) => x.id === activeId && x.id.startsWith('plan:')) ?? null,
          draft: ws.some((x) => x.id === 'draft'),
          kcal: day ? Math.round(day.k) : null,
        });
      } catch { setData({ ss: [], plan: null, draft: false, kcal: null }); }
    })();
  }, []);

  if (!data) return null;
  const today = A.ld(new Date());
  const nxt = A.nextWorkout(data.plan, data.ss, today);
  const weekN = A.inRange(data.ss, A.periods('week', today).cur).length;
  const now = new Date();
  const greet = now.getHours() < 12 ? T('morning') : T('evening');
  const dateStr = now.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  const last = meas[0], prev = meas[1];
  const diff = last && prev ? last.weightKg - prev.weightKg : null;

  let eyebrow = T('todayW'), title = '', sub = '', cta = '', run: () => void = () => go('wk'), cta2 = '', run2: (() => void) | null = null;
  if (data.draft) {
    title = T('unfinished'); cta = T('resumeW'); run = () => go('wk');
  } else if (nxt && data.plan) {
    const isToday = nxt.date === today;
    const wd = new Date(nxt.date + 'T12:00:00').toLocaleDateString(loc, { weekday: 'long' });
    eyebrow = isToday ? T('todayW') : `${T('nextW')} · ${wd}`;
    title = nxt.day.name[i];
    sub = `${nxt.day.items.length} ${T('exCount')} · ${data.plan.name}`;
    cta = T('startW'); run = () => onStart(nxt.day, data.plan.id);
    cta2 = T('freeW'); run2 = () => go('wk');
  } else {
    title = T('noPlan'); eyebrow = T('todayW');
    cta = T('makePlan'); run = () => go('pl');
    cta2 = T('freeW'); run2 = () => go('wk');
  }

  const tiles: [Parameters<Go>[0], IconName, string][] = [['pl', 'cal', T('pl')], ['lib', 'book', T('lib')], ['gl', 'target', T('gl')], ['weight', 'scale', T('weight')]];

  return (
    <>
      <section className="card hero">
        <div className="top">
          <span className="badge"><I n={data.draft ? 'timer' : 'dumbbell'} s={22} /></span>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">{greet} · {dateStr}</div>
            <div className="name">{title}</div>
          </div>
        </div>
        <p className="muted" style={{ marginTop: -4 }}>{sub || eyebrow}</p>
        <button className="primary block" onClick={run}><I n={data.draft ? 'play' : data.plan ? 'play' : 'plus'} s={18} /> {cta}</button>
        {cta2 && run2 && <button className="ghost block" onClick={run2}>{cta2}</button>}
      </section>

      <div className="grid3">
        <div className="kpi"><span className="l"><I n="cal" s={13} /> {T('weekSess')}</span><span className="v">{weekN}</span></div>
        <div className="kpi"><span className="l"><I n="scale" s={13} /> {T('wShort')}</span><span className="v" dir="ltr" style={{ textAlign: 'start' }}>{last ? last.weightKg : '—'}{diff != null && <small className="delta"> {diff > 0 ? '+' : ''}{diff.toFixed(1)}</small>}</span></div>
        <div className="kpi"><span className="l"><I n="flame" s={13} /> {T('todayKcal')}</span><span className="v">{data.kcal ?? '—'}</span></div>
      </div>

      <div className="sec-t">{T('quick')}</div>
      <div className="tiles">
        {tiles.map(([k, ic, label]) => <button key={k} className="tile" onClick={() => go(k)}><I n={ic} s={20} /> {label}</button>)}
      </div>
    </>
  );
}
