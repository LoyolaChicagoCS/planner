# Loyola CS Academic Checklist

Mobile-first advising checklist for Loyola University Chicago Computer Science degree and minor planning — undergraduate, graduate, and doctoral — with support for tracking additional majors and minors from across the university.

The app is live at:

https://advising.cs.luc.edu/

## Purpose

This project helps students understand and track progress toward degree and minor requirements in Loyola University Chicago's Computer Science programs, using requirements modeled from the university catalog at `catalog.luc.edu`.

The app is meant to support advising conversations, not replace them. Students can use it to explore degree requirements, check off completed courses, estimate remaining progress, and bring a clearer checklist to meetings with a human advisor.

CS is always the primary program. Students can optionally add additional majors or minors from any department — CAS, Communication, or Business — and the Audit tab will show combined progress toward all selected programs simultaneously, deduplicating shared courses across them.

## Current Scope

### Computer Science Department (primary programs)

Undergraduate BS majors:
- Computer Science
- Software Engineering
- Information Technology
- Cybersecurity

Interdisciplinary undergraduate BS:
- Bioinformatics
- Data Science

Undergraduate minors:
- Artificial Intelligence
- Artificial Intelligence and Human Flourishing
- Business of Applied Artificial Intelligence
- Computer Crime and Forensics
- Computer Science
- Information Technology

Graduate MS programs:
- Computer Science (MS)
- Cybersecurity (MS)
- Information Technology (MS)
- Software Engineering (MS)
- Data Science (MS)

Doctoral:
- Computer Science (PhD)

### College of Arts and Sciences (additional majors and minors)

All CAS undergraduate majors are supported as additional programs, spanning: African Studies, Anthropology (BA and BS), Biochemistry (BA and BS), Biology, Chemistry (BA and BS), Classical Civilization, Criminal Justice, Dance, Economics, English, Fine Arts (Art History, Music, Photography/Video Art, Sculpture/Ceramics, Studio Arts, Theatre, Visual Communication), Forensic Science, French, Global Studies, History, Human Services, Italian Studies, Latin, Mathematics (BS, Applied, Statistics, Math+CS), Neuroscience (Cognitive/Behavioral and Molecular/Cellular), Philosophy, Physics (BS, Biophysics, Theoretical Physics/Applied Math), Political Science, Psychology, Religious Studies, Sociology, Sociology-Anthropology, Spanish, Theology, and Women's Studies and Gender Studies.

CAS **minors** are also supported (~60), covering the sciences, mathematics/statistics, humanities, social sciences, modern languages, fine and performing arts, and interdisciplinary area-studies programs. Minors appear under each discipline in the Arts & Sciences → Minors tab.

### School of Communication (additional majors and minors)

- Advertising and Public Relations (BA)
- Advertising Creative (BA)
- Communication Studies (BA)
- Film and Digital Media: Production Track (BA)
- Multimedia Journalism (BA)
- Public Communication and Advocacy (BA)
- Sports Media (BA)

School of Communication **minors** are supported as well: Advertising, Advocacy and Social Change, Communication Studies, Digital Media, Environmental Communication, Film and Digital Media, Multimedia Journalism, Professional Communication, and Public Relations.

### Quinlan School of Business (additional majors and minors)

- Accounting (BBA)
- Accounting and Analytics (BBA)
- Economics (BBA)
- Entrepreneurship (BBA)
- Finance (BBA)
- Human Resource Management (BBA)
- Information Systems and Analytics (BBA)
- International Business (BBA)
- Management (BBA)
- Marketing (BBA)
- Sport Management (BBA)
- Supply Chain Management (BBA)

Quinlan **minors** are supported as well: Accounting Information Systems, Business Administration, Economics, Entrepreneurship, Finance, Human Resource and Employment Relations, Information Systems, International Business, Management, Marketing, Nonprofit Management, Sport Management, Supply Chain Management, and Sustainability Management.

## Student-Facing Requirements

The app should let a student:

- Select one of the supported degree or minor programs.
- Review required major courses.
- Review elective, practicum, capstone, and free-elective options.
- Review University Core and CAS-related requirements used in the degree plans.
- Follow a suggested semester-by-semester roadmap.
- Check off completed courses or satisfied requirements.
- See remaining courses. Degree programs also show estimated time to completion; minors intentionally do not.
- See an audit-style summary of completed and remaining credits by category.
- Copy a shareable URL or open a prefilled advisor email that restores the selected program and checklist state.
- Return later on the same device and keep local progress.

