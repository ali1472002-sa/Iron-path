import { ReactNode, useState } from 'react';
import { Lang } from './i18n';
import { CATS, FoodRec, RECIPES } from './foodDb';
import { fromFdc, normText, reconcile, Report } from './refdata';
import * as db from './db';

const F: Record<string, [string, string]> = {
  search:['ابحث بالعربية أو الإنجليزية…','Search in Arabic or English…'], all:['الكل','All'], mine:['أطعمتي','Mine'], imp:['مستورد','Imported'], more:['عرض المزيد','Show more'],
  verified:['موثّق (مختبري)','Verified (lab data)'], approximate:['تقريبي','Approximate'], estimate:['تقدير من وصفة','Recipe estimate'], user:['أدخلته أنت','Your value'],
  fiber:['ألياف','Fiber'], na:['غير متوفر','n/a'], newFood:['طعام مخصص','Custom food'], name:['الاسم','Name'], serv:['حصة افتراضية (غ)','Default serving (g)'], per100:['القيم لكل 100 غ','Values per 100 g'],
  kcal:['سعرة','kcal'], p:['بروتين','Protein'], c:['كربوهيدرات','Carbs'], f:['دهون','Fat'], fi:['ألياف (اختياري)','Fiber (optional)'], cat:['التصنيف','Category'], save:['حفظ','Save'], del:['حذف','Delete'],
  bad:['قيمة غير صالحة','Invalid value'], recipe:['وصفة من مكونات','Recipe from ingredients'], ing:['أضف مكوناً…','Add ingredient…'], final:['الوزن النهائي بعد الطهي (غ)','Final cooked weight (g)'], servings:['عدد الحصص','Servings'],
  tpl:['وصفات جاهزة (تقديرية، عدّل المكونات)','Recipe templates (estimates — edit ingredients)'], addTpl:['أضف إلى أطعمتي','Add to my foods'],
  imp1:['استيراد بيانات USDA (JSON)','Import USDA FoodData Central (JSON)'], impHelp:['نزّل ملف Foundation Foods بصيغة JSON من fdc.nal.usda.gov (بيانات عامة CC0) ثم اخترها هنا. لا يلزم اتصال بعد التنزيل.','Download the Foundation Foods JSON from fdc.nal.usda.gov (public domain, CC0), then pick it here. No connection needed afterwards.'],
  rep:['نتيجة الاستيراد','Import report'], imported:['أُضيف','imported'], updated:['حُدِّث','updated'], skipped:['تُجوهل','skipped'], rejected:['رُفض','rejected'], nearDup:['شبه مكرر','near-duplicates'],
  delImp:['حذف كل الأطعمة المستوردة','Delete all imported foods'], confDel:['حذف؟','Delete?'], saved:['وجباتي المحفوظة','Saved meals'], err:['خطأ: ','Error: '],
  barcode:['البحث بالباركود غير متاح: يحتاج اتصالاً ببيانات Open Food Facts (ترخيص ODbL بمشاركة المثل) ولم يُنفَّذ.','Barcode lookup is not available: it needs online Open Food Facts data (ODbL share-alike) and is not implemented.'],
  attr:['المصدر: USDA FoodData Central (CC0).','Source: USDA FoodData Central (CC0).'],
};
const num = (s: any) => (s === '' || s == null ? NaN : Number(s));

