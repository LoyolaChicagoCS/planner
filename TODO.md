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

## 3. Roadmaps blocked by stale course codes

These 5 programs have course data using old codes (CHEM 101 / PHYS 125) that don't match the current catalog (CHEM 160 / PHYS 121). Course data must be updated before roadmaps can be added.

- Biophysics BS
- Theoretical Physics & Applied Math BS
- Forensic Science BS
- Cognitive & Behavioral Neuroscience BS
- Molecular & Cellular Neuroscience BS

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
