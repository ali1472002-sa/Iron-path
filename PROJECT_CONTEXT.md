# IRON PATH — Project Context
iPhone-only, zero-cost, local-first Arabic-first fitness PWA. Stack: React 18 + TypeScript + Vite 5. No backend, no login (cloud = optional later stage).
## Status: Stage 1 done (untested in a browser/build — see CHANGELOG)
## Files: src/db.ts (IndexedDB, v1, stores: settings, workouts, plans, nutrition, measurements, favorites, exercises; all keyPath "id"), src/i18n.ts, src/App.tsx, src/styles.css, public/sw.js, public/manifest.webmanifest
## Rules: never replace working files with placeholders; bump DB_VERSION and add `if (oldVersion < n)` for schema changes; add strings to both languages.
## Next: Stage 2 — exercise library + original SVG demos. Known gap: no PNG apple-touch-icon yet.
