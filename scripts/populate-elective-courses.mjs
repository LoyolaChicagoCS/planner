/**
 * Populates courses arrays for enumerable electiveOptions groups in
 * additional-major program JSON files.
 *
 * For each electiveOptions group whose note mentions specific course numbers
 * (e.g. "PHIL 181, 182, 283–289"), this script:
 *   1. Parses the course numbers/ranges out of the note text.
 *   2. Looks them up in the dept-courses inventory (undergrad only, ≤ 399).
 *   3. Writes a curated courses array (up to MAX_COURSES entries) back into
 *      the program JSON.
 *
 * Groups that are already populated, or whose notes don't reference specific
 * course numbers, are left untouched.
 *
 * Usage:
 *   node scripts/populate-elective-courses.mjs           # all programs
 *   node scripts/populate-elective-courses.mjs phil ENGL # specific programs (id substring match)
 *
 * Re-running is safe — already-populated groups are skipped unless --force is passed.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'src/data';
const DEPT_DIR = 'src/data/dept-courses';
const UNDERGRAD_MAX = 399;
const MAX_COURSES = 10; // curated subset cap per pool

const CS_IDS = new Set([
  'cs', 'se', 'it', 'cybersecurity', 'datascience', 'bioinformatics',
  'cs-minor', 'it-minor', 'computer-crime-forensics-minor',
  'ai-minor', 'ai-human-flourishing-minor', 'business-ai-minor',
  'ms-cs', 'ms-it', 'ms-cybersecurity', 'ms-se', 'ms-ds', 'phd-cs',
]);

const force = process.argv.includes('--force');
const filters = process.argv.slice(2).filter(a => !a.startsWith('--')).map(s => s.toLowerCase());

// ---------------------------------------------------------------------------
// Load dept-courses inventories (undergrad only)
// ---------------------------------------------------------------------------

const deptCourses = {}; // code → Map<id, course>
for (const f of readdirSync(DEPT_DIR).filter(n => n.endsWith('.json'))) {
  const dept = JSON.parse(readFileSync(path.join(DEPT_DIR, f), 'utf8'));
  const map = new Map();
  for (const c of dept.courses) {
    const num = parseInt(c.code.split(' ')[1], 10);
    if (num <= UNDERGRAD_MAX) map.set(c.id, c);
  }
  deptCourses[dept.code] = map;
}

function lookupCourse(deptCode, num) {
  const id = `${deptCode}${num}`;
  return deptCourses[deptCode]?.get(id) ?? null;
}

// ---------------------------------------------------------------------------
// Parse course numbers and ranges from a note string
// Handles:
//   "PHIL 181, 182, 283–289, 321–322"
//   "ENGL 282, 283, or 284"
//   "COMM 214, 317 + elective"
//   "PLSC 202, 203, 204"
// ---------------------------------------------------------------------------

function parseCoursesFromNote(note) {
  const results = []; // { deptCode, num }

  // Find all dept+number anchors and number-only continuations
  // Pattern: optional DEPT prefix followed by NNN or NNN–NNN
  const deptPattern = /\b([A-Z]{2,6})\s+(\d{3})/g;
  let lastDept = null;

  // First pass: extract dept+number pairs to establish the active dept
  const anchors = [...note.matchAll(deptPattern)].map(m => ({
    index: m.index,
    dept: m[1],
    num: parseInt(m[2], 10),
  }));

  if (anchors.length === 0) return results;

  // Work through the note segment by segment between anchors
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    lastDept = anchor.dept;
    results.push({ deptCode: lastDept, num: String(anchor.num) });

    // Look at the text between this anchor and the next (or end of note)
    const segEnd = i + 1 < anchors.length ? anchors[i + 1].index : note.length;
    const seg = note.slice(anchor.index + anchor.dept.length + 1 + String(anchor.num).length, segEnd);

    // Extract any bare numbers or ranges that follow, sharing the same dept
    const barePattern = /[,\s]+(\d{3})(?:\s*[–-]\s*(\d{3}))?/g;
    for (const bm of seg.matchAll(barePattern)) {
      const lo = parseInt(bm[1], 10);
      const hi = bm[2] ? parseInt(bm[2], 10) : lo;
      if (hi - lo > 20) continue; // sanity cap: ranges > 20 are open-ended descriptions
      for (let n = lo; n <= hi; n++) {
        results.push({ deptCode: lastDept, num: String(n) });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Resolve parsed references against the inventory
// ---------------------------------------------------------------------------

function resolveCourses(refs) {
  const seen = new Set();
  const courses = [];
  for (const { deptCode, num } of refs) {
    const c = lookupCourse(deptCode, num);
    if (!c || seen.has(c.id)) continue;
    seen.add(c.id);
    courses.push({ id: c.id, code: c.code, title: c.title, credits: c.credits, category: 'elective' });
  }
  return courses;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const programFiles = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && !['coreCourses.json', 'optional.json'].includes(f) && !f.startsWith('dept-courses'))
  .sort();

let totalPopulated = 0;
let totalSkipped = 0;

for (const fname of programFiles) {
  let prog;
  try { prog = JSON.parse(readFileSync(path.join(DATA_DIR, fname), 'utf8')); }
  catch { continue; }

  if (CS_IDS.has(prog.id)) continue;
  if (!prog.electiveOptions) continue;
  if (filters.length > 0 && !filters.some(f => prog.id.includes(f))) continue;

  let changed = false;

  for (const [key, group] of Object.entries(prog.electiveOptions)) {
    if (group.courses?.length && !force) { totalSkipped++; continue; }

    const note = group.note ?? '';
    const refs = parseCoursesFromNote(note);
    if (refs.length === 0) continue;

    const resolved = resolveCourses(refs);
    if (resolved.length === 0) continue;

    // Cap to MAX_COURSES — take the first N (lowest course numbers, most introductory)
    const curated = resolved.slice(0, MAX_COURSES);

    group.courses = curated;
    changed = true;
    totalPopulated++;

    const truncated = resolved.length > MAX_COURSES ? ` (${resolved.length} found, capped at ${MAX_COURSES})` : '';
    console.log(`  ${prog.id} / ${key}: ${curated.length} courses${truncated}`);
  }

  if (changed) {
    writeFileSync(path.join(DATA_DIR, fname), JSON.stringify(prog, null, 2) + '\n');
  }
}

console.log('');
console.log(`Populated: ${totalPopulated} pools`);
console.log(`Skipped (already populated): ${totalSkipped}`);
