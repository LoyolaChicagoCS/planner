# AGENTS.md

## Project Overview

This repository is a Vite + React app for Loyola University Chicago Computer Science advising. It is a mobile-first degree planning tool hosted at:

https://advising.cs.luc.edu/

Students select a BS program and then use swipeable tabs to review courses, a four-year roadmap, checklist items, and a degree-audit style credit summary. The app is intentionally client-only: it has no backend, no user accounts, and no analytics or personal-data collection.

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 3
- Swiper for the program detail tabs
- ESLint for linting

Use `npm ci` to install dependencies from `package-lock.json`.

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Before committing code changes, run:

```bash
npm run lint
npm run build
```

## App Structure

- `src/App.jsx` imports all degree program JSON files, manages the selected program, and keeps the URL in sync.
- `src/hooks/useProgress.js` stores completion state in `localStorage` and restores shared progress from the `?d=` URL parameter.
- `src/components/HomeScreen.jsx` renders the program picker.
- `src/components/ProgramScreen.jsx` renders the swipeable tabs: Courses, Roadmap, Checklist, and Audit.
- `src/components/CourseList.jsx` shows major, elective, and core requirements.
- `src/components/Roadmap.jsx` shows the semester-by-semester plan.
- `src/components/Checklist.jsx` shows remaining requirements, AP/transfer items, and optional courses.
- `src/components/Audit.jsx` shows category-level credit progress.
- `src/components/Footer.jsx` contains the privacy disclosure.
- `src/utils/progress.js` centralizes equivalent-course completion and distinct-credit calculations.
- `src/data/*.json` contains program and optional-course data.

## Data Model Notes

Program data lives in `src/data/*.json`. Each program object should keep this shape:

- `id`
- `name`
- `degree`
- `school`
- `totalCredits`
- `courses`
- `electiveOptions`
- `coreRequirements`
- `roadmap`
- `checklist`

IDs are the app's stable persistence contract. Completion state is stored as a set of IDs, so changing IDs can break saved progress and shared URLs.

Progress IDs must not contain dots or whitespace. Share links use a dot-delimited `?d=` value, and `src/utils/shareLink.js` validates this rule. Keep IDs URL-friendly, preferably letters, numbers, `_`, and `-`.

Some concrete courses appear in multiple requirement sections. Shared completion should be based on course identity (`code` + `title`) through `src/utils/progress.js`, while total audit/checklist/header credits should count each distinct completed course only once.

When one requirement can be satisfied by any one of several courses, give each course a shared `requirementGroup`. The UI should show all concrete course choices separately. The counted course in the group gets the normal completed state, while unchosen siblings or checked non-counting siblings show the yellow alternate-satisfied state. Required-category progress and overall degree-credit totals should count a `requirementGroup` once.

Roadmap items normally refer to course or core IDs through `ref`. Elective roadmap placeholders may use labels and `isElective: true`. Be careful not to conflate fixed course IDs with elective option IDs; some course-like options intentionally have separate IDs.

Optional CS courses are shared from `src/data/optional.json` and are shown for awareness, Writing Intensive, or Core eligibility. They are not counted toward the 120-credit graduation total in the audit.

## Privacy And Persistence

Preserve the privacy model:

- Do not add server calls for progress.
- Do not add analytics or tracking without an explicit product decision.
- Do not collect names, student IDs, IP addresses, or usage data.
- Progress should remain local to the browser and shareable through URL parameters.

The current persistence behavior is:

- `localStorage` key: `advising_progress`
- URL parameter for selected program: `?p=<program-id>`
- URL parameter for completed items: `?d=<comma-separated-ids>`

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

- `README.md` is still the default Vite template and should be replaced with project-specific documentation.
- `src/App.css` appears to be leftover template CSS and is not imported by `src/main.jsx`.
- Credit-counting logic appears in multiple components. Keep behavior consistent if changing degree-progress calculations.