export default function FoodsPanel({ lang, tabs, foods, customs, meals, reload }: { lang: Lang; tabs: ReactNode; foods: FoodRec[]; customs: any[]; meals: any[]; reload: () => any }) {
  const i = lang === 'ar' ? 0 : 1, f = (k: string) => F[k]?.[i] ?? k;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [shown, setShown] = useState(40);
  const [cf, setCf] = useState<any>(null);
  const [rc, setRc] = useState<any>(null);
  const [pick, setPick] = useState('');
  const [rep, setRep] = useState<Report | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<any>) => { try { await fn(); await reload(); } catch (e: any) { setMsg(f('err') + e.message); } };
  const list = foods.filter((x) => x.search.includes(normText(q)) && (cat === 'all' || (cat === 'mine' ? x.src === 'custom' : cat === 'imp' ? x.src === 'imported' : x.cat === cat)));
  const byId = (id: string) => foods.find((x) => x.id === id);

  const saveCf = () => {
    const nums = [cf.k, cf.p, cf.c, cf.f, cf.g].map(num), fi = cf.fi === '' ? null : num(cf.fi);
    if (!cf.name.trim() || nums.some((x) => isNaN(x) || x < 0) || !(nums[4] > 0) || (fi != null && (isNaN(fi) || fi < 0))) { setMsg(f('bad')); return; }
    run(async () => { await db.put('nutrition', { ...(cf.rec ?? {}), id: cf.id ?? 'food:' + crypto.randomUUID(), name: cf.name.trim(), cat: cf.cat, g: nums[4], per: { k: nums[0], p: nums[1], c: nums[2], f: nums[3], fi } }); setCf(null); setMsg(''); });
  };
  const rcTotals = (ings: { id: string; g: number }[], finalG: number) => {
    const t = { k: 0, p: 0, c: 0, f: 0, fi: 0 }, sum = ings.reduce((a, x) => a + x.g, 0);
    ings.forEach((x) => { const fd = byId(x.id)!; (['k', 'p', 'c', 'f'] as const).forEach((m) => { t[m] += (fd.per[m] * x.g) / 100; }); t.fi += ((fd.per.fi ?? 0) * x.g) / 100; });
    const w = finalG > 0 ? finalG : sum;
    const per = { k: (t.k / w) * 100, p: (t.p / w) * 100, c: (t.c / w) * 100, f: (t.f / w) * 100, fi: (t.fi / w) * 100 };
    return { per, sum, w };
  };
  const saveRecipe = (name: string, ings: { id: string; g: number }[], finalG: number, servings: number) => {
    if (!name.trim() || !ings.length || ings.some((x) => !(x.g > 0))) { setMsg(f('bad')); return; }
    const { per, w } = rcTotals(ings, finalG);
    run(async () => { await db.put('nutrition', { id: 'food:' + crypto.randomUUID(), name: name.trim(), cat: 'dish', g: Math.round(w / Math.max(1, servings)), per, recipe: { ingredients: ings.map((x) => ({ id: x.id, name: byId(x.id)!.name, g: x.g })), finalG: w, servings } }); setRc(null); setMsg(''); });
  };
  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true); setMsg(''); setRep(null);
    try {
      const { records, rejected } = fromFdc(JSON.parse(await file.text()));
      const existing: Record<string, any> = {}; customs.filter((c) => c.ref).forEach((c) => { existing[c.id] = c; });
      const { put, rep: r } = reconcile(existing, foods.filter((x) => !existing[x.id]).map((x) => x.search), records as any[], rejected);
      for (const rec of put) await db.put('nutrition', rec);
      setRep(r); await reload();
    } catch (e: any) { setMsg(f('err') + e.message); }
    setBusy(false);
  };

  return (
    <section className="card">{tabs}
      <input placeholder={f('search')} value={q} onChange={(e) => { setQ(e.target.value); setShown(40); }} />
      <div className="chips">{['all', 'mine', 'imp', ...Object.keys(CATS)].map((k) => <button key={k} className={'chip' + (cat === k ? ' on' : '')} onClick={() => { setCat(k); setShown(40); }}>{CATS[k] ? CATS[k][i] : f(k)}</button>)}</div>
      {msg && <p className="warn">{msg}</p>}
      {list.slice(0, shown).map((x) => {
        const raw = customs.find((c) => c.id === x.id);
        return (
          <div key={x.id} className="row srow"><span style={{ flex: 1 }}><b>{x.name}</b><br />
            <span className="muted">{Math.round(x.per.k)} {f('kcal')} · P{+x.per.p.toFixed(1)} C{+x.per.c.toFixed(1)} F{+x.per.f.toFixed(1)} · {f('fiber')} {x.per.fi == null ? f('na') : +x.per.fi.toFixed(1)} / 100 g<br />
              {f(x.status)} · {x.srcLabel}{x.prep ? ' · ' + x.prep : ''}</span></span>
            {raw && !raw.ref && <button className="ghost" onClick={() => setCf({ id: raw.id, rec: raw, name: raw.name, cat: raw.cat ?? 'other', k: raw.per.k, p: raw.per.p, c: raw.per.c, f: raw.per.f, fi: raw.per.fi ?? '', g: raw.g })}>✏️</button>}
            {raw && <button className="ghost" onClick={() => confirm(f('confDel')) && run(() => db.remove('nutrition', raw.id))}>🗑️</button>}
          </div>);
      })}
      {list.length > shown && <button className="ghost" onClick={() => setShown(shown + 40)}>{f('more')} ({list.length - shown})</button>}
      {cf ? (
        <div className="ent"><b>{f('newFood')}</b>
          <input placeholder={f('name')} value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} />
          <select value={cf.cat} onChange={(e) => setCf({ ...cf, cat: e.target.value })}>{Object.keys(CATS).map((k) => <option key={k} value={k}>{CATS[k][i]}</option>)}</select>
          <span className="muted">{f('per100')}</span>
          {(['k', 'p', 'c', 'f', 'fi', 'g'] as const).map((k) => <label key={k}>{k === 'g' ? f('serv') : f(k === 'k' ? 'kcal' : k)}<input inputMode="decimal" value={cf[k]} onChange={(e) => setCf({ ...cf, [k]: e.target.value })} /></label>)}
          <button onClick={saveCf}>💾 {f('save')}</button><button className="ghost" onClick={() => setCf(null)}>✕</button></div>
      ) : <button onClick={() => setCf({ name: '', cat: 'other', k: '', p: '', c: '', f: '', fi: '', g: '100' })}>➕ {f('newFood')}</button>}

      {rc ? (
        <div className="ent"><b>🍲 {f('recipe')}</b>
          <input placeholder={f('name')} value={rc.name} onChange={(e) => setRc({ ...rc, name: e.target.value })} />
          {rc.ings.map((x: any, k: number) => (
            <div key={k} className="row srow"><span style={{ flex: 1 }}>{byId(x.id)?.name}</span>
              <input style={{ maxWidth: 80 }} inputMode="decimal" value={x.g} onChange={(e) => setRc({ ...rc, ings: rc.ings.map((y: any, j: number) => (j === k ? { ...y, g: +e.target.value || 0 } : y)) })} />
              <button className="ghost" onClick={() => setRc({ ...rc, ings: rc.ings.filter((_: any, j: number) => j !== k) })}>✕</button></div>))}
          <select value={pick} onChange={(e) => { const fd = byId(e.target.value); if (fd) setRc({ ...rc, ings: [...rc.ings, { id: fd.id, g: fd.g }] }); setPick(''); }}>
            <option value="">➕ {f('ing')}</option>{foods.slice(0, 400).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <label>{f('final')}<input inputMode="decimal" value={rc.final} onChange={(e) => setRc({ ...rc, final: e.target.value })} /></label>
          <label>{f('servings')}<input inputMode="numeric" value={rc.servings} onChange={(e) => setRc({ ...rc, servings: e.target.value })} /></label>
          {rc.ings.length > 0 && (() => { const t = rcTotals(rc.ings, +rc.final || 0); return <p className="muted">{Math.round(t.per.k)} {f('kcal')} · P{Math.round(t.per.p)} C{Math.round(t.per.c)} F{Math.round(t.per.f)} / 100 g</p>; })()}
          <button onClick={() => saveRecipe(rc.name, rc.ings, +rc.final || 0, +rc.servings || 1)}>💾 {f('save')}</button><button className="ghost" onClick={() => setRc(null)}>✕</button></div>
      ) : <button className="ghost" onClick={() => setRc({ name: '', ings: [], final: '', servings: '1' })}>🍲 {f('recipe')}</button>}

      <div className="ent"><b>{f('tpl')}</b>
        {RECIPES.map((r) => (
          <div key={r[0]} className="row srow"><span style={{ flex: 1 }}>{r[1 + i]}<br /><span className="muted">{r[3].map(([id, g]) => `${byId(id)?.name} ${g}g`).join(' · ')}</span></span>
            <button className="ghost" onClick={() => setRc({ name: r[1 + i], ings: r[3].map(([id, g]) => ({ id, g })), final: '', servings: '1' })}>{f('addTpl')}</button></div>))}
      </div>

      <div className="ent"><b>⬇️ {f('imp1')}</b><span className="muted">{f('impHelp')}</span>
        <input type="file" accept="application/json,.json" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        {busy && <span className="muted">⏳</span>}
        {rep && <p>📋 {f('rep')}: {rep.imported} {f('imported')} · {rep.updated} {f('updated')} · {rep.skipped} {f('skipped')} · {rep.rejected} {f('rejected')} · {rep.nearDup} {f('nearDup')}
          {Object.keys(rep.reasons).length > 0 && <><br /><span className="muted">{Object.entries(rep.reasons).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span></>}<br /><span className="muted">{f('attr')}</span></p>}
        {customs.some((c) => c.ref) && <button className="ghost" onClick={() => confirm(f('confDel')) && run(async () => { for (const c of customs.filter((x) => x.ref)) await db.remove('nutrition', c.id); })}>🗑️ {f('delImp')} ({customs.filter((c) => c.ref).length})</button>}
      </div>
      <p className="muted">{f('barcode')}</p>
      {meals.length > 0 && <><h3>{f('saved')}</h3>{meals.map((m) => <div key={m.id} className="row srow"><span style={{ flex: 1 }}>{m.name}</span><button className="ghost" onClick={() => confirm(f('confDel')) && run(() => db.remove('nutrition', m.id))}>🗑️</button></div>)}</>}
    </section>
  );
}