## Advising And Privacy Principles

This is a planning checklist, not an official degree audit and not a replacement for academic advising.

The app should remain privacy-preserving:

- No accounts.
- No backend.
- No analytics or tracking.
- No collection of names, student IDs, IP addresses, or usage data.
- Progress is saved in the browser only.
- Share links and advisor emails encode progress in the URL.

## Progress And Share Links

Progress is represented as a set of stable requirement IDs.

Persistence behavior:

- Local browser storage key: `advising_progress` — completed course IDs
- Local browser storage key: `advising_additional` — comma-separated IDs of additional programs
- Selected program URL parameter: `?p=<program-id>`
- Additional programs URL parameter: `?m=<dot-delimited-program-ids>`
- Completed items URL parameter: `?d=<dot-delimited-ids>`

Example (CS primary, Mathematics and Philosophy as additional programs):

```text
https://advising.cs.luc.edu/?p=cs&m=math-bs.philosophy-ba&d=COMP313.CORE_WRITING.MATH161
```

Progress IDs must not contain dots or whitespace because dots delimit share-link IDs. Keep IDs URL-friendly, preferably using letters, numbers, `_`, and `-`.

Old comma-delimited share links are still decoded for backward compatibility. If the `?m=` parameter is absent (old links), no additional programs are restored.

## Requirement Modeling

Program data lives in `src/data/*.json`.

Each program currently includes:

- `id`
- `name`
- `degree`
- `department` — owning department; `"Computer Science"` for all CS-department programs, `"Business Administration"` for Quinlan programs, `"Communication"` for Communication programs, and the discipline name (e.g. `"Biology"`, `"Modern Languages and Literatures"`) for CAS programs. Drives both the ProgramPicker filter and the per-discipline grouping on the home screen, so CAS programs that share a discipline group together. The exact same string must be used by a major and its minor so they sit under one heading.
- `school`
- `totalCredits` for the catalog roadmap/sample plan total
- `majorCredits` for BS major requirement totals where applicable
- `minorCredits` for minor completion totals where applicable
- `mastersCredits` for MS required-coursework totals where applicable
- `phdCredits` for PhD required-coursework totals (excluding dissertation credits) where applicable
- `kind` where needed, such as `minor`, `masters`, or `phd`
- `hasCompletionEstimate` where needed
- `catalogUrl` where useful for traceability
- `courses`
- `electiveOptions`
- `coreRequirements`
- `roadmap`
- `checklist`

Some courses appear in more than one place. For example, a concrete course may appear both in a suggested course list and in an elective option list. Completion for repeated concrete courses is matched by course identity, not just by JSON location.

For BS programs, Loyola requires 120 credits to graduate, but catalog roadmaps may total 120 or 122 credits. Keep `totalCredits` aligned with the catalog roadmap total and use `majorCredits` for the major-only requirement total. This makes it easier for students to compare switching between CS-administered majors. For minors, `totalCredits` and `minorCredits` should reflect the credits required to complete the minor. For MS programs, `totalCredits` is the full program credit count (including any foundation courses) and `mastersCredits` is the required-coursework subset used for the Graduate Credits progress bar. For the PhD program, `totalCredits` is 60 (the full doctoral credit requirement including dissertation) and `phdCredits` is 39 (the coursework-only goal shown in the Doctoral Credits progress bar).

Some requirements can be satisfied by one of several courses. These use a shared `requirementGroup`. The UI shows all concrete choices separately:

- The counted completed course uses the normal completed state.
- A sibling course satisfied by another choice uses the yellow alternate-satisfied state.
- Requirement-category progress counts the group once.
- Overall degree progress also counts a requirement group once.

Examples currently modeled include:

- CS: `COMP 310` or `COMP 362`
- CS: `MATH 131` or `MATH 161`
- CS: `MATH 132` or `MATH 162`
- SE and Cybersecurity: `MATH 131` or `MATH 161`

University Core course inventory lives in `src/data/coreCourses.json`. It is generated from the official catalog Core Area pages by:

