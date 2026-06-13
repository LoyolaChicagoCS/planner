# Loyola CS Academic Checklist

Mobile-first advising checklist for Loyola University Chicago Computer Science degree and minor planning — undergraduate, graduate, and doctoral.

The app is live at:

https://advising.cs.luc.edu/

## Purpose

This project helps students understand and track progress toward degree and minor requirements in Loyola University Chicago's Computer Science programs, using requirements modeled from the university catalog at `catalog.luc.edu`.

The app is meant to support advising conversations, not replace them. Students can use it to explore degree requirements, check off completed courses, estimate remaining progress, and bring a clearer checklist to meetings with a human advisor.

## Current Scope

The current version targets these undergraduate BS programs administered by the department:

- Computer Science
- Software Engineering
- Information Technology
- Cybersecurity

It also includes these interdisciplinary undergraduate BS programs:

- Bioinformatics
- Data Science

It also includes these undergraduate minors:

- Artificial Intelligence
- Artificial Intelligence and Human Flourishing
- Business of Applied Artificial Intelligence
- Computer Crime and Forensics
- Computer Science
- Information Technology

It also includes these graduate MS programs:

- Computer Science (MS)
- Cybersecurity (MS)
- Information Technology (MS)
- Software Engineering (MS)
- Data Science (MS)

It also includes the doctoral program:

- Computer Science (PhD)

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

## Main Views

The landing page shows a fixed header ("Academic Checklist") with the Loyola Ramblers SVG mark and a build-time version pill. Below the header a tab bar organizes programs into five categories: Majors, Interdisciplinary, Minors, Masters, and Doctoral. Selecting a tab shows only the cards for that category; programs within a tab are alphabetized.

Each selected program has up to five swipeable tabs:

- `Courses`: required courses, elective requirements, and core requirements.
- `Core`: catalog-derived University Core courses, including Tier I/Tier II sections where applicable. Not shown for graduate or doctoral programs.
- `Roadmap`: suggested semester-by-semester plan.
- `Checklist`: remaining courses, AP/transfer items, optional courses, and time-to-completion estimate. Graduate programs use a 9-credit full-time load assumption. The PhD program suppresses the time estimate entirely and shows a Doctoral Milestones section instead (qualifying exam, candidacy, prospectus, defense).
- `Audit`: audit-style progress by requirement category.

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

- Keep checking current curriculum data against `catalog.luc.edu`.
- Add remaining structured alternates where the data still uses plain text notes.
- Replace leftover starter-template files if they are unused.
- Add 4+1 program data when ready.
