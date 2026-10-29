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
## 0.3.0 — Stage 3
- Workout tab: edit training plan (sets/reps), live workout logging (kg/reps/done per set), rest timer (60/90/120 s, sound/vibration where supported), history with volume, delete
- Progressive overload suggestion from the last session (+2.5 kg if all target reps hit; reps for bodyweight; keep otherwise)
- Active workout autosaves as `workouts` record id "draft"; saved sessions are {id,date,entries:[{exId,sets:[{kg,reps,done}]}]}. Backup format unchanged (v1)
## 0.3.1 — Stage 3 (completion)
- Workout: manual exercise add / empty session, per-exercise notes + pain flag, last performance and today-vs-last volume, accept/dismiss suggestions (no suggestion after a volume drop or pain flag), rest timer start/pause/reset, rest value stored per completed set, guidance disclaimer
- New Stats tab: sessions (7/30 days), completed sets/reps, per-exercise volume, best set (heaviest; ties by reps), best single-session volume, SVG charts for top weight and total reps
- Backup format unchanged (v1)
## 0.4.0 — Phase 4: personalized plan builder
- New Plan tab (src/Plan.tsx) + generator (src/planGen.ts): onboarding (goal, experience, days, duration, equipment, split, priority muscles, exercises to avoid), generation from existing library exercises only, per-exercise sets / rep range / rest, swap alternatives, reorder, sets ±, rename, regenerate, save / save as new, duplicate, delete (with confirmation), activate
- Weekly schedule: move workouts between days (swap), rest days, "move to today" for missed workouts, planned vs completed (this week / last week)
- "Start" on a scheduled day loads it into the Workout tab; saved sessions keep planId/dayId (history is never touched when plans are edited or deleted)
- Navigation: inactive tabs show icons only
- Storage: plans saved in `plans` store as ids `plan:*`, `activePlan`, `profile` (`current` unchanged). Backup format v1 unchanged
## 0.5.0 — Phase 5: nutrition
- New Nutrition tab (src/Nutrition.tsx, nutri.ts, foodData.ts): profile (age, sex, height, weight, goal, activity, rate, preferences), Mifflin–St Jeor estimate with step-by-step explanation, safe floors (1500/1200 kcal), no deficit under 18, manual target override
- Starter food list (29 approximate per-100 g values, labeled), custom foods (create/edit/delete), breakfast/lunch/dinner/snacks, editable grams, daily totals + remaining, saved meals, frequent foods, date navigation
- Progress: 7-day averages, actual vs target bars, weight trend chart (shares the existing `measurements` store with the Home tab), workout sessions count
- Storage (no DB version change, no migration): `nutrition` store ids `profile`, `food:*`, `meal:*`, `log:YYYY-MM-DD`; weights stay in `measurements`. Included in existing JSON export/import automatically.
## 0.6.0 — Phase 6: progress dashboard
- New Dashboard tab (now the landing tab; Home weight tracking kept): sessions this week/month and per range, volume, plan adherence, nutrition averages (logged days only), weight average, next scheduled workout
- Charts (inline SVG, offline, LTR axes): weekly sessions, weekly volume, weight, daily calories and protein vs target, exercise progression (top weight / reps / volume)
- Personal records (heaviest completed set, ties by reps), period comparison (week, month, 7/30/90 days) with "—" for missing data
- Rule-based observations with date range, n, rule text, suggestions; dismiss / mark done stored in `plans` record `insights` (included in JSON backup). No AI, no auto-changes to plans/targets
- All calculations in src/analytics.ts (pure, tested in Node)
## 0.7.0 — Phase 7: goals, achievements, reminders
- New Goals tab (src/Goals.tsx, src/goals.ts): weekly goals (workouts, sessions per muscle, volume [needs ≥2 weeks of sessions], days with food logged, days reaching ≥90% of protein target, days with a weigh-in), user-chosen week-start day, progress %, remaining, last-week summary; unlogged data is never counted as zero/completed
- Achievements (9): first workout, 10/25 sessions, first complete training week, 4-week consistency (≥2 sessions/week), first PR (heavier set than earlier sessions), 7/30 days of food logging, 4 weeks of weight logging. Unlock once, date stored, progress bars, prompts can be disabled. No rewards for calorie restriction, extra volume, or training through pain
- Reminders: master switch, quiet hours, per-category time/days, backup interval, water cup tracker. **In-app only** (shown as a banner while the app is open); no iPhone system notifications (needs a push server or native app). Never shown for completed actions, during quiet hours, or twice per day
- JSON export now records the last backup date for the backup reminder
- Storage (no DB version change): `plans` ids `goals`, `ach`, `reminders`; `nutrition` id `water:<date>`. All included in backups
## 0.8.0 — Phase 8: installable PWA + offline
- Found: previous service worker only cached files seen after it took control, so the first offline reload could miss the JS/CSS bundles. Replaced by a build-time generated sw.js (sw-plugin.ts + sw.template.js, no new dependency) that precaches every built file with a content-hash version; old caches are deleted on activate; only Cache Storage is touched (IndexedDB/localStorage never cleared)
- Update flow: new version is detected, user sees "Update now / Later" banner, SKIP_WAITING then reload; drafts are persisted in IndexedDB so reloads are safe
- Manifest with 192/512 PNG, maskable icon and SVG; apple-touch-icon (180); iOS meta (status bar, title, format-detection); inline launch splash; _headers for Cloudflare Pages (no-cache for sw.js)
- Offline badge (shown only when offline), in-app install guide (Safari → Share → Add to Home Screen; no fake install button), contrast and safe-area/overflow fixes, reduced-motion respected
- Removed public/sw.js (superseded by generated sw.js). No data migration needed.
## 0.9.0 — Database expansion
- Audit (before): 14 exercises, 29 foods, 0 duplicate ids/names; foods had no fiber/category/source/status; no equipment beyond bodyweight/dumbbell/barbell/bar
- Exercises 14 → 30 (cable, machine, resistance band, calves, obliques, mobility, warm-up, conditioning, unilateral); tips per movement pattern; text-only fallback when no diagram; planner excludes warm-up/mobility/conditioning and now uses cable/machine/band
- Foods 29 → 66 with category, fiber, status (verified/approximate/estimate/your value), source label; Arabic-normalised search (diacritics, alef/ya/ta marbuta); category filter; pagination; recipe builder (totals from ingredients) + 4 recipe templates
- In-app importers for USDA FoodData Central JSON (CC0) and free-exercise-db JSON (Unlicense) with validation, dedupe and a report; imported records stored with source/license, deletable in bulk; included in JSON backup
- Not done (documented in DATA_SOURCES.md): bulk data bundled, Open Food Facts/barcode, images for new exercises, unilateral/bilateral filter UI
## 0.10.0 — Exercise visual system
- Audit: no photo/video/GIF assets existed; only 14 inline SVG stick-figure poses (8 shared patterns). Replaced by one consistent system
- Parametric rig (rig.ts): two-bone IK keeps limb lengths constant; start/end poses authored, middle frame computed; scene (floor, bench, seat, pull-up bar, leg-press platform), gear (dumbbell, barbell plate, cable), movement arrow, primary/secondary muscle highlight
- 24 of 30 exercises have a 3-frame diagram with prev/next, dots and a Play loop (hidden when the OS requests reduced motion); the other 6 show text steps and an explicit "no illustration" note
- Media map (media.ts) with source/license per entry; video/animation viewer paths (muted, no autoplay, poster, lazy, offline message) exist but no files are shipped
- Detail page now shows Arabic + English names, suggested dose (hypertrophy), progression/safety text and up to 4 same-muscle alternatives; "add to plan" and favorites unchanged
- No data model, id or backup-format change
## 0.11.0 — Live workout mode
- New Live screen (src/Live.tsx) replaces the inline draft UI in the Workout tab; same `workouts` draft record, same saved-session shape (kg/reps/done), so history, analytics, goals and backups are unchanged
- Current + next exercise, overall progress (exercise n/N, sets done/total), exercise illustration (collapsible), planned vs actual per set (planned reps range and load from last time shown separately from editable actual values), steppers for reps/load, optional RPE and per-set note, exercise note + pain flag, add/remove set, skip exercise (undo), add/remove exercise, previous performance, suggestions (accept/dismiss, clearly labelled "not a record")
- Plan "Start" now carries rep range and rest per exercise; the quick-plan editor keeps repMin/repMax in sync
- Timestamp-based rest timer persisted in the draft (start, pause, resume, +15 s, skip, per-exercise duration, visible "rest over" state); optional vibration/Notification only where supported
- Session pause/resume (freezes elapsed time and rest), abandon with confirmation, recovery after reload (+ "resume session" banner on other tabs), idempotent set completion + 400 ms tap lock, summary (duration, exercises, sets, reps, volume only when load data exists, skipped, confirmed personal records)
- Saved sessions gain optional fields: durationSec, endedAt, skipped[], startedAt, pausedMs, per-set rpe/note/at/rest, per-entry plan. Older sessions remain valid
## 0.12.0 — Adaptive training coach (rule-based)
- Dashboard → "Coach" sub-tab (no new nav tab, no duplicated charts): weekly working sets per muscle (direct vs indirect, never merged), weekly frequency, per-exercise history (top set, completed/prescribed sets, volume, estimated 1RM), plan adherence, configurable rules
- Recommendations (load_up, hold, decline, substitute, volume_gap, below/above configured range) each show observation, data range + n, rule, proposed change and uncertainty. Accept opens a review step; Reject/Dismiss are stored; accepted changes can be undone
- Accepting a load recommendation stores a coach target used only to pre-fill the planned load of the next session. Accepting a substitution creates a NEW copy of the plan (original untouched, activation is a separate explicit action; undo deletes the copy)
- Warm-up flag per set in the live screen; warm-ups are saved in `entry.warmups` and never counted by any existing analytics
- Records: `plans` ids `coach` (dismissed/rejected/accepted/targets), `coachcfg`. Backup format unchanged
## 0.13.0 — Backup & restore (hardening)
- Audit: old restore wiped all stores immediately after a file was picked (no preview, no warning, no safety copy) and wrote records one by one (a failure mid-way left partial data). Export used a fixed filename and no integrity data
- Export: full JSON with counts + SHA-256 checksum (fallback FNV), timestamped filename, "Save to Files / iCloud" via the iOS share sheet when supported, plain download otherwise; last-backup date feeds the backup reminder. Old backup files (no checksum, missing stores) still restore
- Restore: pick file → validation (JSON, app id, version, sections, per-record shape, duplicate ids, unknown sections, checksum) → preview (file info, counts in file vs on device, expected effect) → choose Merge (default; adds only missing ids, never touches existing records) or Full replace (explicit warning + checkbox + safety step) → final confirmation. Invalid records are skipped and reported; a checksum mismatch needs an explicit override
- Safety: automatic in-app snapshot (separate IndexedDB database, last 3) before every restore, delete-all and undo; optional safety file; the restore runs in ONE IndexedDB transaction (all-or-nothing); "Undo" restores a snapshot
- Removed db.importAll (unsafe). Delete-all now takes a snapshot first
- No schema/DB version change
## 0.14.0 — Professional UI/UX redesign (interface only)
- Design system (src/styles.css): navy/charcoal surfaces, one muted amber accent, shared spacing/radius tokens, light + dark themes, safe-area aware; button tiers: primary / secondary (default) / ghost / danger
- Emoji removed from the whole interface and replaced by one consistent icon set (Lucide, inlined in src/Icon.tsx, no new dependency); arrows/chevrons flip automatically in RTL
- Bottom navigation reduced from 9 to 5 items (Home, Workout, Nutrition, Progress, More) with always-visible labels; Plan, Exercises, Goals, Stats, Weight and My Data moved to a new "More" page (src/More.tsx) together with language and theme settings. No feature removed
- New Home dashboard (src/Home.tsx): greeting, today's/next planned workout with one primary action (start / resume / create plan), weekly sessions, latest weight, today's calories, shortcuts
- Weight tracking moved to its own page (src/Weight.tsx): value field with unit, validation message, Arabic-Indic digit input accepted, latest value + change, small trend chart, compact record list, inline delete confirmation. Entry date now uses the local date (was UTC date, which could be one day off after midnight)
- Dashboard: removed duplicated title/nested card, segmented Overview/Coach switch, period chips wrap instead of being cut off
- Text that referred to old tabs updated ("More → Exercises", "More → My Data")
- Storage, IndexedDB schema (v1), backup/restore logic and all analytics are unchanged. Verified in a headless browser: add weights → export JSON → delete all → restore from file → data back
- NOT verified: `npm run build` with Vite (no network in the authoring environment); bundled/type-checked with esbuild + tsc instead. Run `npm run build` once before deploying

