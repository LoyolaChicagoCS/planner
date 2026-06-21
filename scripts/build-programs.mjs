/**
 * Build final program JSON (src/data/<id>.json) from committed inputs:
 *   manifest (scripts/program-manifest.mjs)
 *   + deterministic extract (src/data/program-extracts/<id>.json)
 *   + optional AI overlay     (src/data/program-refine/<id>.json)
 *   + optional supplement     (src/data/program-supplements/<id>.json)
 *
 * This is the ONLY writer of src/data/<id>.json. Each layer owns disjoint fields
 * (see docs/INGESTION.md); the merge precedence is extract -> overlay -> supplement.
 * Output is byte-stable (fixed field order, sorted keys) so re-runs are diff-free,
 * which is what the programIntegrity drift guard asserts.
 *
 * Usage:
 *   node scripts/build-programs.mjs                 # build all manifest programs into src/data/
 *   node scripts/build-programs.mjs cs ms-cs        # build specific ids
 *   node scripts/build-programs.mjs --out /tmp/x    # write to a scratch dir (pilot diffing)
 *   node scripts/build-programs.mjs --check         # regenerate in memory, fail on drift
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { PROGRAMS_MANIFEST, MANIFEST_BY_ID } from './program-manifest.mjs';

const DATA_DIR = 'src/data';
const courseIndex = JSON.parse(await readFile('src/data/course-index.json', 'utf8')).courses;
const indexTitle = code => courseIndex[code]?.title
  ?? courseIndex[code.replace(/([A-Z]{2,6}\s\d{3})[A-Z]+$/, '$1')]?.title
  ?? code;
const EXTRACT_DIR = 'src/data/program-extracts';
const REFINE_DIR = 'src/data/program-refine';
const SUPPLEMENT_DIR = 'src/data/program-supplements';

const argv = process.argv.slice(2);
const checkMode = argv.includes('--check');
const outIdx = argv.indexOf('--out');
const outDir = outIdx >= 0 ? argv[outIdx + 1] : DATA_DIR;
const ids = argv.filter((a, i) => !a.startsWith('--') && !(outIdx >= 0 && i === outIdx + 1));

async function readJson(p, fallback = null) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return fallback; }
}

const bareId = code => code.replace(/\s+/g, '');
const slugify = s => (s || '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Fixed key order so output is byte-stable.
const PROGRAM_KEYS = ['id', 'name', 'degree', 'school', 'department', 'kind',
  'totalCredits', 'majorCredits', 'minorCredits', 'mastersCredits', 'phdCredits',
  'hasCompletionEstimate', 'catalogUrl', 'courses', 'electiveOptions',
  'coreRequirements', 'roadmap', 'checklist', 'note'];
const COURSE_KEYS = ['id', 'code', 'title', 'credits', 'category', 'requirementGroup',
  'choiceNote', 'alternateNote', 'uniqueProgress', 'note', 'apCredit', 'grants',
  'courseRef', 'alsoCourseRef'];

const orderKeys = (obj, keys) => {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  // preserve any extra keys deterministically (shouldn't happen, but be safe)
  for (const k of Object.keys(obj).sort()) if (!(k in out)) out[k] = obj[k];
  return out;
};
const orderCourse = c => orderKeys(c, COURSE_KEYS);

/**
 * Turn one extract courselist section's rows into required courses + choice groups.
 * Consecutive `or` rows attach to the preceding course as a "choose one" group.
 */
function rowsToCourses(section, idPrefix, seenIds) {
  const courses = [];
  const groups = []; // arrays of course refs forming a choice group
  let currentRun = null;

  for (const row of section.rows) {
    if (row.type !== 'course') continue;
    if (!row.or) {
      currentRun = [row];
      groups.push(currentRun);
    } else if (currentRun) {
      currentRun.push(row);
    } else {
      currentRun = [row];
      groups.push(currentRun);
    }
  }

  for (const run of groups) {
    const choice = run.length > 1;
    const groupKey = choice ? `${idPrefix}-${slugify(run[0].code)}` : null;
    const choiceNote = choice
      ? `Choose one of ${run.map(r => r.code).join(', ')}`
      : undefined;
    for (const r of run) {
      let id = bareId(r.code);
      let n = 2;
      while (seenIds.has(id)) { id = `${bareId(r.code)}-${n}`; n += 1; }
      seenIds.add(id);
      courses.push(orderCourse({
        id,
        code: r.code,
        title: r.title ?? r.code,
        credits: r.credits ?? 0,
        category: 'major',
        ...(choice ? { requirementGroup: groupKey, choiceNote } : {}),
      }));
    }
  }
  return courses;
}