```bash
node scripts/fetch-core-courses.mjs
```

The Core analysis document and department-code histogram charts are regenerated from that JSON by:

```bash
python3 scripts/write-core-analysis.py
```

That script writes `CORE-ANALYSIS.md`, a local-viewable `CORE-ANALYSIS.html`, plus cached SVG and PNG charts in `docs/core-charts/`. PNG rendering uses the first available local renderer from `rsvg-convert`, ImageMagick's `magick`, or macOS `sips`.

The inventory is grouped by Core Area and by catalog section, such as Foundational/Tier I and Tier II. Many catalog tables list requirement hours on the group row rather than explicit hours on each course row. For this application inventory, blank course-level hours default to 3 credits; explicit catalog row values, such as UCWR 109 at 6 credits, are preserved.

The Core changes infrequently, so the catalog-derived results are intentionally cached in the repository. Do not fetch the catalog at runtime in the app. When the Core catalog changes, refresh the cache with:

```bash
node scripts/fetch-core-courses.mjs
python3 scripts/write-core-analysis.py
npm run typecheck
npm test
npm run lint
npm run build
```

Then review and commit the generated changes together:

- `src/data/coreCourses.json`
- `CORE-ANALYSIS.md`
- `CORE-ANALYSIS.html`
- `docs/core-charts/*.svg`
- `docs/core-charts/*.png`

If Loyola changes Core Area names, requirement structure, catalog URLs, or required credit counts, update the area metadata in `scripts/fetch-core-courses.mjs` before regenerating the cache.

## Reproducible Data Pipeline

All course and program data is reproducible from the catalog by committed scripts — nothing in `src/data/*.json` is meant to be hand-typed. The catalog (`catalog.luc.edu`) is the single source of truth, and a course number always maps to exactly one title. Full details are in [`docs/INGESTION.md`](docs/INGESTION.md); the pieces are:

- **Master course list.** `node scripts/fetch-dept-courses.mjs` scrapes `catalog.luc.edu/course-descriptions/<dept>/` for every department and writes the per-department `src/data/dept-courses/<DEPT>.json` plus the flat all-departments map `src/data/course-index.json` (`code → {title, credits}`).
- **Title normalization.** `node scripts/normalize-program-courses.mjs` rewrites every program's course titles to match `course-index.json`, so no two files disagree on a course name. `src/utils/courseIntegrity.test.ts` fails the build on any drift; documented exceptions live in `src/data/course-exceptions.json`.
- **Program ingestion.** Academic programs are generated, not hand-edited, from four committed layers — a seed manifest (`scripts/program-manifest.mjs`), a deterministic catalog scrape (`scripts/fetch-program.mjs` → `src/data/program-extracts/`), an AI overlay for fuzzy requirement semantics (`src/data/program-refine/`), and a supplement for non-catalog data such as AP/transfer items and doctoral milestones (`src/data/program-supplements/`). `scripts/build-programs.mjs` merges them into `src/data/<id>.json`.
- **Drift guard.** A manifest entry with `generated: true` is *adopted*: `npm run check:programs` regenerates it and fails if it doesn't byte-match the committed file, so adopted programs must be changed through the pipeline, not by hand. Migration runs in waves; entries without the flag are legacy files awaiting migration. `src/utils/programIntegrity.test.ts` additionally checks manifest↔registry sync, roadmap-ref resolution, and credit sanity.

Data-quality findings surfaced by the pipeline are tracked in `LIKELY_WRONG.md` (suspect course numbers) and `CREDITS_DISCREPANCIES.md` (catalog-vs-data credit-hour mismatches).

## Main Views

The landing page shows a fixed header ("Academic Checklist") with the Loyola Ramblers SVG mark and a build-time version pill. Below the header a tab bar organizes programs into five categories: Majors, Interdisciplinary, Minors, Masters, and Doctoral. Selecting a tab shows only the cards for that category; programs within a tab are alphabetized.

Each selected program has up to five swipeable tabs in this order:

