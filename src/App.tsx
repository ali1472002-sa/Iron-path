import { useEffect, useRef, useState } from 'react';
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
import { snapshotNow } from './backupStore';
import type { Day } from './planGen';

type Settings = { id: 'app'; lang: Lang; theme: 'light' | 'dark' };
type Meas = { id: string; date: string; weightKg: number };

export default function App() {
  const [s, setS] = useState<Settings>({ id: 'app', lang: 'ar', theme: 'dark' });
  const [tab, setTab] = useState<'gl' | 'db' | 'home' | 'wk' | 'pl' | 'nu' | 'lib' | 'st' | 'data'>('db');
  const [meas, setMeas] = useState<Meas[]>([]);
  const [w, setW] = useState('');
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState(false);
  const [link, setLink] = useState<{ planId: string; dayId: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
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

  const save = (n: Settings) => { setS(n); db.put('settings', n); };
  const addW = async () => {
    const v = parseFloat(w);
    if (!(v > 20 && v < 400)) return;
    await db.put('measurements', { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), weightKg: v });
    setW(''); load();
  };
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

  return (
    <div className="app">
      <header>
        <h1>🏋️ {T('app')} <OnlineBadge lang={s.lang} /></h1>
        <div>
          <button className="ghost" onClick={() => save({ ...s, lang: s.lang === 'ar' ? 'en' : 'ar' })}>{T('lang')}</button>
          <button className="ghost" onClick={() => save({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })}>{s.theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </header>
      <main>
        {tab === 'home' && (
          <section className="card">
            <h2>⚖️ {T('weight')}</h2>
            <div className="row">
              <input inputMode="decimal" placeholder={T('kg')} value={w} onChange={(e) => setW(e.target.value)} />
              <button onClick={addW}>{T('add')}</button>
            </div>
            {meas.length === 0 ? <p className="muted">{T('empty')}</p> :
              <ul>{meas.map((m) => <li key={m.id}><span>{m.date}</span><b>{m.weightKg} kg</b><button className="ghost" onClick={async () => { await db.remove('measurements', m.id); load(); }}>✕</button></li>)}</ul>}
          </section>
        )}
        {tab === 'wk' && <Workout lang={s.lang} link={link} clearLink={() => setLink(null)} />}
        {tab === 'pl' && <PlanTab lang={s.lang} onStart={startDay} />}
        {tab === 'st' && <Stats lang={s.lang} />}
        <UpdateBanner lang={s.lang} />
        <Banner key={tab} lang={s.lang} tab={tab} onGo={() => setTab('wk')} />
        {tab === 'gl' && <Goals lang={s.lang} />}
        {tab === 'db' && <Dashboard lang={s.lang} />}
        {tab === 'nu' && <Nutrition lang={s.lang} />}
        {tab === 'lib' && <Library lang={s.lang} />}
        {tab === 'data' && (
          <section className="card">
            <h2>💾 {T('data')}</h2>
            <p className="warn">⚠️ {T('warn')}</p>
            <p className="muted">🔒 {T('persist')}: {persisted ? T('persisted') : T('notPersisted')}</p>
            <BackupPanel lang={s.lang} />
            <button onClick={() => download('measurements.csv', db.measurementsCsv([...meas].reverse()), 'text/csv')}>📄 {T('csv')}</button>
            <button className="danger" onClick={wipe}>🗑️ {T('wipe')}</button>
            <p className="muted">{T('recovery')}</p>
            {msg && <p>{msg}</p>}
            <InstallGuide lang={s.lang} />
          </section>
        )}
      </main>
      <nav>
        <button className={tab === 'db' ? 'on' : ''} onClick={() => setTab('db')}>📊<span> {T('db')}</span></button>
        <button className={tab === 'gl' ? 'on' : ''} onClick={() => setTab('gl')}>🎯<span> {T('gl')}</span></button>
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>🏠<span> {T('home')}</span></button>
        <button className={tab === 'wk' ? 'on' : ''} onClick={() => setTab('wk')}>🏋️<span> {T('wk')}</span></button>
        <button className={tab === 'pl' ? 'on' : ''} onClick={() => setTab('pl')}>🗓️<span> {T('pl')}</span></button>
        <button className={tab === 'nu' ? 'on' : ''} onClick={() => setTab('nu')}>🍽️<span> {T('nu')}</span></button>
        <button className={tab === 'lib' ? 'on' : ''} onClick={() => setTab('lib')}>📚<span> {T('lib')}</span></button>
        <button className={tab === 'st' ? 'on' : ''} onClick={() => setTab('st')}>📈<span> {T('st')}</span></button>
        <button className={tab === 'data' ? 'on' : ''} onClick={() => setTab('data')}>💾<span> {T('data')}</span></button>
      </nav>
    </div>
  );
}
