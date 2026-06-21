# refine-program — author a program's AI overlay + supplement

Committed recipe for the fuzzy/non-catalog layers of the program-ingestion pipeline
(see `docs/INGESTION.md`). Run this for one program at a time when its deterministic
extract (`src/data/program-extracts/<id>.json`) can't fully express the requirements.

The catalog page + the extract are the inputs. You produce two committed files:
`src/data/program-refine/<id>.json` (overlay) and, if needed,
`src/data/program-supplements/<id>.json` (non-catalog data). The deterministic build
(`scripts/build-programs.mjs`) merges them — it never calls a model.

## When each file is needed

- **No overlay/supplement** — the deterministic scrape already produces a correct file
  (e.g. `cs`, `psychology-minor`). Don't create empty files.
- **Overlay (patch mode)** — the structure is right but a pool needs a real
  `creditsRequired`/`note`, or specific courses need a `requirementGroup`/`choiceNote`.
- **Overlay (structure mode)** — the program is track-/group-structured and the flat
  classifier mis-models it (e.g. `ms-cs` concentrations, `phd-cs` qualifying areas).
- **Supplement** — data not on the catalog page at all: AP/transfer/milestone
  `checklist`, program `note`, `hasCompletionEstimate`, credit pins, or a `roadmap`
  for a page that has no Plan of Study Grid (e.g. `phd-cs`).

## Steps

1. Read `src/data/program-extracts/<id>.json` and open the `catalogUrl`. Note its
   `contentHash`.
2. Decide overlay mode from the extract's sections/comments:
   - **patch**: `{ "id", "basedOnExtractHash", "electiveOptions": { "<key>": { "creditsRequired", "note" } }, "courseOverlays": { "<courseId>": { "requirementGroup", "choiceNote" } } }`
   - **structure**: `{ "id", "basedOnExtractHash", "structure": { "requiredCourseCodes": ["COMP 417", …], "electiveGroups": [ { "key", "label", "creditsRequired", "members": ["COMP 409", …], "note" } ] } }`
     - Use catalog codes verbatim; titles/credits are filled from the extract/index — never put titles in the overlay.
     - Omit `members` for an open pool (renders as a note-only requirement).
     - `"select three of the following"` → `creditsRequired` = 3 × credits-per-course; `"choose one"` → one course's credits.
3. Set `basedOnExtractHash` to the extract's `contentHash`. The build trusts the overlay
   only while this matches; if the catalog page changes, re-run fetch-program then redo
   this step for that one program.
4. If non-catalog data exists, write `src/data/program-supplements/<id>.json` with only
   the fields it owns (`checklist`, `note`, `hasCompletionEstimate`, `*Credits` pins,
   `roadmap`). Checklist items need stable `id`s.
5. Vet, then adopt:
   ```bash
   node scripts/build-programs.mjs --out /tmp/regen <id>     # diff against src/data/<id>.json
   # set generated: true in scripts/program-manifest.mjs once curricularly equivalent
   node scripts/build-programs.mjs <id>
   node scripts/normalize-program-courses.mjs
   npm test && npm run check:programs && npm run build
   ```

## Guardrails
- Don't restructure in patch mode — patch only refines existing keys. Use structure mode
  to define courses[]/electiveOptions explicitly.
- A roadmap may only ref a course id that exists in the program; otherwise use a label.
- Keep overlays/supplements minimal — anything the deterministic extract already gets
  right does not belong here.
