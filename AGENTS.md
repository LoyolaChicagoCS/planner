# AGENTS.md

## Project Overview

This repository is a Vite + React app for Loyola University Chicago Computer Science advising. It is a mobile-first degree and minor planning tool hosted at:

https://advising.cs.luc.edu/

Students select a BS program or minor and then use swipeable tabs to review courses, roadmaps, checklist items, Core courses where applicable, and an audit-style credit summary. The app is intentionally client-only: it has no backend, no user accounts, and no analytics or personal-data collection.

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

## App Structure

- `src/App.tsx` manages the selected program and keeps the URL in sync.
- `src/hooks/useProgress.ts` stores completion state in `localStorage` and restores shared progress from the `?d=` URL parameter.
- `src/components/HomeScreen.tsx` renders the program picker.
- `src/components/ProgramScreen.tsx` renders the swipeable tabs: Courses, Core when applicable, Roadmap, Checklist, and Audit.
- `src/components/CourseList.jsx` shows major/minor, elective/selection, and core requirements.
- `src/components/CorePlanner.jsx` shows catalog-derived University Core course choices for programs with Core requirements.
- `src/components/SearchBox.tsx` provides the shared per-tab search input.
- `src/components/Roadmap.jsx` shows the semester-by-semester plan.
- `src/components/Checklist.jsx` shows remaining requirements, AP/transfer items, and optional courses.
- `src/components/Audit.jsx` shows category-level credit progress.
- `src/components/Footer.tsx` contains the privacy disclosure.
- `src/types.ts` defines shared program, course, Core, roadmap, and progress types.
- `src/utils/progress.ts` centralizes equivalent-course completion and distinct-credit calculations.
- `src/utils/coreCatalog.ts` maps cached Core catalog courses to general Core requirement IDs.
- `src/utils/search.ts` contains shared search matching helpers.
- `src/utils/*.test.ts` contains model-level tests for progress, Core catalog, and share-link behavior.
- `src/data/*.json` contains program, minor, Core inventory, and optional-course data.

## Data Model Notes

Program data lives in `src/data/*.json`. Each program object should keep this shape:

- `id`
- `name`
- `degree`
- `school`
- `totalCredits`
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

IDs are the app's stable persistence contract. Completion state is stored as a set of IDs, so changing IDs can break saved progress and shared URLs.

Progress IDs must not contain dots or whitespace. Share links use a dot-delimited `?d=` value, and `src/utils/shareLink.ts` validates this rule. Keep IDs URL-friendly, preferably letters, numbers, `_`, and `-`. Old comma-delimited links are still decoded for backward compatibility.

For BS programs, Loyola requires 120 credits to graduate, but catalog roadmaps may total 120 or 122 credits. Keep `totalCredits` aligned with the catalog roadmap/sample-plan total and use `majorCredits` for the major-only requirement total. For minors, `totalCredits` and `minorCredits` should reflect the credits required to complete the minor.

Some concrete courses appear in multiple requirement sections. Shared completion should be based on course identity (`code` + `title`) through `src/utils/progress.ts`, while total audit/checklist/header credits should count each distinct completed course only once.

When one requirement can be satisfied by any one of several courses, give each course a shared `requirementGroup`. The UI should show all concrete course choices separately. The counted course in the group gets the normal completed state, while unchosen siblings or checked non-counting siblings show the yellow alternate-satisfied state. Required-category progress and overall degree-credit totals should count a `requirementGroup` once.

Roadmap items normally refer to course or core IDs through `ref`. Elective roadmap placeholders may use labels and `isElective: true`. Be careful not to conflate fixed course IDs with elective option IDs; some course-like options intentionally have separate IDs.

Optional CS courses are shared from `src/data/optional.json` and are shown for awareness, Writing Intensive, or Core eligibility. They are not counted toward the 120-credit graduation total in the audit.

University Core course inventory is cached in `src/data/coreCourses.json` and is generated by `node scripts/fetch-core-courses.mjs`. Core analysis artifacts are generated by `python3 scripts/write-core-analysis.py`, which writes `CORE-ANALYSIS.md`, `CORE-ANALYSIS.html`, and cached SVG/PNG charts in `docs/core-charts/`. Do not fetch Core catalog data at runtime.

The Core tab maps concrete catalog courses to general Core requirement IDs. Selecting a specific Core course should satisfy the matching general requirement, such as `CORE_HIST1`, while audit and total-credit calculations count each general Core requirement only once. General Core checks from Courses/Roadmap should remain valid and may offer a path to choose the specific Core course later.

Search is intentionally available on every program tab. Each tab owns its own search query and filters only visible rows in that tab.

## Privacy And Persistence

Preserve the privacy model:

- Do not add server calls for progress.
- Do not add analytics or tracking without an explicit product decision.
- Do not collect names, student IDs, IP addresses, or usage data.
- Progress should remain local to the browser and shareable through URL parameters.

The current persistence behavior is:

- `localStorage` key: `advising_progress`
- URL parameter for selected program: `?p=<program-id>`
- URL parameter for completed items: `?d=<dot-delimited-ids>`

## Styling

Use Tailwind utility classes and the custom LUC colors defined in `tailwind.config.js`:

- `maroon`
- `gold`

The interface is intentionally mobile-first, dense, and utilitarian. Keep controls tappable, readable, and consistent with the existing rounded card/list-row style.

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

- Add model-level tests for `src/utils/progress.ts`, `src/utils/shareLink.ts`, and `src/utils/coreCatalog.ts`.
- `src/App.css` appears to be leftover template CSS and is not imported by `src/main.jsx`.
- Continue consolidating credit-counting behavior into shared utilities when changing progress calculations.
