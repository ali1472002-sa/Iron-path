// Single source of truth for the IndexedDB schema. Two different version numbers exist and must never be confused:
//  - DB_VERSION      : version of the IndexedDB schema (stores / indexes). Bump ONLY together with a migration in migrations.ts + tests.
//  - FORMAT (backup.ts): version of the backup FILE format. Bump only when the JSON layout of a backup file changes.
export const STORES = ['settings', 'workouts', 'plans', 'nutrition', 'measurements', 'favorites', 'exercises'] as const;
export type Store = (typeof STORES)[number];
export const DB_NAME = 'ironpath';
export const DB_VERSION = 1;
