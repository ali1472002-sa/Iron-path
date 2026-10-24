# Changelog
## 0.1.0 — Stage 1
- Project shell (React + TS + Vite), RTL/LTR, light/dark themes, Arabic/English
- IndexedDB v1 with 7 stores and migration hook; JSON export/import with validation; CSV export (measurements); delete-all
- Manifest + service worker (network-first with offline cache fallback)
- Weight tracking as first persistent feature
## Decision — no cloud account
- Reviewed Supabase free tier (500 MB DB, auto-pause after 7 days inactivity, limited built-in email). Not implemented: single-user app, simplicity preferred.
## 0.2.0 — Stage 2
- Exercise library (14 built-in exercises, AR/EN), search, muscle filters, favorites, custom exercises (IndexedDB)
- Original SVG start/end stick-figure illustrations (8 poses)
## 0.2.1 — Stage 2 (professional library)
- Detail page per exercise: primary/secondary muscles, equipment, type, level, steps, breathing, common mistakes, safety (AR/EN) via src/exerciseMeta.ts
- Filters: muscle, equipment, type, level, favorites; search also matches muscle names
- "Add to plan" stores {exId, sets:3, reps:10} in IndexedDB store `plans` (record id "current"); backup format unchanged (v1)
- Diagram arrow start→end and "simplified diagram" caption
