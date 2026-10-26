# IRON PATH — data sources, licenses and inventory

## Bundled in the app (what is actually shipped)
| Dataset | Records | Source / status |
|---|---|---|
| Exercises | 30 (14 original + 16 added) | Written for this project. Original 14 have SVG diagrams; the 16 added have text steps only. Bilingual AR/EN. Tips (breathing/mistakes/safety) per movement pattern |
| Foods | 66 (29 + 37 added) | Typical per-100 g values (approximate, **not individually verified against a source**), status `approximate`. Fiber present for most; unknown = null (never 0) |
| Recipe templates | 4 (Iraqi/Middle Eastern) | Ingredient lists are rough estimates; totals are computed from the ingredient values, status `estimate` |

No USDA, Open Food Facts or free-exercise-db records are bundled: this build environment had no network access, so nothing could be downloaded. Nothing in the app claims otherwise.

## Optional import sources (verified licenses, imported by the user on the phone)
| Source | License (verified) | Use in app |
|---|---|---|
| USDA FoodData Central — Foundation Foods / SR Legacy JSON (fdc.nal.usda.gov/download-datasets) | Public domain, CC0 1.0. Attribution requested | Nutrition → Foods → "Import USDA JSON". Records stored as `ref:usda:<fdcId>`, status `verified`, source + license kept |
| free-exercise-db (github.com/yuhonas/free-exercise-db, `dist/exercises.json`, 873 records at last check) | Unlicense (public domain). English only | Exercises → "Import exercises JSON". Records `ref:fedb:<id>`. **Images are not imported** (file size; image provenance is not independently verified) |
| Open Food Facts | Database ODbL 1.0 (share-alike), contents DbCL, images CC BY-SA | **Not used.** Bundling or merging would impose ODbL share-alike on the derived database; barcode lookup needs online API calls. Not implemented |
| wger / ExerciseDB | CC-BY-SA / AGPL (per community survey) | Not used |

## Import pipeline (src/refdata.ts, also scripts/import.ts)
Normalizes Arabic/English names, builds stable ids (`ref:<source>:<id>`), validates numbers (range, macros ≤ 100 g, fiber ≤ carbs, energy within tolerance of 4P+4C+9F), rejects with reasons, skips exact-name duplicates of bundled/user records, counts near-duplicates (token similarity ≥ 0.8) while importing them, is idempotent (re-import = skipped; changed record = updated). Reports imported / updated / skipped / rejected / near-duplicates.
Adapters were tested only on small fixtures shaped like the documented formats, **not on the real downloads**.

## Separation of data
Bundled reference data lives in code (exercises.ts, exercisesExtra.ts, foodData.ts, foodDb.ts). User records and imports live in IndexedDB (`exercises`, `nutrition`): custom = uuid/`food:` ids, imported = `ref:` ids. Updating the bundled data never touches stored records; history entries snapshot nutrition values and reference stable ids.

## Exercise media inventory (actual, verified by script and visual QA)
| Type | Count | Notes |
|---|---|---|
| Original multi-frame diagrams (start / middle / end, arrows, muscle highlights) | 24 (23 two-pose + plank as one hold pose) | Drawn for this project by a parametric rig (src/rig.ts + src/media.ts). Not photographs, not reviewed by a coach/clinician. Middle frame is computed |
| Verified photographs | 0 | None bundled |
| Animated illustrations (GIF/WebP) | 0 | Viewer code exists, no files shipped |
| Instructional videos | 0 | Viewer code exists (controls, muted, no autoplay, poster, lazy), no files shipped, never tested with a real file |
| Text-only fallback | 6 | kneepush, dbfly, crunch, russian, bandpull, catcow (a side-view stick figure cannot show them accurately) |

Third-party exercise media (free-exercise-db images, wger, ExerciseDB, YouTube/brand videos) are **not** bundled: image provenance/redistribution was not independently verified in this environment. To add media later: put the file in public/media/, add an entry (source + license) in src/media.ts, and run scripts/check-media.ts.
