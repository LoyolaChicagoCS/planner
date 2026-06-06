# Loyola CS Advising Checklist

Mobile-first advising checklist for Loyola University Chicago Computer Science undergraduate degree planning.

The app is live at:

https://advising.cs.luc.edu/

## Purpose

This project helps students understand and track progress toward undergraduate degree requirements in Loyola University Chicago's Computer Science programs, using requirements modeled from the university catalog at `catalog.luc.edu`.

The app is meant to support advising conversations, not replace them. Students can use it to explore degree requirements, check off completed courses, estimate remaining progress, and bring a clearer checklist to meetings with a human advisor.

## Current Scope

The current version targets these undergraduate BS programs:

- Computer Science
- Software Engineering
- Information Technology
- Cybersecurity
- Data Science

Graduate programs are not modeled yet. Expected future scope includes graduate programs, 4+1 programs, and the PhD program.

## Student-Facing Requirements

The app should let a student:

- Select one of the supported degree programs.
- Review required major courses.
- Review elective, practicum, capstone, and free-elective options.
- Review University Core and CAS-related requirements used in the degree plans.
- Follow a suggested semester-by-semester roadmap.
- Check off completed courses or satisfied requirements.
- See remaining courses and estimated time to completion.
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
- `totalCredits`
- `courses`
- `electiveOptions`
- `coreRequirements`
- `roadmap`
- `checklist`

Some courses appear in more than one place. For example, a concrete course may appear both in a suggested course list and in an elective option list. Completion for repeated concrete courses is matched by course identity, not just by JSON location.

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

## Main Views

Each selected program has four swipeable tabs:

- `Courses`: required courses, elective requirements, and core requirements.
- `Roadmap`: suggested semester-by-semester plan.
- `Checklist`: remaining courses, AP/transfer items, optional courses, and time-to-completion estimate.
- `Audit`: audit-style progress by requirement category.

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
