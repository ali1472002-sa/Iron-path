// IndexedDB side of backup/restore: atomic restore transaction + a separate "safety" database that keeps the last snapshots taken before risky actions.
import { STORES, getAll, openDb } from './db';
import { buildBackup, countsOf } from './backup';
import type { Data, Plan } from './backup';

// One readonly transaction over every store = a consistent snapshot (a write in between cannot make the stores disagree).
export async function readAll(): Promise<Data> {
  const db = await openDb();
  return new Promise<Data>((res, rej) => {
    const tx = db.transaction([...STORES], 'readonly'), d: Data = {};
    for (const s of STORES) { const q = tx.objectStore(s).getAll(); q.onsuccess = () => { d[s] = q.result; }; }
    tx.oncomplete = () => res(d); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error ?? new Error('read-aborted'));
  });
}
export const idsOf = (d: Data) => Object.fromEntries(STORES.map((s) => [s, (d[s] ?? []).map((r: any) => r.id)])) as Record<string, string[]>;
// One readwrite transaction over every store: if anything fails the whole restore is rolled back.
export function applyRestore(db: { transaction: (names: string[], mode: 'readwrite') => any }, plan: Plan): Promise<void> {
  return new Promise((res, rej) => {
    const tx = db.transaction([...STORES], 'readwrite');
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error ?? new Error('restore-failed'));
    tx.onabort = () => rej(tx.error ?? new Error('restore-aborted'));
    try {
      for (const s of STORES) { const os = tx.objectStore(s); if (plan.clearFirst) os.clear(); for (const r of plan.puts[s] ?? []) os.put(r); }
    } catch (e) { try { tx.abort(); } catch {} rej(e); }
  });
}
export const currentBackupText = async () => JSON.stringify(await buildBackup(await readAll(), new Date().toISOString(), 'web'), null, 2);

const SAFETY = 'ironpath-safety';
const openSafety = () => new Promise<IDBDatabase>((res, rej) => { const r = indexedDB.open(SAFETY, 1); r.onupgradeneeded = () => r.result.createObjectStore('snaps', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
// Every operation opens the safety database, waits for the transaction to COMMIT, then closes the connection again
// (a leaked connection blocks deleteDatabase and any future schema upgrade of this database: proven by tests/restore.test.ts).
const run = async <T,>(mode: IDBTransactionMode, fn: (o: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openSafety();
  try {
    return await new Promise<T>((res, rej) => {
      const tx = db.transaction('snaps', mode); let out: T; const q = fn(tx.objectStore('snaps'));
      q.onsuccess = () => { out = q.result; };
      q.onerror = () => rej(q.error);
      tx.oncomplete = () => res(out); tx.onabort = () => rej(tx.error ?? q.error ?? new Error('tx-aborted'));
    });
  } finally { db.close(); }
};
let lastSnapId = 0;
/** Unique, increasing id: two snapshots taken in the same millisecond must not overwrite each other. */
const nextSnapId = () => (lastSnapId = Math.max(Date.now(), lastSnapId + 1));
export type Snap = { id: number; ts: string; reason: string; counts: Record<string, number>; text: string };
export async function snapshotNow(reason: string): Promise<Snap> {
  const d = await readAll(), text = JSON.stringify(await buildBackup(d, new Date().toISOString(), 'web'));
  const snap: Snap = { id: nextSnapId(), ts: new Date().toISOString(), reason, counts: countsOf(d), text };
  await run('readwrite', (o) => o.put(snap));
  const all = (await listSnapshots()).sort((a, b) => b.id - a.id);
  for (const old of all.slice(3)) await run('readwrite', (o) => o.delete(old.id));
  return snap;
}
export const listSnapshots = () => run<Snap[]>('readonly', (o) => o.getAll());
export const getSnapshot = (id: number) => run<Snap | undefined>('readonly', (o) => o.get(id));
export const deleteSnapshot = (id: number) => run('readwrite', (o) => o.delete(id));
export async function markBackupDone() {
  const plans = await getAll<any>('plans'), r = plans.find((x) => x.id === 'reminders');
  const db = await openDb();
  await new Promise<void>((res, rej) => { const q = db.transaction('plans', 'readwrite').objectStore('plans').put({ ...(r ?? { id: 'reminders', master: false }), lastBackup: new Date().toLocaleDateString('sv') }); q.onsuccess = () => res(); q.onerror = () => rej(q.error); });
}
