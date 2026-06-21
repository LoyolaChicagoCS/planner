/**
 * Program manifest — the single committed seed for the program-ingestion pipeline.
 *
 * Enumerates every academic program the app ingests. `scripts/fetch-program.mjs`,
 * `scripts/build-programs.mjs`, and `src/utils/programIntegrity.test.ts` all derive
 * the program set from this list. Everything else in a program's JSON is regenerated
 * from the catalog (deterministic extract) + AI overlay + committed supplement.
 *
 * One entry per program:
 *   id                  filename stem == Program.id (e.g. "psychology-bs")
 *   catalogUrl          the catalog page to scrape
 *   name, degree        Program.name / Program.degree
 *   department, school  Program.department / Program.school (school defaults to LUC)
 *   kind                "minor" | "interdisciplinary" | "masters" | "phd" | omit for a plain major
 *   creditsField        which *Credits field carries the program-requirement total
 *                       ("majorCredits" | "minorCredits" | "mastersCredits" | "phdCredits")
 *   totalCreditsOverride the degree total when it is not derivable from the page
 *                       (undergrad total = major + University Core, which the page does not sum)
 *   coursePrefixes      expected subject prefixes (sanity filter for elective pools)
 *   skipRoadmap         true when the catalog page has no Plan of Study Grid
 *
 * This pass seeds the 4 pilot programs; later waves append the rest.
 */

const LUC = 'Loyola University Chicago';

export const PROGRAMS_MANIFEST = [
  // ---- CS department (primary programs) ----
  {
    id: 'cs',
    catalogUrl: 'https://catalog.luc.edu/undergraduate/arts-sciences/computer-science/computer-science-bs/',
    name: 'Computer Science',
    degree: 'BS',
    department: 'Computer Science',
    creditsField: 'majorCredits',
    totalCreditsOverride: 122,
    coursePrefixes: ['COMP', 'MATH'],
    generated: true, // adopted: build output is the committed src/data/cs.json (drift-guarded)
  },

  // ---- CAS minor ----
  {
    id: 'psychology-minor',
    catalogUrl: 'https://catalog.luc.edu/undergraduate/arts-sciences/psychology/psychology-minor/',
    name: 'Psychology',
    degree: 'Minor',
    department: 'Psychology',
    kind: 'minor',
    creditsField: 'minorCredits',
    coursePrefixes: ['PSYC', 'NEUR'],
    skipRoadmap: true, // page has no Plan of Study Grid
    generated: true, // adopted: drift-guarded
  },

  // ---- CS graduate ----
  {
    id: 'ms-cs',
    catalogUrl: 'https://catalog.luc.edu/graduate-professional/graduate-school/arts-sciences/computer-science/computer-science-ms/',
    name: 'Computer Science',
    degree: 'MS',
    department: 'Computer Science',
    kind: 'masters',
    creditsField: 'mastersCredits',
    totalCreditsOverride: 43,
    coursePrefixes: ['COMP'],
    generated: true, // adopted: structure overlay (concentration tracks) + supplement, drift-guarded
  },

  // ---- CS doctoral ----
  {
    id: 'phd-cs',
    catalogUrl: 'https://catalog.luc.edu/graduate-professional/graduate-school/arts-sciences/computer-science/computer-science-phd/',
    name: 'Computer Science',
    degree: 'PhD',
    department: 'Computer Science',
    kind: 'phd',
    creditsField: 'phdCredits',
    totalCreditsOverride: 60,
    coursePrefixes: ['COMP'],
    generated: true, // adopted: structure overlay + supplement (roadmap/milestones), drift-guarded
  },
];

/** Fill defaults (school) so consumers can rely on every field. */
export function manifestEntry(id) {
  const e = PROGRAMS_MANIFEST.find(p => p.id === id);
  if (!e) return null;
  return { school: LUC, ...e };
}

export const MANIFEST_BY_ID = Object.fromEntries(
  PROGRAMS_MANIFEST.map(e => [e.id, { school: LUC, ...e }]),
);
