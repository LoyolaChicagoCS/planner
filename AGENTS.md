# AGENTS.md

## Project Overview

This repository is a Vite + React app for Loyola University Chicago Computer Science advising. It is a mobile-first degree and minor planning tool hosted at:

https://advising.cs.luc.edu/

Students select a CS-department BS, MS, or PhD program (or minor) as their primary program, then optionally add additional majors or minors from CAS, the School of Communication, or the Quinlan School of Business. Swipeable tabs show courses, roadmaps, checklist items, Core courses where applicable, and an audit-style credit summary that combines progress across all selected programs. The app is intentionally client-only: it has no backend, no user accounts, and no analytics or personal-data collection.

## Tech Stack

- React 19
- Vite 8
- TypeScript for shared model and utility contracts
- Tailwind CSS 3
- Swiper for the program detail tabs
- ESLint for linting

Use `npm ci` to install dependencies from `package-lock.json`.

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run preview
```

Before committing code changes, run:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Versioning

The home-screen version pill is injected by `vite.config.js` from the latest Git tag using `git describe --tags --abbrev=0`. If no tag exists, the build falls back to `package.json` and displays a compact `v<major>.<minor>` style when the patch version is `.0`. Keep `package.json`/`package-lock.json` on valid semver, and create/push a matching Git tag for releases.

## App Structure

- `src/App.tsx` manages the selected program, the `additionalPrograms` array, and keeps the URL in sync (`?p=`, `?m=`, `?d=`).
- `src/main.tsx` mounts the React app.
- `src/hooks/useProgress.ts` stores completion state in `localStorage` and restores shared progress from the `?d=` URL parameter.
- `src/components/HomeScreen.tsx` renders the category tab bar (Majors, Interdisciplinary, Minors, Masters, Doctoral) and the program card list for the selected tab.
- `src/components/ProgramScreen.tsx` renders the swipeable tabs (Roadmap → Courses → Core → Checklist → Audit), compact two-row program header, program-level controls, and share actions. Passes `additionalPrograms` and `toggle` to `CourseList`, `Checklist`, and `Audit`.
- `src/components/ProgramPicker.tsx` modal for browsing and adding additional majors and minors. Grouped by department. Excludes the active CS program, graduate/doctoral programs, and non-minor CS-department programs.
- `src/components/CourseList.tsx` shows major/minor, elective/selection, and core requirements. Renders additional programs via `AdditionalProgramCourseSection` sub-component at the bottom.
- `src/components/CorePlanner.tsx` shows catalog-derived University Core course choices for programs with Core requirements.
- `src/components/SearchBox.tsx` provides the shared per-tab search input.
- `src/components/Roadmap.tsx` shows the semester-by-semester plan.
- `src/components/Checklist.tsx` shows remaining requirements, AP/transfer items, optional courses, and doctoral milestones for PhD programs. Renders additional programs via `AdditionalProgramChecklist` sub-component at the bottom.
- `src/components/Audit.tsx` shows category-level credit progress. Renders each additional program as a separate card with a Remove button via `AdditionalProgramAudit` sub-component, plus a standalone "+ Add Additional Major or Minor" button.
- `src/components/Footer.tsx` contains the privacy disclosure.
- `src/types.ts` defines shared program, course, Core, roadmap, and progress types.
- `src/utils/progress.ts` centralizes equivalent-course completion, distinct-credit calculations, and `createProgressHelpers(program, completed, toggle)` used by additional-program sub-components.
- `src/utils/coreCatalog.ts` maps cached Core catalog courses to general Core requirement IDs.
- `src/utils/search.ts` contains shared search matching helpers.
- `src/utils/*.test.ts` contains model-level tests for progress, Core catalog, and share-link behavior.
- `src/assets/loyola-ramblers-logo.svg` contains the Loyola SVG mark used in landing and program headers.
- `src/data/*.json` contains program, minor, Core inventory, and optional-course data.

## Data Model Notes

Program data lives in `src/data/*.json`. Each program object should keep this shape:

- `id`
- `name`
- `degree`
- `department` — identifies the owning department. `"Computer Science"` for all CS-department programs (used to exclude them from additional-program picker except when `kind === 'minor'`). `"Business Administration"` for Quinlan BBA programs. `"Communication"` for School of Communication programs. Omit entirely for CAS programs. The `ProgramPicker` filter logic reads this field.
- `school`
- `totalCredits`
- `majorCredits` for BS major requirement totals where applicable
- `minorCredits` for minor completion totals where applicable
- `mastersCredits` for MS required-coursework totals (excluding foundation credits that may be waived)
- `phdCredits` for PhD required-coursework totals (excluding dissertation credits)
- `kind` where needed, such as `minor`, `masters`, or `phd`
- `hasCompletionEstimate` where needed
- `catalogUrl` where useful for traceability
- `courses`
- `electiveOptions`
- `coreRequirements`
- `roadmap`
- `checklist`

IDs are the app's stable persistence contract. Completion state is stored as a set of IDs, so changing IDs can break saved progress and shared URLs.

Progress IDs must not contain dots or whitespace. Share links use a dot-delimited `?d=` value, and `src/utils/shareLink.ts` validates this rule. Keep IDs URL-friendly, preferably letters, numbers, `_`, and `-`. Old comma-delimited links are still decoded for backward compatibility.

For CS-department BS programs, Loyola requires 120 credits to graduate, but catalog roadmaps may total 120 or 122 credits. Keep `totalCredits` aligned with the catalog roadmap/sample-plan total and use `majorCredits` for the major-only requirement total. For minors, `totalCredits` and `minorCredits` should reflect the credits required to complete the minor. For MS programs, `totalCredits` is the full program credit count (including any foundation courses) and `mastersCredits` is the required-coursework subset used for the Graduate Credits progress bar. For the PhD program, `totalCredits` is 60 and `phdCredits` is 39 (coursework only, excluding 21 dissertation credits); set `hasCompletionEstimate: false` since doctoral timelines are not estimable by credit count.

For BBA programs (Quinlan School of Business), `totalCredits` is the catalog-listed program total (typically 75–84 credits), **not** 120. BBA programs have a structured curriculum and do not have the same elective-heavy makeup as BS programs. Use `majorCredits` for the concentration-specific requirement total (the credits beyond the shared business core). All BBA programs share the same business core course IDs (e.g. `ACCT201`, `ECON201biz`, `MGMT201`, `FINC301`), so marking a business core course complete in any BBA program marks it across all others — this is intentional and correct.

For CAS BA/BS programs used as additional majors, `totalCredits` and `majorCredits` reflect catalog major requirements. These programs do not have `roadmap`, `checklist`, or `coreRequirements` sections; only `courses` and `electiveOptions` are required for the additional-program feature.

Some concrete courses appear in multiple requirement sections. Shared completion should be based on course identity (`code` + `title`) through `src/utils/progress.ts`, while total audit/checklist/header credits should count each distinct completed course only once.

When one requirement can be satisfied by any one of several courses, give each course a shared `requirementGroup`. The UI should show all concrete course choices separately. The counted course in the group gets the normal completed state, while unchosen siblings or checked non-counting siblings show the yellow alternate-satisfied state. Required-category progress and overall degree-credit totals should count a `requirementGroup` once.

Roadmap items normally refer to course or core IDs through `ref`. Elective roadmap placeholders may use labels and `isElective: true`. Be careful not to conflate fixed course IDs with elective option IDs; some course-like options intentionally have separate IDs.

Doctoral milestone checklist items use `category: 'milestone'` and `credits: 0`. They are rendered as a separate "Doctoral Milestones" section in the Checklist tab and are tracked by ID in the shared progress set like any other item. They are only shown when `program.kind === 'phd'`.

Optional CS courses are shared from `src/data/optional.json` and are shown for awareness, Writing Intensive, or Core eligibility. They are not counted toward the 120-credit graduation total in the audit. Optional courses are suppressed for `kind === 'masters'` and `kind === 'phd'` programs.

University Core course inventory is cached in `src/data/coreCourses.json` and is generated by `node scripts/fetch-core-courses.mjs`. Core analysis artifacts are generated by `python3 scripts/write-core-analysis.py`, which writes `CORE-ANALYSIS.md`, `CORE-ANALYSIS.html`, and cached SVG/PNG charts in `docs/core-charts/`. Do not fetch Core catalog data at runtime.

The Core tab maps concrete catalog courses to general Core requirement IDs. Selecting a specific Core course should satisfy the matching general requirement, such as `CORE_HIST1`, while audit and total-credit calculations count each general Core requirement only once. General Core checks from Courses/Roadmap should remain valid and may offer a path to choose the specific Core course later.

Search is intentionally available on every program tab. Each tab owns its own search query and filters only visible rows in that tab.

## Additional Major / Minor Feature

Students can add majors and minors from outside the CS department. These are tracked in the `additionalPrograms: Program[]` state in `App.tsx`. The primary CS-department program is never part of this array. Progress is not split per program — there is a single global `completed: Set<string>` shared across the primary and all additional programs, so the same course ID marked complete anywhere counts everywhere.

`createProgressHelpers(program, completed, toggle)` in `src/utils/progress.ts` returns per-program helpers (`isCompleted`, `isRequirementSatisfied`, `getRequirementStatus`, `toggleItem`) and is called once per program inside each additional-program sub-component. It does not mutate state; `toggleItem` calls the same `toggle` function that was passed in.

The `ProgramPicker` filter excludes the active program, graduate/doctoral programs (`kind === 'masters'` or `kind === 'phd'`), and CS-department non-minor programs (programs where `department === 'Computer Science'` and `kind !== 'minor'`). CS minors (e.g. AI Minor) are included so a CS student can track a second minor. CAS, Communication, and Business programs all pass through this filter.

When an `electiveOptions` group has a `note` but no `courses` array (common for CAS programs that list elective pools as catalog text), `AuditCategory` renders the note text rather than an empty "Choose courses from the elective list above" prompt. This is the expected display for note-only elective groups.

## Privacy And Persistence

Preserve the privacy model:

- Do not add server calls for progress.
- Do not add analytics or tracking without an explicit product decision.
- Do not collect names, student IDs, IP addresses, or usage data.
- Progress should remain local to the browser and shareable through URL parameters.
- Advisor email sharing should use the same URL-encoded progress model and must not send progress to a server.

The current persistence behavior is:

- `localStorage` key: `advising_progress` — comma-delimited completed course/item IDs
- `localStorage` key: `advising_additional` — comma-delimited additional program IDs
- URL parameter for selected program: `?p=<program-id>`
- URL parameter for additional programs: `?m=<dot-delimited-program-ids>`
- URL parameter for completed items: `?d=<dot-delimited-ids>`

If `?m=` is absent (old share links), no additional programs are loaded. This keeps all existing share links backward compatible.

## Styling

Use Tailwind utility classes and the custom LUC colors defined in `tailwind.config.js`:

- `maroon`
- `gold`

The interface is intentionally mobile-first, dense, and utilitarian. Keep controls tappable, readable, and consistent with the existing rounded card/list-row style.

Program pages use a compact top bar where the title and actions stay on the first row, while degree/roadmap/major-credit metadata lives on a second row to avoid collisions with Share, Email, Clear, and the progress pill.

Use `src/assets/loyola-ramblers-logo.svg` as the Loyola mark in small header badges. Keep it as an SVG asset through Vite rather than replacing it with a raster image.

## Deployment

The app deploys to GitHub Pages through `.github/workflows/deploy.yml` on pushes to `main`.

Deployment details:

- GitHub Pages source should be set to GitHub Actions.
- Custom domain: `advising.cs.luc.edu`
- `public/CNAME` contains the custom domain so local Vite builds copy it into `dist/CNAME`.
- The workflow also writes `dist/CNAME` before uploading the Pages artifact.
- `vite.config.js` uses `base: '/'` because the app is served from the custom domain root.

Do not change Vite `base` back to `/planner/` unless the app is moved off the custom domain and back to the repository subpath.

## Known Cleanup Opportunities

- `src/App.css` appears to be leftover template CSS and is not imported by `src/main.tsx`.
- Continue consolidating credit-counting behavior into shared utilities when changing progress calculations.
- The `kind` field in `types.ts` is typed as `string` (open union). Consider tightening to a literal union (`'minor' | 'masters' | 'phd' | 'interdisciplinary'`) once all program kinds are stable.