## 0.15.0 — Professional gym exercise library (30 -> 77 exercises)
- 47 new gym exercises (machines, cable, Smith machine, free-weight basics) in src/gymRows1.ts + src/gymRows2.ts; one object per exercise with bilingual name, primary/secondary muscles, equipment, level, movement pattern, equipment needed, setup, start/end position, numbered steps, breathing, mistakes, safety and "if the machine is not available" alternatives
- All 30 original exercises keep their ids, muscle, metadata, steps and diagrams (verified by script); 6 display names clarified (e.g. "Dumbbell overhead press", "Bodyweight squat"); movement pattern, setup, start/end and equipment-needed added to all of them (src/gymLib.ts overlay)
- 45 new original diagrams (src/gymMedia.ts) drawn with the existing rig; rig.ts gained scene decoration (`deco`) and machine/cable links (`link`) so machines, pads, rails and cables are drawn. Machine shapes are approximate and labelled as such. No external video or image is bundled, no link is invented. Diagram pending: Dumbbell shrug, Pallof press (plus 6 older exercises that never had one)
- Library UI: filters for muscle, equipment (incl. Smith machine), movement pattern, level, favourites and "with diagram only"; Arabic/English search also matches equipment and pattern names; result count and clear-filters; structured detail page (status badge, media with source/licence, muscles, equipment needed, setup, start/end positions, numbered steps, breathing, mistakes, safety, indicative dose by goal, alternatives)
- Data-status badge: "complete data" / "full text, diagram pending" / "incomplete data"
- Plan generator: Smith machine counts as gym equipment. Generated plans for the "gym" setting stay complete (0 empty days in 960 profile combinations); other equipment settings behave exactly as before
- Storage schema, backup/restore and existing plans/sessions untouched. Verified: log a session with a new machine exercise -> saved, survives reload, shows in progress and coach
- NOT verified: `npm run build` with Vite (no network where this was authored); bundled with esbuild and type-checked with tsc instead

