import { useEffect, useState } from 'react';
import { Lang, t } from './i18n';
import * as db from './db';
import Library from './Library';
import Workout from './Workout';
import Stats from './Stats';
import PlanTab from './Plan';
import Nutrition from './Nutrition';
import Dashboard from './Dashboard';
import Goals, { Banner } from './Goals';
import { InstallGuide, OnlineBadge, UpdateBanner } from './PwaBits';
import BackupPanel from './BackupPanel';
import Home from './Home';
import Weight from './Weight';
import More from './More';
import { snapshotNow } from './backupStore';
import { I, IconName } from './Icon';
import type { Day } from './planGen';

type Settings = { id: 'app'; lang: Lang; theme: 'light' | 'dark' };
type Meas = { id: string; date: string; weightKg: number };
type Tab = 'home' | 'wk' | 'nu' | 'db' | 'more' | 'pl' | 'lib' | 'gl' | 'st' | 'weight' | 'data';
// pages reached from "More": they show a back button and keep "More" highlighted
const MORE_TABS: Tab[] = ['pl', 'lib', 'gl', 'st', 'weight', 'data'];
const NAV: [Tab, IconName][] = [['home', 'home'], ['wk', 'dumbbell'], ['nu', 'food'], ['db', 'chart'], ['more', 'more']];

export default function App() {
  const [s, setS] = useState<Settings>({ id: 'app', lang: 'ar', theme: 'dark' });
  const [tab, setTab] = useState<Tab>('home');
  const [meas, setMeas] = useState<Meas[]>([]);
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState(false);
  const [link, setLink] = useState<{ planId: string; dayId: string } | null>(null);
  const T = (k: any) => t(s.lang, k);

  const load = async () => {
    const st = (await db.getAll<Settings>('settings'))[0];
    if (st) setS(st);
    setMeas((await db.getAll<Meas>('measurements')).sort((a, b) => b.date.localeCompare(a.date)));
  };
  useEffect(() => { load(); navigator.storage?.persist?.().then(setPersisted).catch(() => {}); }, []);
  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.documentElement.dir = s.lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = s.theme;
  }, [s]);
  useEffect(() => { window.scrollTo(0, 0); }, [tab]);

  const save = (n: Settings) => { setS(n); db.put('settings', n); };
  const startDay = async (d: Day, planId: string) => {
    const ws = await db.getAll<any>('workouts');
    if (!ws.some((x) => x.id === 'draft')) {
      await db.put('plans', { id: 'current', items: d.items.map((x) => ({ exId: x.exId, sets: x.sets, reps: x.repMax, repMin: x.repMin, repMax: x.repMax, rest: x.rest })) });
      setLink({ planId, dayId: d.id });
    } else alert(s.lang === 'ar' ? 'لديك جلسة غير مكتملة، أنهِها أو ألغِها أولاً.' : 'You have an unfinished session. Finish or cancel it first.');
    setTab('wk');
  };
  const download = (name: string, text: string, type: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
  };
  const wipe = async () => { if (confirm(T('confirmWipe'))) { try { await snapshotNow('before-wipe'); } catch { if (!confirm(s.lang === 'ar' ? 'تعذّرت لقطة الأمان. المتابعة بالحذف؟' : 'Safety snapshot failed. Delete anyway?')) return; } await db.clearAll(); setMeas([]); setMsg(T('ok')); } };

  const TITLES: Record<Tab, string> = { home: T('app'), wk: T('wk'), nu: T('nu'), db: T('prog'), more: T('more'), pl: T('pl'), lib: T('lib'), gl: T('gl'), st: T('st'), weight: T('weight'), data: T('data') };
  const sub = MORE_TABS.includes(tab);

  return (
    <div className="app">
      <header className="hdr">
        <div className="ttl">
          {sub && <button className="iconbtn" aria-label={T('goBack')} onClick={() => setTab('more')}><I n="chevl" s={22} /></button>}
          {tab === 'home' && <span style={{ color: 'var(--acc-t)', display: 'flex' }}><I n="dumbbell" s={24} /></span>}
          <h1>{TITLES[tab]}</h1>
          <OnlineBadge lang={s.lang} />
        </div>
        <div className="acts">
          <button className="ghost sm" onClick={() => save({ ...s, lang: s.lang === 'ar' ? 'en' : 'ar' })}>{T('lang')}</button>
          <button className="iconbtn" aria-label={T('appearance')} onClick={() => save({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })}><I n={s.theme === 'dark' ? 'sun' : 'moon'} s={20} /></button>
        </div>
      </header>
      <main>
        <UpdateBanner lang={s.lang} />
        <Banner key={tab} lang={s.lang} tab={tab} onGo={() => setTab('wk')} />
        {tab === 'home' && <Home lang={s.lang} meas={meas} go={(k) => setTab(k)} onStart={startDay} />}
        {tab === 'wk' && <Workout lang={s.lang} link={link} clearLink={() => setLink(null)} />}
        {tab === 'nu' && <Nutrition lang={s.lang} />}
        {tab === 'db' && <Dashboard lang={s.lang} />}
        {tab === 'more' && <More lang={s.lang} theme={s.theme} go={(k) => setTab(k)} setLang={(l) => save({ ...s, lang: l })} setTheme={(th) => save({ ...s, theme: th })} />}
        {tab === 'pl' && <PlanTab lang={s.lang} onStart={startDay} />}
        {tab === 'lib' && <Library lang={s.lang} />}
        {tab === 'gl' && <Goals lang={s.lang} />}
        {tab === 'st' && <Stats lang={s.lang} />}
        {tab === 'weight' && <Weight lang={s.lang} meas={meas} reload={load} />}
        {tab === 'data' && (
          <>
            <section className="card">
              <p className="warn"><I n="warn" s={16} /> {T('warn')}</p>
              <p className="muted"><I n="lock" s={14} /> {T('persist')}: {persisted ? T('persisted') : T('notPersisted')}</p>
            </section>
            <BackupPanel lang={s.lang} />
            <section className="card">
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <button onClick={() => download('measurements.csv', db.measurementsCsv([...meas].reverse()), 'text/csv')}><I n="file" s={18} /> {T('csv')}</button>
                <button className="danger" onClick={wipe}><I n="trash" s={18} /> {T('wipe')}</button>
              </div>
              <p className="muted">{T('recovery')}</p>
              {msg && <p>{msg}</p>}
            </section>
            <InstallGuide lang={s.lang} />
          </>
        )}
      </main>
      <nav aria-label="main">
        <div className="in">
          {NAV.map(([k, ic]) => {
            const on = tab === k || (k === 'more' && sub);
            return <button key={k} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined} onClick={() => setTab(k)}><I n={ic} s={22} /><span>{k === 'db' ? T('prog') : T(k as any)}</span></button>;
          })}
        </div>
      </nav>
    </div>
  );
}
