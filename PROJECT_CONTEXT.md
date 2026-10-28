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
## Stage 3 done
src/Workout.tsx. Plan = `plans` id "current" {items:[{exId,sets,reps}]}. Sessions in `workouts` (id "draft" = in-progress, excluded from history). Weekly calendar not built yet. Next: Stage 4 nutrition (calories/macros, food database).
## Stage 3.1
src/Stats.tsx added. Entry fields note/pain and set field rest are optional, so older backups stay valid. "Best performance" = heaviest completed set; best session volume is labeled separately.
## Phase 4
Plan.tsx / planGen.ts. Records in `plans`: `plan:<uuid>` {name, profile, days:[{id,name[ar,en],weekday(0=Sun),items:[{exId,sets,repMin,repMax,rest,unit?}]}], notes}, `activePlan` {planId}, `profile` {profile}, `current` (Workout/Library quick list). Never store extra records in `settings` (App reads its first record). Library has only 14 exercises, none for resistance bands; pull exercises need bar/dumbbell. Plank reps are seconds. Next: nutrition (calories/macros, food DB).
## Phase 5
Nutrition.tsx/nutri.ts/foodData.ts. `nutrition` store: `profile`, `food:<uuid>` {name,g,per{k,p,c,f per 100g}}, `meal:<uuid>`, `log:<date>` {date, entries[{id,meal b|l|d|s,foodId,name,g,per,src}]}. Entries snapshot per-100g values so later food edits don't rewrite history. Starter foods are approximate. Next: Phase 6 final integration test + deployment guide.
## Phase 6
Dashboard.tsx (UI) + analytics.ts (pure functions: periods, volume, records, adherence, nextWorkout, nutritionAvg, weightTrend, insights). Weeks start Saturday (same as Plan tab). Volume = Σ kg×reps of completed sets (bodyweight 0 kg adds 0). Dismissed/done insights: `plans` id `insights` {dismissed:{key:ts}, done:{key:ts}}; keys include the week start so an insight can reappear next week. Charts keep LTR axes in Arabic.
## Phase 7
goals.ts (pure: wStart/weekOf, progress, achievements, newlyUnlocked, due/inQuiet) + Goals.tsx (tab + <Banner/> mounted in App). Records: `plans`:`goals` {wsd, items[{id,type,target,muscle?}], motivation}, `plans`:`ach` {unlocked:{key:{date}}, prompts}, `plans`:`reminders` {master, quiet, cats, seen, lastBackup, waterTarget}; `nutrition`:`water:<date>` {cups}. Reminders are in-app only by design (no server). Plan tab and analytics keep their Saturday-start weeks; only goals use the configurable week start.
## Phase 8
PWA: vite.config.ts uses sw-plugin.ts (reads sw.template.js, emits dist/sw.js with version hash + precache list; extras for public/ files). main.tsx registers sw and dispatches `sw-update`; PwaBits.tsx = OnlineBadge, UpdateBanner, InstallGuide. Icons in public/ are generated PNGs (barbell mark). Do not re-add public/sw.js. Not tested on a real iPhone: install, offline reload, update flow.
## Database expansion
See DATA_SOURCES.md. Files: refdata.ts (pipeline), foodDb.ts (bundled foods, recipe templates, categories), exercisesExtra.ts (+16 exercises, META, tips), FoodsPanel.tsx (Foods view), scripts/import.ts. EXERCISES = BASE + EXTRA_EX; META extended via Object.assign. `ref:` records in `nutrition`/`exercises` are imports; never treat them as user-custom. Planner generator only uses built-in exercises.
## Exercise visuals
media.ts = id -> media (frames/video/anim) with source+license; rig.ts = rig + primitives (shared by the SVG viewer ExerciseMedia.tsx and the QA renderer); Figure.tsx is now unused (old stick figures). Frame = [hipX,hipY,torsoDeg, foot1xy, foot2xy, hand1xy, hand2xy]; cfg.ks/es = knee/elbow bend side (front view mirrors the second limb). Add an exercise diagram by adding a MEDIA entry; keep ids stable. Do not add video/anim entries without the file + license.
## Live workout
liveLogic.ts = pure, tested timer/session/summary functions (all times are epoch ms in the draft); Live.tsx = UI; Workout.tsx hosts it and builds the draft in start(). Draft fields: startedAt, pausedAt, pausedMs, cur, autoRest, rest{end|left,total,done,bySession}, entries[{exId,plan{sets,repMin,repMax,rest},skipped,note,pain,sets[{kg,reps,pk,pr,done,at,rpe,note}]}]. Saved sessions drop rest/cur/pausedAt/autoRest. The draft is also exported in JSON backups (harmless; analytics ignore id "draft").
## Coach
coach.ts = pure rules/metrics (tested); Coach.tsx = UI inside Dashboard (sub-tab). Working set = completed, reps>0, not warm-up. Weeks start Saturday. Unknown/unlogged is never zero: groups never logged recently, unmapped exercises and weeks without sessions are skipped. Recommendations never edit a plan in place; `plans:coach.targets[exId].kg` only pre-fills the planned load in Workout.start().
## Backup & restore
backup.ts (format 2, validation, planRestore — pure, tested), backupStore.ts (IndexedDB: atomic applyRestore, safety DB `ironpath-safety`, markBackupDone), BackupPanel.tsx (UI in the Data tab). Backup file: {app:'ironpath', format:2, version:DB_VERSION, appVersion, exportedAt, meta:{counts, checksum{algo,value}}, data:{<store>:[...]}}; checksum covers `data` via key-sorted stringify. Format-1 files (no meta) remain accepted. Never reintroduce clear-then-write restores; keep restores in a single transaction. Safety snapshots live in the same browser storage, so they are NOT a substitute for the exported file.
## UI redesign (0.14.0)
Navigation: 5 bottom tabs (home, wk, nu, db) + `more`; sub-pages reached from More (pl, lib, gl, st, weight, data) show a back button. State type `Tab` and `MORE_TABS` live in src/App.tsx. Icons: `<I n="name" />` from src/Icon.tsx (add new Lucide paths there; never use emoji as UI icons). Styling: tokens in src/styles.css (:root / [data-theme=dark]); default `button` is secondary, add `className="primary"` for the single main action, `ghost` for light actions. New files: Home.tsx, Weight.tsx, More.tsx, Icon.tsx. Weight records still live in store `measurements` ({id,date,weightKg}).

