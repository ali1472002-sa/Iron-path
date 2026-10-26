export const STORES = ['settings','workouts','plans','nutrition','measurements','favorites','exercises'] as const;
export type Store = typeof STORES[number];
export const DB_VERSION = 1;
let dbp: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open('ironpath', DB_VERSION);
    r.onupgradeneeded = (e) => {
      const db = r.result;
      if (e.oldVersion < 1) STORES.forEach((s) => db.createObjectStore(s, { keyPath: 'id' }));
      // Future migrations: if (e.oldVersion < 2) { ... }
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
function run<T>(s: Store, mode: IDBTransactionMode, fn: (o: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then((db) => new Promise<T>((res, rej) => {
    const q = fn(db.transaction(s, mode).objectStore(s));
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  }));
}
export const getAll = <T,>(s: Store) => run<T[]>(s, 'readonly', (o) => o.getAll());
export const put = (s: Store, v: { id: string }) => run(s, 'readwrite', (o) => o.put(v));
export const remove = (s: Store, id: string) => run(s, 'readwrite', (o) => o.delete(id));
export const clearStore = (s: Store) => run(s, 'readwrite', (o) => o.clear());
export const clearAll = () => Promise.all(STORES.map(clearStore));

export async function exportAll(): Promise<string> {
  const data: Record<string, unknown[]> = {};
  for (const s of STORES) data[s] = await getAll(s);
  return JSON.stringify({ app: 'ironpath', version: DB_VERSION, exportedAt: new Date().toISOString(), data }, null, 2);
}
// Restore lives in backup.ts (validation, preview) + backupStore.ts (atomic transaction). The old importAll() was removed: it wiped data before writing and was not atomic.
export const measurementsCsv = (rows: { date: string; weightKg: number }[]) =>
  'date,weight_kg\n' + rows.map((r) => `${r.date},${r.weightKg}`).join('\n');
