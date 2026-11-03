import { STORES, DB_VERSION, DB_NAME } from './schema';
import type { Store } from './schema';
import { openWithMigrations } from './migrations';
export { STORES, DB_VERSION };
export type { Store };
let dbp: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (!dbp) {
    const p = openWithMigrations(DB_NAME, DB_VERSION);
    dbp = p;
    p.catch(() => { if (dbp === p) dbp = null; }); // a failed open must not stay cached forever: the next call retries
  }
  return dbp;
}
/** Close the shared connection (used before deleting the database and by tests). The next openDb() reopens it. */
export async function closeDb() { const p = dbp; dbp = null; if (p) { try { (await p).close(); } catch { /* never opened */ } } }

// Writes resolve when the transaction has COMMITTED (oncomplete), not merely when the request succeeded.
function run<T>(s: Store, mode: IDBTransactionMode, fn: (o: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((res, rej) => {
    const tx = db.transaction(s, mode);
    let out: T, q: IDBRequest<T>;
    try { q = fn(tx.objectStore(s)); } catch (e) { try { tx.abort(); } catch { /* ignore */ } rej(e); return; }
    q.onsuccess = () => { out = q.result; if (mode === 'readonly') res(out); };
    q.onerror = () => rej(q.error);
    tx.oncomplete = () => res(out);
    tx.onabort = () => rej(tx.error ?? q.error ?? new Error('tx-aborted'));
  }));
}
export const getAll = <T,>(s: Store) => run<T[]>(s, 'readonly', (o) => o.getAll());
export const put = (s: Store, v: { id: string }) => run(s, 'readwrite', (o) => o.put(v));
export const remove = (s: Store, id: string) => run(s, 'readwrite', (o) => o.delete(id));
export const clearStore = (s: Store) => run(s, 'readwrite', (o) => o.clear());
/** Clears every store in ONE transaction: either all stores are emptied or none. */
export async function clearAll(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction([...STORES], 'readwrite');
    tx.oncomplete = () => res(); tx.onabort = () => rej(tx.error ?? new Error('clear-aborted')); tx.onerror = () => rej(tx.error);
    for (const s of STORES) tx.objectStore(s).clear();
  });
}

/** @deprecated Legacy export (no checksum / format field). The app uses backup.ts + backupStore.currentBackupText. Kept for reference only. */
export async function exportAll(): Promise<string> {
  const data: Record<string, unknown[]> = {};
  for (const s of STORES) data[s] = await getAll(s);
  return JSON.stringify({ app: 'ironpath', version: DB_VERSION, exportedAt: new Date().toISOString(), data }, null, 2);
}
// Restore lives in backup.ts (validation, preview) + backupStore.ts (atomic transaction). The old importAll() was removed: it wiped data before writing and was not atomic.
const csvNum = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? String(n) : '');
const csvText = (s: unknown) => { const t = String(s ?? ''); return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
export const measurementsCsv = (rows: { date: string; weightKg: number }[]) =>
  'date,weight_kg\n' + rows.map((r) => `${csvText(r.date)},${csvNum(r.weightKg)}`).join('\n');
