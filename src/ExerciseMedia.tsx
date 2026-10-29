import { useEffect, useState } from 'react';
import { Lang } from './i18n';
import { MEDIA } from './media';
import { Prim, prims } from './rig';
import { I } from './Icon';
import { CUSTOM } from './customViews';

// smooth in/out with a short hold at both ends (start/end positions stay readable)
const ease = (x: number) => x * x * (3 - 2 * x);
const cycle = (ms: number, period: number) => { const u = (ms % period) / period; return u < 0.1 ? 0 : u < 0.5 ? ease((u - 0.1) / 0.4) : u < 0.6 ? 1 : ease(1 - (u - 0.6) / 0.4); };

const X: Record<string, [string, string]> = {
  start:['البداية','Start'], mid:['منتصف الحركة','Mid-movement'], end:['النهاية','End'], play:['تشغيل','Play'], pause:['إيقاف','Pause'], prev:['السابق','Previous'], next:['التالي','Next'], restart:['إعادة التشغيل','Restart'],
  pri:['عضلة رئيسية','Primary muscle'], sec:['عضلة ثانوية','Secondary muscle'], arrow:['سهم = اتجاه الحركة','Arrow = movement direction'],
  note:['مخطط توضيحي مبسّط (ليس صورة واقعية)، والإطار الأوسط محسوب تقريبياً. لم يراجعه مدرب أو مختص.','Simplified diagram (not a realistic image); the middle frame is approximated. Not reviewed by a coach or clinician.'],
  off:['هذا الفيديو يحتاج اتصالاً بالإنترنت ولا يتوفر الآن.','This video needs an internet connection and is unavailable now.'],
};
const STYLE: Record<string, any> = {
  body: { stroke: 'currentColor' }, far: { stroke: 'currentColor', opacity: 0.45 }, scene: { stroke: 'currentColor', opacity: 0.4 }, gear: { stroke: 'var(--acc)' },
  arrow: { stroke: '#16a34a' }, hlP: { stroke: 'var(--acc)', opacity: 0.9 }, hlS: { stroke: 'var(--sec)', opacity: 0.7 },
};
const el = (p: Prim, k: number) => {
  const st = STYLE[p.c] ?? STYLE.body;
  if (p.k === 'l') return <line key={k} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} strokeWidth={p.w} strokeLinecap="round" strokeDasharray={p.dash ? '3 2.5' : undefined} {...st} />;
  if (p.k === 'r') return <rect key={k} x={p.x} y={p.y} width={p.w} height={p.h} rx={1.5} fill="currentColor" opacity={0.4} />;
  const col = p.c === 'hlP' ? 'var(--acc)' : p.c === 'hlS' ? 'var(--sec)' : p.c === 'gear' ? 'var(--acc)' : 'currentColor';
  return <circle key={k} cx={p.x} cy={p.y} r={p.r} fill={p.fill ? col : 'none'} stroke={p.fill ? 'none' : col} strokeWidth={p.w ?? 1.5} opacity={p.c === 'hlS' ? 0.7 : p.c === 'hlP' ? 0.9 : p.c === 'scene' ? 0.5 : 1} />;
};

export default function ExerciseMedia({ exId, lang, primary, secondary }: { exId: string; lang: Lang; primary: string[]; secondary: string[] }) {
  const i = lang === 'ar' ? 0 : 1, x = (k: string) => X[k][i];
  const m = MEDIA[exId];
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tt, setTt] = useState(0);
  const [run, setRun] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => { setIdx(0); setPlaying(false); setTt(0); }, [exId]);
  useEffect(() => {
    if (!playing) return;
    let raf = 0; const t0 = performance.now();
    const per = (m as any)?.period ?? 3200;
    const tick = (now: number) => { setTt(cycle(now - t0, per)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, run, exId]);
  useEffect(() => { const a = () => setOnline(true), b = () => setOnline(false); window.addEventListener('online', a); window.addEventListener('offline', b); return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); }; }, []);
  if (!m) return null;
  const cap = <p className="muted">{m.caption[i]} · {m.source} · {m.license}</p>;
  if (m.kind === 'video') {
    return (<div>{!m.local && !online ? <p className="warn">{x('off')}</p> : <video src={m.src} poster={m.poster} controls muted playsInline preload="none" style={{ width: '100%', borderRadius: 12 }} />}{cap}</div>);
  }
  if (m.kind === 'anim') return (<div><img src={m.src} alt={m.caption[i]} loading="lazy" style={{ width: '100%', borderRadius: 12 }} />{cap}</div>);
  const Custom = m.kind === 'custom' ? CUSTOM[m.view] : null;
  const n = m.kind === 'frames' && m.frames.length === 1 ? 1 : 3, t = playing ? tt : n === 1 ? 0 : [0, 0.5, 1][idx];
  const label = n === 1 ? '' : x(['start', 'mid', 'end'][idx]);
  return (
    <div>
      <svg viewBox={Custom ? '0 0 100 102' : '0 -12 100 112'} className="fig" role="img" aria-label={m.caption[i]} style={{ maxHeight: 340 }}>{Custom ? <Custom t={t} lang={lang} /> : m.kind === 'frames' ? prims(m.frames, t, m.cfg, { p: primary, s: secondary }).map(el) : null}</svg>
      {n > 1 && (
        <div className="row" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <button className="ghost" aria-label={x('prev')} onClick={() => { setPlaying(false); setIdx((idx + 2) % 3); }}><I n="chevl" /></button>
          <b>{playing ? '…' : label}</b>
          <button className="ghost" aria-label={x('next')} onClick={() => { setPlaying(false); setIdx((idx + 1) % 3); }}><I n="chevr" /></button>
          {!reduce && <button className="chip" onClick={() => setPlaying(!playing)}><I n={playing ? 'pause' : 'play'} s={16} /> {playing ? x('pause') : x('play')}</button>}
          {!reduce && <button className="ghost" aria-label={x('restart')} onClick={() => { setIdx(0); setTt(0); setPlaying(true); setRun(run + 1); }}><I n="refresh" s={18} /></button>}
        </div>)}
      <p className="muted"><span style={{ color: 'var(--acc)' }}><I n="circle" className="fill" s={12} /></span> {x('pri')} · <span style={{ color: 'var(--sec)' }}><I n="circle" className="fill" s={12} /></span> {x('sec')} · {x('arrow')}</p>
      {cap}
      <p className="muted">{x('note')}</p>
    </div>
  );
}
