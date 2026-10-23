import { useEffect, useRef, useState } from 'react';
import { Lang, t } from './i18n';
import * as db from './db';

type Settings = { id: 'app'; lang: Lang; theme: 'light' | 'dark' };
type Meas = { id: string; date: string; weightKg: number };

export default function App() {
  const [s, setS] = useState<Settings>({ id: 'app', lang: 'ar', theme: 'dark' });
  const [tab, setTab] = useState<'home' | 'data'>('home');
  const [meas, setMeas] = useState<Meas[]>([]);
  const [w, setW] = useState('');
  const [msg, setMsg] = useState('');
  const [persisted, setPersisted] = useState(false);
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
  const download = (name: string, text: string, type: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
  };
  const onImport = async (f?: File) => {
    if (!f) return;
    try { await db.importAll(await f.text()); setMsg(T('ok')); load(); } catch (e: any) { setMsg(T('fail') + e.message); }
  };
  const wipe = async () => { if (confirm(T('confirmWipe'))) { await db.clearAll(); setMeas([]); setMsg(T('ok')); } };

  return (
    <div className="app">
      <header>
        <h1>🏋️ {T('app')}</h1>
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
        {tab === 'data' && (
          <section className="card">
            <h2>💾 {T('data')}</h2>
            <p className="warn">⚠️ {T('warn')}</p>
            <p className="muted">🔒 {T('persist')}: {persisted ? T('persisted') : T('notPersisted')}</p>
            <button onClick={async () => download('ironpath-backup.json', await db.exportAll(), 'application/json')}>⬇️ {T('export')}</button>
            <button onClick={() => download('measurements.csv', db.measurementsCsv([...meas].reverse()), 'text/csv')}>📄 {T('csv')}</button>
            <button onClick={() => file.current?.click()}>⬆️ {T('import')}</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} />
            <button className="danger" onClick={wipe}>🗑️ {T('wipe')}</button>
            <p className="muted">{T('recovery')}</p>
            {msg && <p>{msg}</p>}
          </section>
        )}
      </main>
      <nav>
        <button className={tab === 'home' ? 'on' : ''} onClick={() => setTab('home')}>🏠 {T('home')}</button>
        <button className={tab === 'data' ? 'on' : ''} onClick={() => setTab('data')}>💾 {T('data')}</button>
      </nav>
    </div>
  );
}