/** Flat pool of every course the extract saw (code -> {title, credits}), for structure mode. */
function extractPool(extract) {
  const pool = {};
  for (const list of extract.courseLists ?? []) {
    for (const section of list.sections) {
      for (const row of section.rows) {
        if (row.type === 'course' && !pool[row.code]) pool[row.code] = { title: row.title, credits: row.credits };
      }
    }
  }
  return pool;
}

/**
 * Structure mode: when an overlay declares `structure`, it defines the program's
 * courses[] and electiveOptions explicitly (using codes the extract scraped), for
 * programs the deterministic classifier can't model (track / qualifying-group grad
 * programs). Course titles/credits still come from the extract/index, not the overlay.
 */
function buildFromStructure(entry, extract, overlay, supplement) {
  const pool = extractPool(extract);
  const seen = new Set();
  const mkCourse = (code, extra = {}) => {
    let id = bareId(code); let n = 2;
    while (seen.has(id)) { id = `${bareId(code)}-${n}`; n += 1; }
    seen.add(id);
    return orderCourse({ id, code, title: pool[code]?.title ?? indexTitle(code), credits: pool[code]?.credits ?? 0, category: 'major', ...extra });
  };

  const courses = (overlay.structure.requiredCourseCodes ?? []).map(code => mkCourse(code));
  const electiveOptions = {};
  for (const g of overlay.structure.electiveGroups ?? []) {
    electiveOptions[g.key] = {
      creditsRequired: g.creditsRequired,
      label: g.label,
      ...(g.note ? { note: g.note } : {}),
      ...(g.members ? { courses: g.members.map(code => mkCourse(code, { category: undefined, uniqueProgress: g.uniqueProgress })) } : {}),
    };
  }
  return finalizeProgram(entry, extract, supplement, courses, electiveOptions);
}

function buildProgram(entry, extract, overlay, supplement) {
  if (overlay?.structure) return buildFromStructure(entry, extract, overlay, supplement);
  const seenIds = new Set();
  const courses = [];
  const electiveOptions = {};

  for (const list of extract.courseLists ?? []) {
    for (const section of list.sections) {
      const hasComment = section.rows.some(r => r.type === 'comment');
      const courseRows = section.rows.filter(r => r.type === 'course');
      const prefix = slugify(`${entry.department}-${section.label ?? 'req'}`);

      // Required courses + inline choice groups
      if (courseRows.length > 0) courses.push(...rowsToCourses(section, prefix, seenIds));

      // Comment rows -> elective pools (open-ended requirements)
      for (const row of section.rows) {
        if (row.type !== 'comment') continue;
        let key = slugify(`${entry.department}-${row.text}`).slice(0, 48) || `pool-${Object.keys(electiveOptions).length + 1}`;
        let n = 2;
        while (electiveOptions[key]) { key = `${key}-${n}`; n += 1; }
        electiveOptions[key] = {
          creditsRequired: row.credits ?? 0,
          label: section.label && !hasComment ? section.label : row.text,
          note: row.text,
        };
      }
    }
  }

  // ----- overlay patch (auto path): refine elective groups + course semantics
  if (overlay) {
    for (const [key, patch] of Object.entries(overlay.electiveOptions ?? {})) {
      if (electiveOptions[key]) Object.assign(electiveOptions[key], patch);
    }
    for (const [courseId, patch] of Object.entries(overlay.courseOverlays ?? {})) {
      const c = courses.find(x => x.id === courseId);
      if (c) Object.assign(c, patch);
    }
  }
  return finalizeProgram(entry, extract, supplement, courses, electiveOptions);
}

/** Assemble the final ordered Program from courses + electiveOptions, applying totals,
 *  roadmap, and the non-catalog supplement. Shared by the auto and structure paths. */
