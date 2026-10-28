import { Lang, t } from './i18n';
import { I, IconName } from './Icon';

type Go = (tab: 'pl' | 'lib' | 'gl' | 'st' | 'weight' | 'data') => void;

export default function More({ lang, theme, go, setLang, setTheme }: { lang: Lang; theme: 'light' | 'dark'; go: Go; setLang: (l: Lang) => void; setTheme: (t: 'light' | 'dark') => void }) {
  const T = (k: any) => t(lang, k);
  const items: [Parameters<Go>[0], IconName, string][] = [
    ['pl', 'cal', T('pl')], ['lib', 'book', T('lib')], ['gl', 'target', T('gl')], ['st', 'trend', T('st')], ['weight', 'scale', T('weight')], ['data', 'save', T('data')],
  ];
  return (
    <>
      <div className="sec-t">{T('sections')}</div>
      <section className="card flush">
        {items.map(([k, ic, label]) => (
          <button key={k} className="item" onClick={() => go(k)}><I n={ic} s={22} /> <span>{label}</span><I n="chevr" s={18} className="chev" /></button>
        ))}
      </section>

      <div className="sec-t">{T('settings')}</div>
      <section className="card">
        <label>{T('langL')}
          <div className="seg" role="group" aria-label={T('langL')}>
            <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>العربية</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
          </div>
        </label>
        <label>{T('appearance')}
          <div className="seg" role="group" aria-label={T('appearance')}>
            <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}><I n="moon" s={16} /> {T('dark')}</button>
            <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}><I n="sun" s={16} /> {T('light')}</button>
          </div>
        </label>
      </section>
    </>
  );
}
