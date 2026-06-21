# TODO

## 1. Minors — DONE (2026-06-20)

Added **86 minors** across CAS (63), Quinlan Business (14), and the School of Communication (9),
fetched from catalog.luc.edu and transcribed into `src/data/*-minor.json` with `"kind": "minor"`.
59 include catalog-derived sample-sequence roadmaps; the rest are requirements-only (the catalog
page had no sample sequence). All registered in `programs.ts`.

Required code fix: `HomeScreen.tsx`'s CAS filter excluded `degree: "Minor"`; it now also keeps
`kind === 'minor'`. Business/Communication route by `department`, so no change was needed there.

Department headers reuse the exact strings used by the matching majors (e.g.
`"Chemistry and Biochemistry"`, `"Modern Languages and Literatures"`, `"Fine and Performing Arts"`)
so each minor groups under its major.

Not added (out of the three supported schools, or already exist as CS-dept minors): Education,
Nursing, Health Sciences, Environmental Sustainability, and Social Work minors; the Data Science and
Bioinformatics minors (CS-department, would belong in the CS tab — revisit if wanted).

### Follow-up for the minors data
- Open elective *pools* (e.g. "9 credits of 300-level HIST") are modeled with a single placeholder
  option (`"code": "XXX 3XX", "uniqueProgress": true`). Where the catalog enumerates allowed
  courses, those are listed instead. Spot-check pool-heavy minors against the catalog.
- A handful of Business minors have eligibility caveats (e.g. some require/exclude Quinlan students,
  or reduce credits because courses double as the Business Core). These are captured in `note` text,
  not enforced by the model.

---

## 2. Roadmaps missing from CAS majors/interdisciplinary

These programs exist but have no semester sequence yet:

| Program | Kind |
|---|---|
| Anthropology BA + BS | major |
| Classical Civilization BA, Latin BA | major |
| Criminal Justice BS | major |
| English BA | major |
| Music BA | major |
| French BA, Spanish BA | major |
| Political Science BA | major |
| Psychology BS | major |
| African Studies BA | interdisciplinary |
| Human Services BS | interdisciplinary |
| Mathematics & CS BS | interdisciplinary |
| Sociology & Anthropology BA | interdisciplinary |

---

## 3. Roadmaps blocked by stale course codes — DONE (2026-06-20)

All 5 programs were **re-derived from the current catalog** (not renamed), with roadmaps added:

- Biophysics BS ✓
- Theoretical Physics & Applied Math BS ✓
- Forensic Science BS ✓
- Cognitive & Behavioral Neuroscience BS ✓
- Molecular & Cellular Neuroscience BS ✓

The old codes (CHEM 101/102, PHYS 125/126/213) were superseded and, critically, the current
catalog **reuses some old numbers for different courses** (e.g. PHYS 301 is now Mathematical
Methods, not Classical Mechanics) — so a rename would have been wrong.

### Course-data ingestion pipeline (catalog = source of truth) — DONE
Built a durable pipeline so a course number always has exactly one catalog name (see
`docs/INGESTION.md` and memory `course-data-ingestion-pipeline`):
- `scripts/fetch-dept-courses.mjs` now covers **73 departments** and also emits the flat master map
  `src/data/course-index.json` (3.7k courses, `code → {title, credits}`).
- `scripts/normalize-program-courses.mjs` rewrites all program titles from the index — **corpus-wide**,
  not just STEM. Empty/placeholder/thematic-label titles from the v1.1 minors pass are fixed.
- `src/utils/courseIntegrity.test.ts` fails the build on any title drift or unknown code.
- Exceptions tracked in `src/data/course-exceptions.json`.

### Remaining follow-ups (see `LIKELY_WRONG.md`)
- **Wrong course numbers** in older programs (e.g. `MATH 315` should be `MATH 351`; `statistics-bs`
  STAT 335/336/337/338; `it` COMP 306). The title now matches the (wrong) number — fix the **code**.
- **Codes not in catalog** (~22, e.g. `THEO 300`, `ENVS 332/364`, language 301/310s) — verify/renumber.
- **Credit-hour discrepancies** vs catalog (40 items, e.g. MATH 161 is 4 cr not 3) — see
  `CREDITS_DISCREPANCIES.md`; deferred per decision (titles-first).

---

## 4. Possibly missing CAS programs

These may be distinct catalog entries worth adding as separate programs:

- Biology with Ecology Emphasis BS
- Biology with Molecular Biology Emphasis BS
- Mathematics Education Track BS
- Physics with Computer Science BS
- Film & Digital Media: International Programming Track (second track alongside Production)

---

## 5. Interdisciplinary programs for Business / Communication

Currently neither school has anything in their Interdisciplinary tab. Check whether the catalog lists any joint/interdisciplinary degrees under those schools.

---

## 6. Minor quality-of-life items

- `minorCredits` field is missing on some programs — the card falls back to `totalCredits`, which may be wrong for minors. (All 86 newly-added minors set `minorCredits` explicitly; this remains for older/CS-dept entries.)
- History BA, Philosophy BA, Theology BA, Religious Studies BA roadmaps have 0 tracked `ref` items (all `isElective`) — could be improved once course IDs are verified against catalog

---

## 7. Program-ingestion pipeline — machinery DONE, rollout in progress

Whole program files are now reproducible from committed inputs (manifest + catalog extract + AI
overlay + supplement), not hand-authored. See `docs/INGESTION.md`, `AGENTS.md`, and memory
`course-data-ingestion-pipeline`. Pieces: `scripts/program-manifest.mjs`, `scripts/fetch-program.mjs`,
`scripts/build-programs.mjs`, `src/utils/programIntegrity.test.ts`, `npm run check:programs` (byte
drift guard), and `.claude/workflows/refine-program.md`.

**Adopted (`generated: true`, drift-guarded):** `cs`, `psychology-minor`, `ms-cs`, `phd-cs` — the
pilot covering a major, a minor, an MS, and the PhD.

### Rollout waves (flip `generated: true` per program once regenerated output matches the catalog)
1. Remaining CS-dept programs (se, it, cybersecurity, datascience, bioinformatics, other MS)
2. CAS majors
3. CAS minors
4. School of Communication (majors + minors)
5. Quinlan Business (majors + minors)

When all programs are adopted, `build-programs.mjs` can also generate `src/data/programs.ts` and the
drift guard becomes corpus-wide. Note: `phd-cs` and other pages with no Plan of Study Grid keep their
roadmap in a committed supplement (not catalog-derivable).
