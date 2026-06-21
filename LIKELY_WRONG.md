# Likely-Wrong Course Data

The catalog (https://catalog.luc.edu/) is the source of truth: every course number maps to exactly
one title. Course **titles** are now generated from the scraped master list
(`src/data/course-index.json`) by `scripts/normalize-program-courses.mjs`, and the
`course integrity` test fails the build if any program course title drifts from it.

What remains below are cases the catalog can't resolve automatically and that need a **human
decision** — almost always a wrong/outdated *course number*, not a wrong title.

---

## 1. Wrong course NUMBER (title belongs to a different code)

These programs pair a number with a course the catalog assigns to a *different* number. Titles were
normalized to the catalog's name for the number used, so the program now **displays a course it
probably does not intend**. Fix the **code**, not the title.

| Code | File(s) | Was labeled | Catalog says this number is | Intended course is probably | Confidence |
|---|---|---|---|---|---|
| `MATH 315` | applied-mathematics-bs, math-cs-bs | Real Analysis I | Advanced Topics in Linear Algebra | `MATH 351` (Introduction to Real Analysis I) | high |
| `STAT 338` | statistics-bs | Regression Analysis | Predictive Analytics | `STAT 308` / `STAT 408` | high |
| `COMP 306` | it | Database Administration | Data Mining | `COMP 305` / `COMP 405` | high |
| `MATH 360` | applied-mathematics-bs | Numerical Methods | Introduction to Game Theory | `COMP 409`, or no longer required | medium |
| `STAT 335` | statistics-bs | Probability | Introduction to Biostatistics | `STAT 304` / `STAT 404`. (In the neuroscience & forensic programs `STAT 335` = Biostatistics is CORRECT.) | medium |
| `STAT 336` | statistics-bs | Mathematical Statistics I | Advanced Biostatistics | `STAT 404` — verify | medium |
| `STAT 337` | statistics-bs | Mathematical Statistics II | Quantitative Methods in Bioinformatics | `STAT 405` — verify | medium |
| `STAT 203` | applied-mathematics-bs, math-cs-bs, statistics-bs | Statistics | Introduction to Probability & Statistics | likely just an abbreviation; code probably fine | low |

---

## 2. Course codes NOT in the catalog (verify the number exists)

Used in program data but absent from the scraped catalog course list. These are tracked in
`src/data/course-exceptions.json` (`knownMissingCodes`) so the integrity test passes; each should be
verified and either corrected (likely a renumbered/discontinued course) or confirmed cross-listed.

- `AFR 102`, `FREN 310`, `ITAL 302`, `ITAL 310`, `SPAN 301`, `SPAN 310` — intro/intermediate language & area courses, likely renumbered
- `GLST 100`, `GLST 201`, `WSGS 100`, `WSGS 300` — likely renumbered intro/capstone courses
- `THEO 192`, `THEO 200`, `THEO 201`, `THEO 210`, `THEO 300` — not found among 106 scraped THEO courses (`THEO 300` also has two conflicting titles across files)
- `BIOL 320`, `BIOL 335`, `BIOL 352`, `BIOL 367` — neuroscience programs/minor; `BIOL 335` is cross-listed with `STAT 335`
- `ENVS 332`, `ENVS 364` — business minors; still show placeholder titles (code not in catalog)
- `COMP 599` — graduate course not on the undergraduate index

**Prefixes with no `/course-descriptions/` catalog page** (titles live only in program JSON, exempt
from the integrity check): `FORS`, `FRSC` (Forensic Science), `HSRV` (Human Services).

---

## 3. Catalog typo carried verbatim

- `PSYC 382` — "Behav**o**rial and Cognitive Neuroscience". The misspelling is in the **catalog
  itself**; the verbatim-from-catalog rule carries it as-is. Fix if/when LUC corrects the catalog.

---

## Resolved by the title-normalization pass

These earlier categories were fixed by normalizing all titles to the catalog master list and no
longer appear: empty titles (29, in `shakespeare-studies-minor`), placeholder titles equal to the
code (now only the 2 known-missing `ENVS` codes remain), and thematic group-labels used as titles
(69, in `peace-justice-conflict-studies-minor` and `race-ethnicity-minor`). The thematic grouping is
preserved by each `electiveOptions` group's `label`.

---

## How these were found / how to refresh

See `docs/INGESTION.md`. In short:
`node scripts/fetch-dept-courses.mjs` → `node scripts/normalize-program-courses.mjs` →
`npm test` (the `course integrity` test reports any new drift). Credit-hour discrepancies are
tracked separately in `CREDITS_DISCREPANCIES.md`.
