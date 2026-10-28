import { useEffect, useState } from 'react';
import { Lang } from './i18n';
import { I } from './Icon';

const X: Record<string, [string, string]> = {
  off:['بلا اتصال','Offline'],
  upd:['يتوفر إصدار جديد. بياناتك محفوظة ولن تُمسح عند التحديث.','A new version is available. Your data is kept and is not erased by the update.'], updNow:['تحديث الآن','Update now'], later:['لاحقاً','Later'],
  guide:['تثبيت التطبيق على iPhone','Install on iPhone'],
  s1:['افتح هذا الرابط في Safari (وليس داخل تطبيق آخر).','Open this link in Safari (not inside another app).'], s2:['اضغط زر المشاركة في شريط Safari.','Tap the Share button in Safari.'],
  s3:['اختر «إضافة إلى الشاشة الرئيسية» ثم «إضافة».','Choose “Add to Home Screen”, then “Add”.'], s4:['افتح التطبيق من أيقونته على الشاشة الرئيسية.','Open the app from its Home Screen icon.'],
  inst:['التطبيق يعمل الآن كتطبيق مثبّت.','You are running the installed app.'],
  sw1:['ملفات التطبيق محفوظة للعمل دون اتصال بعد التحميل الأول. للتأكد جرّب وضع الطيران.','App files are cached for offline use after the first load. Try airplane mode to confirm.'],
  sw0:['سيتم حفظ الملفات للعمل دون اتصال بعد إعادة فتح التطبيق مرة واحدة.','Files will be cached for offline use after you reopen the app once.'],
  note:['ملاحظة: الإشعارات خارج التطبيق غير مدعومة (التذكيرات تظهر داخل التطبيق فقط).','Note: notifications outside the app are not supported (reminders appear inside the app only).'],
};
export function OnlineBadge({ lang }: { lang: Lang }) {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on ? null : <span className="chip on" role="status" style={{ fontSize: '.7rem', minHeight: 24 }}><I n="wifioff" /> {X.off[lang === 'ar' ? 0 : 1]}</span>;
}
export function UpdateBanner({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    const h = (e: any) => setReg(e.detail);
    window.addEventListener('sw-update', h);
    return () => window.removeEventListener('sw-update', h);
  }, []);
  if (!reg) return null;
  return (
    <div className="card" style={{ marginBottom: 12 }} role="status">
      <span><I n="refresh" /> {X.upd[i]}</span>
      <div className="row"><button onClick={() => reg.waiting?.postMessage({ type: 'SKIP_WAITING' })}>{X.updNow[i]}</button><button className="ghost" onClick={() => setReg(null)}>{X.later[i]}</button></div>
    </div>
  );
}
export function InstallGuide({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1;
  const standalone = (navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const ctrl = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
  return (
    <div className="ent">
      <b><I n="phone" /> {X.guide[i]}</b>
      {standalone ? <p>{X.inst[i]}</p> : <ol><li>{X.s1[i]}</li><li>{X.s2[i]}</li><li>{X.s3[i]}</li><li>{X.s4[i]}</li></ol>}
      <p className="muted">{ctrl ? X.sw1[i] : X.sw0[i]}</p>
      <p className="muted">{X.note[i]}</p>
    </div>
  );
}
