import { useEffect, useState } from 'react';
import { Lang } from './i18n';
import { backupName, buildBackup, countsOf, planRestore, validateBackup, Validation } from './backup';
import { applyRestore, getSnapshot, idsOf, listSnapshots, markBackupDone, readAll, snapshotNow, deleteSnapshot, Snap } from './backupStore';
import { openDb } from './db';

const B: Record<string, [string, string]> = {
  title:['النسخ الاحتياطي والاستعادة','Backup & restore'],
  why:['بياناتك محفوظة داخل متصفح هذا الجهاز فقط. مسح بيانات المواقع أو حذف التطبيق قد يمحوها. الملف أدناه هو نسختك الحقيقية الآمنة.','Your data lives only in this device’s browser. Clearing website data or deleting the app can erase it. The file below is your real safe copy.'],
  exp:['1) حفظ نسخة كاملة في ملف','1) Save a full backup file'], expHelp:['«حفظ في الملفات» يفتح قائمة المشاركة: اختر «حفظ في الملفات» ثم iCloud Drive أو على iPhone. «تنزيل» يحفظه في مجلد التنزيلات (Files ← Downloads).','“Save to Files” opens the share sheet: choose “Save to Files”, then iCloud Drive or On My iPhone. “Download” saves to Downloads (Files → Downloads).'],
  share:['📤 حفظ في الملفات / iCloud','📤 Save to Files / iCloud'], dl:['⬇️ تنزيل الملف','⬇️ Download file'], noShare:['مشاركة الملفات غير مدعومة في هذا المتصفح؛ استخدم «تنزيل».','File sharing is not supported in this browser; use “Download”.'],
  shared:['تم إرسال الملف إلى قائمة الحفظ. تأكد في تطبيق Files أنه موجود قبل الاعتماد عليه.','The file was handed to the save sheet. Check in the Files app that it is there before relying on it.'], downloaded:['بدأ تنزيل الملف. تأكد من وجوده في Files ← Downloads.','The download started. Check that it is in Files → Downloads.'], cancelled:['أُلغي الحفظ.','Saving was cancelled.'],
  incl:['يشمل','Includes'], res:['2) استعادة من ملف','2) Restore from a file'], pick:['اختر ملف النسخة الاحتياطية (.json)','Choose a backup file (.json)'], pickNote:['لن يتغير شيء عند اختيار الملف؛ ستظهر معاينة أولاً.','Nothing changes when you pick a file; a preview comes first.'],
  checking:['جارٍ فحص الملف…','Checking the file…'], bad:['الملف غير صالح للاستعادة:','This file cannot be restored:'],
  'not-json':['ليس ملف JSON صالحاً.','Not valid JSON.'], 'not-ironpath':['ليس نسخة احتياطية من IRON PATH.','Not an IRON PATH backup.'], 'newer-version':['من إصدار أحدث من هذا التطبيق؛ حدّث التطبيق أولاً.','From a newer version of the app; update the app first.'], 'no-data':['لا يحتوي بيانات.','Contains no data.'], 'too-big':['الملف كبير جداً.','File is too large.'], 'store-not-array':['قسم بيانات تالف:','Corrupted data section:'],
  'checksum-mismatch':['⚠️ بصمة الملف لا تطابق محتواه: قد يكون تالفاً أو عُدِّل يدوياً.','⚠️ The file’s checksum does not match its content: it may be corrupted or edited.'], 'no-checksum':['ملف قديم بلا بصمة تحقق (مقبول، لكن لا يمكن التأكد من سلامته).','Older file without a checksum (accepted, but integrity cannot be confirmed).'],
  'unknown-stores':['أقسام غير معروفة ستُتجاهل.','Unknown sections will be ignored.'], 'invalid-rows':['سجلات غير صالحة ستُتخطّى (لن تُستعاد):','Invalid records will be skipped (not restored):'], 'duplicate-ids':['سجلات مكررة المعرّف حُذفت (احتُفظ بالأول).','Duplicate-id records dropped (first kept).'], 'has-draft':['يحتوي جلسة تمرين غير منتهية.','Contains an unfinished workout session.'], 'empty-backup':['النسخة فارغة.','The backup is empty.'],
  info:['معلومات الملف','File info'], date:['تاريخ النسخة','Backup date'], ver:['إصدار التطبيق','App version'], chk:['البصمة','Checksum'], ok:['سليمة ✅','verified ✅'], inFile:['في الملف','In file'], now:['عندك الآن','On device now'],
  sessions:['جلسات تمرين','Workout sessions'], weights:['قياسات الوزن','Weigh-ins'], plansN:['خطط تدريب','Training plans'], logs:['أيام تغذية','Nutrition days'], foods:['أطعمة (مخصصة/مستوردة)','Foods (custom/imported)'], exs:['تمارين مخصصة/مستوردة','Custom/imported exercises'], favs:['مفضلة','Favorites'], range:['نطاق الجلسات','Session range'],
  mode:['طريقة الاستعادة','Restore mode'], merge:['دمج (الأكثر أماناً): أضف ما ينقص فقط، ولا يُمَس أي سجل موجود','Merge (safest): add only what is missing; no existing record is touched'], replace:['استبدال كامل: يحذف بياناتك الحالية ويضع محتوى الملف','Full replace: deletes your current data and puts the file’s content in its place'],
  eff:['الأثر المتوقع','Expected effect'], add:['سيُضاف','added'], skip:['سيُتخطى (موجود)','skipped (exists)'], repl:['سيُستبدل','replaced'], rem:['سيُحذف من جهازك','removed from your device'],
  danger:['⚠️ تحذير: الاستبدال الكامل يحذف','⚠️ Warning: full replace deletes'], understand:['أفهم أن بياناتي الحالية ستُستبدل بمحتوى الملف','I understand my current data will be replaced by the file’s content'], badok:['أعلم أن الملف قد يكون تالفاً وأريد المتابعة','I know the file may be corrupted and want to continue'],
  safeStep:['خطوة الأمان','Safety step'], safeAuto:['قبل أي استعادة تُحفظ تلقائياً لقطة أمان داخل التطبيق (آخر 3). لكنها تُحذف مع مسح بيانات المواقع، لذا احفظ أيضاً ملفاً.','Before any restore an automatic safety snapshot is kept inside the app (last 3). It is erased if website data is cleared, so also save a file.'],
  safeFile:['💾 حفظ نسخة أمان من بياناتي الحالية كملف','💾 Save my current data as a safety file'], safeDone:['تم إنشاء ملف الأمان ✅','Safety file created ✅'], noSafe:['أتابع بدون ملف أمان (لقطة داخل التطبيق فقط)','Continue without a safety file (in-app snapshot only)'],
  go:['⬆️ تنفيذ الاستعادة','⬆️ Restore now'], confirm:['تأكيد أخير: تنفيذ الاستعادة؟','Final confirmation: restore now?'], working:['جارٍ الاستعادة…','Restoring…'],
  done:['اكتملت الاستعادة ✅. أعد تحميل التطبيق لتظهر البيانات في كل الشاشات.','Restore finished ✅. Reload the app so every screen shows the data.'], reload:['🔄 إعادة تحميل التطبيق','🔄 Reload app'], fail:['فشلت الاستعادة ولم يتغير شيء:','Restore failed and nothing was changed:'],
  snaps:['3) لقطات الأمان (للتراجع)','3) Safety snapshots (undo)'], noSnaps:['لا لقطات بعد.','No snapshots yet.'], r_before:['قبل استعادة','before restore'], r_wipe:['قبل حذف كل البيانات','before delete-all'], r_undo:['قبل التراجع','before undo'],
  useSnap:['↩️ استعادة هذه اللقطة','↩️ Restore this snapshot'], confSnap:['استبدال بياناتك الحالية بهذه اللقطة؟ ستؤخذ لقطة جديدة قبل ذلك.','Replace your current data with this snapshot? A new snapshot is taken first.'], delSnap:['حذف','Delete'],
  rec:['استعادة الطوارئ','Recovery guide'], rec1:['إن فقدت بياناتك: افتح هذا القسم، واختر ملف النسخة من Files، وراجع المعاينة، ثم اختر «دمج» أو «استبدال».','If your data is lost: open this section, pick the backup file from Files, review the preview, then choose “Merge” or “Replace”.'], rec2:['احتفظ بأكثر من نسخة (iCloud Drive + جهاز آخر)، ونسخة جديدة أسبوعياً.','Keep more than one copy (iCloud Drive + another device) and make a new one weekly.'], rec3:['لا تعدّل الملف يدوياً؛ أي تعديل يغيّر بصمته.','Do not edit the file by hand; any edit changes its checksum.'],
  err:['خطأ: ','Error: '],
};
const fmtSize = (n: number) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
const summ = (d: Record<string, any[]>) => {
  const w = (d.workouts ?? []).filter((r) => r.id !== 'draft'), dates = w.map((r) => String(r.date).slice(0, 10)).sort(), n = d.nutrition ?? [];
  return { sessions: w.length, weights: (d.measurements ?? []).length, plansN: (d.plans ?? []).filter((r) => r.id.startsWith('plan:')).length, logs: n.filter((r) => r.id.startsWith('log:')).length, foods: n.filter((r) => r.id.startsWith('food:') || r.id.startsWith('ref:')).length, exs: (d.exercises ?? []).length, favs: (d.favorites ?? []).length, range: dates.length ? `${dates[0]} → ${dates[dates.length - 1]}` : '—' };
};
async function saveFile(text: string, name: string, mode: 'share' | 'download'): Promise<'shared' | 'downloaded' | 'cancelled' | 'unsupported'> {
  const blob = new Blob([text], { type: 'application/json' });
  if (mode === 'share') {
    const f = new File([blob], name, { type: 'application/json' }), nav: any = navigator;
    if (!nav.canShare?.({ files: [f] })) return 'unsupported';
    try { await nav.share({ files: [f], title: 'IRON PATH backup' }); return 'shared'; } catch (e: any) { if (e?.name === 'AbortError') return 'cancelled'; throw e; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 15000);
  return 'downloaded';
}

export default function BackupPanel({ lang }: { lang: Lang }) {
  const i = lang === 'ar' ? 0 : 1, b = (k: string) => B[k]?.[i] ?? k;
  const [msg, setMsg] = useState('');
  const [last, setLast] = useState<{ counts: Record<string, number>; how: string } | null>(null);
  const [pv, setPv] = useState<(Validation & { name: string; size: number }) | null>(null);
  const [cur, setCur] = useState<Record<string, any[]> | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [understood, setUnderstood] = useState(false), [badOk, setBadOk] = useState(false), [noSafe, setNoSafe] = useState(false), [safeDone, setSafeDone] = useState(false);
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const loadSnaps = () => listSnapshots().then((s) => setSnaps(s.sort((x, y) => y.id - x.id))).catch(() => {});
  useEffect(() => { loadSnaps(); }, []);

  const makeText = async () => { const d = await readAll(); const bk = await buildBackup(d, new Date().toISOString(), 'web'); return { text: JSON.stringify(bk, null, 2), counts: countsOf(d) }; };
  const exportNow = async (how: 'share' | 'download', forSafety = false) => {
    setMsg('');
    try {
      const { text, counts } = await makeText();
      const r = await saveFile(text, (forSafety ? 'safety-' : '') + backupName(new Date()), how);
      if (r === 'unsupported') { setMsg(b('noShare')); return; }
      if (r === 'cancelled') { setMsg(b('cancelled')); return; }
      if (forSafety) { setSafeDone(true); return; }
      await markBackupDone(); setLast({ counts, how: r });
    } catch (e: any) { setMsg(b('err') + e.message); }
  };
  const onFile = async (f?: File) => {
    if (!f) return;
    setMsg(''); setPv(null); setDone(false); setUnderstood(false); setBadOk(false); setNoSafe(false); setSafeDone(false); setMode('merge');
    try { const v = await validateBackup(await f.text()); setPv({ ...v, name: f.name, size: f.size }); setCur(await readAll()); } catch (e: any) { setMsg(b('err') + e.message); }
  };
  const plan = pv && pv.ok && cur ? planRestore(pv.data, idsOf(cur), mode) : null;
  const tot = (k: 'add' | 'skip' | 'replace' | 'remove') => (plan ? Object.values(plan.summary).reduce((a, x) => a + x[k], 0) : 0);
  const mismatch = pv?.checksum === 'mismatch';
  const ready = !!pv?.ok && !busy && !done && (!mismatch || badOk) && (mode === 'merge' || (understood && (safeDone || noSafe)));
  const restore = async () => {
    if (!pv || !plan || !confirm(b('confirm'))) return;
    setBusy(true); setMsg('');
    try {
      await snapshotNow(mode === 'replace' ? 'before-restore-replace' : 'before-restore-merge'); // abort here (nothing touched yet) if the snapshot cannot be saved
      await applyRestore(await openDb(), plan);
      setDone(true); loadSnaps();
    } catch (e: any) { setMsg(b('fail') + ' ' + (e?.message ?? e)); }
    setBusy(false);
  };
  const useSnap = async (id: number) => {
    if (!confirm(b('confSnap'))) return;
    setBusy(true); setMsg('');
    try {
      const s = await getSnapshot(id); if (!s) throw new Error('missing');
      const v = await validateBackup(s.text); if (!v.ok) throw new Error(v.fatal.join(','));
      await snapshotNow('before-undo');
      await applyRestore(await openDb(), planRestore(v.data, idsOf(await readAll()), 'replace'));
      setDone(true); setPv(null); loadSnaps();
    } catch (e: any) { setMsg(b('fail') + ' ' + (e?.message ?? e)); }
    setBusy(false);
  };
  const Row = ({ k, a, c }: { k: string; a: any; c: any }) => <div className="row srow"><span style={{ flex: 1 }}>{b(k)}</span><b>{a}</b><span className="muted">{c}</span></div>;
  const sp = pv?.ok ? summ(pv.data) : null, sc = cur ? summ(cur) : null;

  return (
    <div className="ent">
      <b>🛟 {b('title')}</b>
      <p className="warn">{b('why')}</p>
      {msg && <p className="warn">{msg}</p>}
      <b>{b('exp')}</b><span className="muted">{b('expHelp')}</span>
      <button onClick={() => exportNow('share')}>{b('share')}</button>
      <button className="ghost" onClick={() => exportNow('download')}>{b('dl')}</button>
      {last && <p>✅ {b(last.how)}<br /><span className="muted">{b('incl')}: {last.counts.workouts} · {last.counts.measurements} · {last.counts.plans} · {last.counts.nutrition} · {last.counts.exercises}</span></p>}

      <b>{b('res')}</b><span className="muted">{b('pickNote')}</span>
      <label>{b('pick')}<input type="file" accept="application/json,.json" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} /></label>
      {pv && !pv.ok && <p className="warn">❌ {b('bad')} {pv.fatal.map((f) => b(f.split(':')[0]) + (f.includes(':') ? ' ' + f.split(':')[1] : '')).join(' ')}</p>}
      {pv && pv.ok && sp && sc && plan && (
        <div className="ent pop">
          <b>🔎 {b('info')}</b>
          <span className="muted">{pv.name} · {fmtSize(pv.size)}<br />{b('date')}: {pv.exportedAt?.slice(0, 16).replace('T', ' ') ?? '—'} · {b('ver')}: {pv.appVersion ?? '—'} · {b('chk')}: {pv.checksum === 'ok' ? b('ok') : pv.checksum}</span>
          {pv.warnings.map((w) => <p key={w} className="warn">{b(w)}{w === 'invalid-rows' ? ` ${pv.invalid.length} (${pv.invalid.slice(0, 3).map((x) => `${x.store}:${x.id}`).join(', ')}${pv.invalid.length > 3 ? '…' : ''})` : ''}</p>)}
          <div className="row srow"><span style={{ flex: 1 }} /><b>{b('inFile')}</b><span className="muted">{b('now')}</span></div>
          {(['sessions', 'weights', 'plansN', 'logs', 'foods', 'exs', 'favs'] as const).map((k) => <Row key={k} k={k} a={sp[k]} c={sc[k]} />)}
          <Row k="range" a={sp.range} c={sc.range} />
          <b>{b('mode')}</b>
          <label className="row"><input type="radio" checked={mode === 'merge'} onChange={() => setMode('merge')} style={{ flex: 'none', minHeight: 0 }} /> {b('merge')}</label>
          <label className="row"><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} style={{ flex: 'none', minHeight: 0 }} /> {b('replace')}</label>
          <p>{b('eff')}: {b('add')} <b>{tot('add')}</b> · {mode === 'merge' ? <>{b('skip')} <b>{tot('skip')}</b></> : <>{b('repl')} <b>{tot('replace')}</b> · {b('rem')} <b style={{ color: 'var(--bad)' }}>{tot('remove')}</b></>}</p>
          {mismatch && <label className="row"><input type="checkbox" checked={badOk} onChange={(e) => setBadOk(e.target.checked)} style={{ flex: 'none', minHeight: 0 }} /> {b('badok')}</label>}
          {mode === 'replace' && <>
            <p className="warn">{b('danger')} {tot('remove')} + {tot('replace')}.</p>
            <label className="row"><input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} style={{ flex: 'none', minHeight: 0 }} /> {b('understand')}</label>
            <b>{b('safeStep')}</b><span className="muted">{b('safeAuto')}</span>
            <button className="ghost" onClick={() => exportNow('share', true).then(() => {}).catch(() => {})}>{b('safeFile')} ({b('share').slice(2)})</button>
            <button className="ghost" onClick={() => exportNow('download', true)}>{b('dl')}</button>
            {safeDone ? <p>{b('safeDone')}</p> : <label className="row"><input type="checkbox" checked={noSafe} onChange={(e) => setNoSafe(e.target.checked)} style={{ flex: 'none', minHeight: 0 }} /> {b('noSafe')}</label>}</>}
          <button className={mode === 'replace' ? 'danger big' : 'big'} disabled={!ready} onClick={restore}>{busy ? b('working') : b('go')}</button>
        </div>)}
      {done && <p className="warn pop">{b('done')} <button onClick={() => location.reload()}>{b('reload')}</button></p>}

      <b>{b('snaps')}</b>
      {snaps.length === 0 && <span className="muted">{b('noSnaps')}</span>}
      {snaps.map((s) => (
        <div key={s.id} className="row srow"><span style={{ flex: 1 }}>{new Date(s.ts).toLocaleString('sv').slice(0, 16)} · {b('r_' + s.reason.replace(/^before-(restore).*/, 'before').replace('before-wipe', 'wipe').replace('before-undo', 'undo'))}<br /><span className="muted">{s.counts.workouts} · {s.counts.measurements} · {s.counts.plans} · {s.counts.nutrition}</span></span>
          <button className="ghost" disabled={busy} onClick={() => useSnap(s.id)}>{b('useSnap')}</button>
          <button className="ghost" onClick={async () => { await deleteSnapshot(s.id); loadSnaps(); }}>🗑️</button></div>))}

      <b>{b('rec')}</b>
      <span className="muted">• {b('rec1')}<br />• {b('rec2')}<br />• {b('rec3')}</span>
    </div>
  );
}