function finalizeProgram(entry, extract, supplement, courses, electiveOptions) {
  const courselistTotal = (extract.courseLists ?? []).map(l => l.total).find(t => t != null) ?? null;

  const program = {
    id: entry.id,
    name: entry.name,
    degree: entry.degree,
    school: entry.school,
    department: entry.department,
    ...(entry.kind ? { kind: entry.kind } : {}),
    totalCredits: entry.totalCreditsOverride ?? courselistTotal ?? 0,
    catalogUrl: entry.catalogUrl,
    courses,
    ...(Object.keys(electiveOptions).length ? { electiveOptions } : {}),
    coreRequirements: [],
    ...(extract.roadmap && extract.roadmap.length ? { roadmap: normalizeRoadmap(extract.roadmap, courses) } : {}),
    checklist: [],
  };
  if (entry.creditsField && courselistTotal != null) program[entry.creditsField] = courselistTotal;

  // ----- supplement (non-catalog data): checklist, note, credit pins, and a roadmap
  //       for programs whose catalog page has no Plan of Study Grid (e.g. phd-cs).
  if (supplement) {
    for (const k of ['note', 'hasCompletionEstimate', 'totalCredits', 'majorCredits',
      'minorCredits', 'mastersCredits', 'phdCredits']) {
      if (supplement[k] !== undefined) program[k] = supplement[k];
    }
    if (Array.isArray(supplement.checklist)) program.checklist = supplement.checklist;
    if (Array.isArray(supplement.coreRequirements)) program.coreRequirements = supplement.coreRequirements;
    if (Array.isArray(supplement.roadmap)) program.roadmap = supplement.roadmap;
  }

  program.courses = program.courses.map(orderCourse);
  if (program.electiveOptions) {
    for (const g of Object.values(program.electiveOptions)) {
      if (Array.isArray(g.courses)) g.courses = g.courses.map(orderCourse);
    }
  }
  return orderKeys(program, PROGRAM_KEYS);
}

const TERM_RANK = { Fall: 0, Winter: 1, Spring: 2, Summer: 3 };
function normalizeRoadmap(roadmap, courses) {
  const validIds = new Set(courses.map(c => c.id));
  return roadmap.map(sem => ({
    year: sem.year,
    semester: sem.semester,
    credits: sem.credits,
    items: (sem.items ?? []).map(it => {
      if (it.ref) {
        const id = bareId(it.ref);
        // A roadmap course that isn't a program requirement (e.g. UNIV 101, a Core
        // course) becomes a labeled item using its authoritative catalog title.
        return validIds.has(id) ? { ref: id } : { label: indexTitle(it.ref), credits: it.credits, isElective: true };
      }
      return { label: it.label, credits: it.credits, isElective: true };
    }),
  }));
}

const serialize = program => `${JSON.stringify(program, null, 2)}\n`;

// --- main --------------------------------------------------------------------

let targets = (ids.length > 0 ? ids : PROGRAMS_MANIFEST.map(e => e.id)).map(id => MANIFEST_BY_ID[id]).filter(Boolean);
if (ids.length > 0 && targets.length !== ids.length) {
  console.error('Unknown program id(s) in:', ids.join(', '));
  process.exit(1);
}
// The drift guard only enforces programs that have been adopted (generated: true).
// Legacy hand-authored files stay until their migration wave flips the flag.
if (checkMode) targets = targets.filter(e => e.generated);
if (!checkMode && outDir !== DATA_DIR && !existsSync(outDir)) await mkdir(outDir, { recursive: true });

let drift = 0;
for (const entry of targets) {
  const extract = await readJson(path.join(EXTRACT_DIR, `${entry.id}.json`));
  if (!extract) { console.error(`No extract for ${entry.id} — run fetch-program.mjs first`); process.exit(1); }
  const overlay = await readJson(path.join(REFINE_DIR, `${entry.id}.json`));
  const supplement = await readJson(path.join(SUPPLEMENT_DIR, `${entry.id}.json`));
  const program = buildProgram(entry, extract, overlay, supplement);
  const text = serialize(program);

  if (checkMode) {
    const committed = await readFile(path.join(DATA_DIR, `${entry.id}.json`), 'utf8').catch(() => null);
    if (committed !== text) { console.log(`DRIFT: ${entry.id}.json differs from generated output`); drift += 1; }
  } else {
    await writeFile(path.join(outDir, `${entry.id}.json`), text);
    console.log(`built ${entry.id} (${program.courses.length} courses)`);
  }
}

if (checkMode) {
  console.log(drift === 0 ? 'OK: all manifest programs are byte-reproducible' : `${drift} program(s) drifted`);
  process.exit(drift === 0 ? 0 : 1);
}
console.log(`\nDone: ${targets.length} program(s) -> ${outDir}/`);
