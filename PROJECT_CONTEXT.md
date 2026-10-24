# IRON PATH — Project Context
iPhone-only, zero-cost, local-first Arabic-first fitness PWA. Stack: React 18 + TypeScript + Vite 5. No backend, no login (cloud = optional later stage).
## Status: Stage 1 done (untested in a browser/build — see CHANGELOG)
## Files: src/db.ts (IndexedDB, v1, stores: settings, workouts, plans, nutrition, measurements, favorites, exercises; all keyPath "id"), src/i18n.ts, src/App.tsx, src/styles.css, public/sw.js, public/manifest.webmanifest
## Rules: never replace working files with placeholders; bump DB_VERSION and add `if (oldVersion < n)` for schema changes; add strings to both languages.
## Stage 2 done: src/exercises.ts (data), Figure.tsx (SVG), Library.tsx. Next: Stage 3 — training plans + live workout logging. Gap: no PNG apple-touch-icon.
## Decision (cloud account)
Owner is the only user. Supabase/cloud sync evaluated and NOT adopted: no login, no backend. Data stays local in IndexedDB; protection = manual JSON export (save to Files/iCloud Drive). Revisit only if multi-device sync becomes necessary.
## Stage 2.1 notes
Library data: exercises.ts (names, steps, pose) + exerciseMeta.ts (muscles/equipment/type/level per id, breathing/mistakes/safety per pose pattern, labels). Plan draft lives in `plans` record id "current" = {items:[{exId,sets,reps}]}; Stage 3 must build on it. No workout logging exists yet (Stage 3).
