# Loyola CS Advising Checklist

Mobile-first advising checklist for Loyola University Chicago Computer Science undergraduate degree and minor planning.

The app is live at:

https://advising.cs.luc.edu/

## Purpose

This project helps students understand and track progress toward undergraduate degree and minor requirements in Loyola University Chicago's Computer Science programs, using requirements modeled from the university catalog at `catalog.luc.edu`.

The app is meant to support advising conversations, not replace them. Students can use it to explore degree requirements, check off completed courses, estimate remaining progress, and bring a clearer checklist to meetings with a human advisor.

## Current Scope

The current version targets these undergraduate BS programs:

- Computer Science
- Software Engineering
- Information Technology
- Cybersecurity
- Data Science

It also includes these undergraduate minors:

- Artificial Intelligence
- Artificial Intelligence and Human Flourishing
- Business of Applied Artificial Intelligence

Graduate programs are not modeled yet. Expected future scope includes graduate programs, 4+1 programs, and the PhD program.

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
- Copy a shareable URL that restores the selected program and checklist state.
- Return later on the same device and keep local progress.

## Advising And Privacy Principles

This is a planning checklist, not an official degree audit and not a replacement for academic advising.

The app should remain privacy-preserving:

- No accounts.
- No backend.
- No analytics or tracking.
- No collection of names, student IDs, IP addresses, or usage data.
- Progress is saved in the browser only.
- Share links encode progress in the URL.

## Progress And Share Links

Progress is represented as a set of stable requirement IDs.

Persistence behavior:

- Local browser storage key: `advising_progress`
- Selected program URL parameter: `?p=<program-id>`
- Completed items URL parameter: `?d=<dot-delimited-ids>`

Example:

```text
https://advising.cs.luc.edu/?p=cs&d=COMP313.CORE_WRITING.MATH161
```

Progress IDs must not contain dots or whitespace because dots delimit share-link IDs. Keep IDs URL-friendly, preferably using letters, numbers, `_`, and `-`.

Old comma-delimited share links are still decoded for backward compatibility.

## Requirement Modeling

Program data lives in `src/data/*.json`.

Each program currently includes:

- `id`
- `name`
- `degree`
- `school`
- `totalCredits` for the catalog roadmap/sample plan total
- `majorCredits` for BS major requirement totals where applicable
- `minorCredits` for minor completion totals where applicable
- `kind` where needed, such as `minor`
- `hasCompletionEstimate` where needed
- `catalogUrl` where useful for traceability
- `courses`
- `electiveOptions`
- `coreRequirements`
- `roadmap`
- `checklist`

Some courses appear in more than one place. For example, a concrete course may appear both in a suggested course list and in an elective option list. Completion for repeated concrete courses is matched by course identity, not just by JSON location.

For BS programs, Loyola requires 120 credits to graduate, but catalog roadmaps may total 120 or 122 credits. Keep `totalCredits` aligned with the catalog roadmap total and use `majorCredits` for the major-only requirement total. This makes it easier for students to compare switching between CS-administered majors. For minors, `totalCredits` and `minorCredits` should reflect the credits required to complete the minor.

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

## Main Views

Each selected program has five swipeable tabs:

- `Courses`: required courses, elective requirements, and core requirements.
- `Core`: catalog-derived University Core courses, including Tier I/Tier II sections where applicable.
- `Roadmap`: suggested semester-by-semester plan.
- `Checklist`: remaining courses, AP/transfer items, optional courses, and time-to-completion estimate.
- `Audit`: audit-style progress by requirement category.

The `Core` tab lets students check the specific Core course they completed while satisfying the program's general Core requirement IDs. For example, checking a catalog course under Historical Tier I satisfies `CORE_HIST1` everywhere else in the app. Include Core categories even when a requirement may commonly be fulfilled by CS, math, statistics, or other program coursework; students still need to see that the Core requirement exists. Students may also quick-check a general Core item from `Courses` or `Roadmap`; that counts immediately, and the row then offers a `Choose specific Core course` action so they can jump to the Core tab and record the actual course later. Students may select more than one course in the same Core area or tier for tracking, but audit and total-credit calculations count each general Core requirement only once.

Search is intentionally available on every program tab. Each tab owns its own search query and filters only the visible rows in that tab; search does not change saved progress or affect other tabs.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Swiper
- ESLint

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
npm run lint
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Deployment

The app deploys to GitHub Pages through `.github/workflows/deploy.yml` on pushes to `main`.

Deployment details:

- GitHub Pages source: GitHub Actions
- Custom domain: `advising.cs.luc.edu`
- `public/CNAME` contains the custom domain.
- The workflow also writes `dist/CNAME` before uploading the Pages artifact.
- `vite.config.js` uses `base: '/'` because the custom domain serves the app from the root.

## Near-Term Follow-Up Ideas

- Keep checking current curriculum data against `catalog.luc.edu`.
- Add remaining structured alternates where the data still uses plain text notes.
- Replace leftover starter-template files if they are unused.
- Add graduate, 4+1, and PhD program data when ready.
