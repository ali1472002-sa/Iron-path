// IndexedDB schema migrations. Each migration upgrades the schema TO version `to` and runs inside the single versionchange transaction,
// so a throwing migration aborts the whole upgrade and the old database stays untouched at its old version.
// Rules: a migration may add stores/indexes and may rewrite rows, but must never delete a field or a record that the user created
// (rename = copy then keep the old field). Add a test in tests/migrations.test.ts for every new entry.
import { STORES, DB_NAME, DB_VERSION } from './schema';

export type Migration = { to: number; name: string; up: (db: IDBDatabase, tx: IDBTransaction) => void };

export const MIGRATIONS: Migration[] = [
  { to: 1, name: 'create-stores', up: (db) => STORES.forEach((s) => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' }); }) },
  // { to: 2, name: '...', up: (db, tx) => { ... } },   <- future steps go here, in order; never edit a released step
];

export function applyMigrations(db: IDBDatabase, tx: IDBTransaction, oldVersion: number, newVersion: number, list: Migration[] = MIGRATIONS) {
  const steps = [...list].sort((a, b) => a.to - b.to);
  for (let i = 1; i < steps.length; i++) if (steps[i].to === steps[i - 1].to) throw new Error('duplicate-migration:' + steps[i].to);
  for (const m of steps) if (m.to > oldVersion && m.to <= newVersion) m.up(db, tx);
}

export function openWithMigrations(name = DB_NAME, version = DB_VERSION, list: Migration[] = MIGRATIONS): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(name, version);
    r.onupgradeneeded = (e) => {
      try { applyMigrations(r.result, r.transaction!, e.oldVersion, version, list); } catch (err) { try { r.transaction?.abort(); } catch { /* already aborted */ } rej(err); }
    };
    r.onsuccess = () => {
      const db = r.result;
      db.onversionchange = () => db.close(); // let a newer tab/app version upgrade the schema instead of being blocked by this connection
      res(db);
    };
    r.onerror = () => rej(r.error ?? new Error('open-failed'));
    r.onblocked = () => { /* another connection is still open; the request stays pending until it closes */ };
  });
}