1. `Roadmap`: suggested semester-by-semester plan.
2. `Courses`: required courses, elective requirements, and core requirements. If additional programs have been added, each appears as an extra section below the primary program's courses.
3. `Core`: catalog-derived University Core courses, including Tier I/Tier II sections where applicable. Not shown for graduate or doctoral programs.
4. `Checklist`: remaining courses, AP/transfer items, optional courses, and time-to-completion estimate. Graduate programs use a 9-credit full-time load assumption. The PhD program suppresses the time estimate entirely and shows a Doctoral Milestones section instead (qualifying exam, candidacy, prospectus, defense). Additional programs each appear as a section below the primary program's checklist.
5. `Audit`: audit-style progress by requirement category. Additional programs each appear as a separate progress card below the primary program's audit categories, with a Remove button to deselect the additional program and a standalone "+ Add Additional Major or Minor" button at the bottom of the tab.

Program pages use a compact top bar with the Loyola SVG mark next to the program name. Program actions stay on the first row: copy share link, open prefilled advisor email, clear selected progress, and the credit-progress pill. Degree/roadmap/major-credit metadata is intentionally rendered on a second row so long labels do not collide with the action controls on mobile.

The `Core` tab lets students check the specific Core course they completed while satisfying the program's general Core requirement IDs. For example, checking a catalog course under Historical Tier I satisfies `CORE_HIST1` everywhere else in the app. Include Core categories even when a requirement may commonly be fulfilled by CS, math, statistics, or other program coursework; students still need to see that the Core requirement exists. Students may also quick-check a general Core item from `Courses` or `Roadmap`; that counts immediately, and the row then offers a `Choose specific Core course` action so they can jump to the Core tab and record the actual course later. Students may select more than one course in the same Core area or tier for tracking, but audit and total-credit calculations count each general Core requirement only once.

Search is intentionally available on every program tab. Each tab owns its own search query and filters only the visible rows in that tab; search does not change saved progress or affect other tabs.

## Tech Stack

- React
- Vite
- TypeScript for shared model and utility contracts
- Tailwind CSS
- Swiper
- ESLint

The Loyola brand mark is stored as a vector asset at `src/assets/loyola-ramblers-logo.svg`. It is imported by React components through Vite's asset pipeline and should remain SVG rather than rasterized so it scales cleanly in small header badges.

## Local Development

Install dependencies:

```bash
npm ci
```

Start the local dev server:

```bash
npm run dev
```

Validate before committing:

```bash
npm run typecheck
npm test
npm run check:programs   # generated programs are byte-reproducible from the pipeline
npm run lint
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Versioning

The visible version pill is injected at build time from the latest Git tag:

```bash
git describe --tags --abbrev=0
```

If no tag exists in a local checkout, Vite falls back to the version in `package.json` and displays it in compact form, such as `v0.9` for package version `0.9.0`.

For releases, keep `package.json` and `package-lock.json` on semver, then follow this order exactly — the tag must exist on the remote before the deploy build runs:

```bash
# 1. Bump the version
npm version 1.1.0 --no-git-tag-version

# 2. Commit the version bump
git add package.json package-lock.json
git commit -m "Release v1.1.0"

# 3. Tag and push the tag first
git tag v1.1
git push origin v1.1

# 4. Push main — this triggers the deploy, which reads the tag
git push
```

The Actions workflow only triggers on pushes to `main`, not on tag pushes. The tag is read by `git describe --tags --abbrev=0` at build time to populate the version pill. If you push to `main` before pushing the tag, the previous tag will appear in the pill. Push the tag first to avoid a retrigger commit.

## Deployment

The app deploys to GitHub Pages through `.github/workflows/deploy.yml` on pushes to `main`.

Deployment details:

- GitHub Pages source: GitHub Actions
- Custom domain: `advising.cs.luc.edu`
- `public/CNAME` contains the custom domain.
- The workflow also writes `dist/CNAME` before uploading the Pages artifact.
- `vite.config.js` uses `base: '/'` because the custom domain serves the app from the root.

## Near-Term Follow-Up Ideas

- Continue the program-ingestion rollout wave by wave (CAS majors → CAS minors → Communication → Business), flipping each program to `generated: true` once its regenerated output matches the catalog. The pilot (`cs`, `psychology-minor`, `ms-cs`, `phd-cs`) is adopted.
- Work through `LIKELY_WRONG.md` (suspect course numbers) and `CREDITS_DISCREPANCIES.md`.
- Add remaining structured alternates where the data still uses plain text notes.
- Add 4+1 program data when ready.
