# TODO

## 1. Minors — None exist yet outside CS

The Minors tabs for CAS, Business, and Communication are all empty. Need to add programs with `"kind": "minor"` for each school.

### CAS minors to add
- Biology, Chemistry, Physics, Mathematics, Statistics
- History, Philosophy, Sociology, Psychology, Political Science
- English, French, Spanish, Italian, Classics
- Theology, Religious Studies, Women's Studies
- Fine Arts, Theatre, Dance, Music
- African Studies, Anthropology, Criminal Justice, Global Studies

### Business minors to add
- Accounting, Finance, Entrepreneurship, Marketing, Management, Supply Chain, International Business, Information Systems

### Communication minors to add
- Advertising, Journalism, Communication Studies, Film & Media, Sports Media

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

- `minorCredits` field is missing on some programs — the card falls back to `totalCredits`, which may be wrong for minors
- History BA, Philosophy BA, Theology BA, Religious Studies BA roadmaps have 0 tracked `ref` items (all `isElective`) — could be improved once course IDs are verified against catalog