## 0.16.0 — Anatomical muscle map + animated demonstrations (Pallof Press prototype first)
- New simplified anatomy map (src/Anatomy.tsx): front and back figures, primary muscles in the accent colour, secondary muscles in a second colour, neutral for muscles not involved; muscle names in Arabic and English; only the view(s) that contain highlighted muscles are shown. Shading is generated from each exercise's own META data (primary/secondary muscle keys), so every one of the 77 exercises gets its own map; nothing is coloured just because it is near the movement
- META primary muscle may now list several keys ("obliques,tva"); new key `tva` (transverse abdominis, deep core) drawn as a dashed band because it is not a surface muscle. Coach still uses the first key
- Pallof press (src/customViews.tsx): hand-built animated TOP view — person standing side-on to the cable stack, cable anchor and pull direction, hands moving from the chest to full extension, fixed spine reference line and "torso stays square" caption; trunk tinted, muscles shown in the map (obliques + deep core primary; rectus abdominis, lower back, glutes, deltoids secondary) so it is not presented as isolating one muscle. A side-view stick figure cannot show anti-rotation, hence the custom scene (new media kind "custom")
- Playback: easing with a short hold at both ends, play / pause / restart, and static start / middle / end positions for every animated exercise; secondary-muscle colour now consistent between the stick-figure highlight and the anatomy map
- Exercises with diagram + motion: 70 of 77 (69 stick-figure animations + Pallof). Without any diagram: dumbbell shrug, knee push-up, dumbbell fly, crunch, Russian twist, band pull-apart, cat-cow
- Muscle shading flagged "needs specialist review" for jacks, cat-cow and bodyweight hip thrust; imported exercises are flagged the same way. Nothing is claimed to be reviewed by a coach or clinician
- scripts/check-media.ts understands the custom kind (run: tsx scripts/check-media.ts -> 0 errors)
- NOT verified: `npm run build` with Vite (no network where this was authored) and Safari on a physical iPhone; checked with esbuild bundle, tsc and headless Chromium at iPhone size

