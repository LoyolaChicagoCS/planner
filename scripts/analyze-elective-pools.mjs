/**
 * Analyzes elective pools in additional-major program JSON files.
 *
 * For each electiveOptions group that currently lacks a courses array,
 * classifies it as:
 *   - ENUMERABLE  : note mentions specific course numbers → can add courses array
 *   - OPEN-ENDED  : note describes a category (any 300-level, approved list, etc.)
 *
 * For open-ended pools, counts how many qualifying courses exist in the
 * dept-courses inventory and flags those with > 10 options.
 *
 * Usage:
 *   node scripts/analyze-elective-pools.mjs
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Undergraduate course number ceiling — mirrors the constant in fetch-dept-courses.mjs.
// 500+ courses are graduate-level and must not appear in additional-major elective pools.
const UNDERGRAD_MAX = 499;

const DATA_DIR  = 'src/data';
const DEPT_DIR  = 'src/data/dept-courses';
const CS_IDS = new Set([
  'cs', 'se', 'it', 'cybersecurity', 'datascience', 'bioinformatics',
  'cs-minor', 'it-minor', 'computer-crime-forensics-minor',
  'ai-minor', 'ai-human-flourishing-minor', 'business-ai-minor',
  'ms-cs', 'ms-it', 'ms-cybersecurity', 'ms-se', 'ms-ds', 'phd-cs',
]);

// Load dept-courses inventories — undergraduate courses only (≤ 499)
const deptCourses = {};
for (const f of readdirSync(DEPT_DIR).filter(n => n.endsWith('.json'))) {
  const dept = JSON.parse(readFileSync(path.join(DEPT_DIR, f), 'utf8'));
  deptCourses[dept.code] = dept.courses.filter(
    c => parseInt(c.code.split(' ')[1], 10) <= UNDERGRAD_MAX,
  );
}

// Detect if a note text references specific course numbers
// vs. describing a general category.
function isEnumerable(note) {
  // Contains a dept code followed by a number: "PHIL 181" or "ENGL 282–290"
  return /\b[A-Z]{2,6}\s+\d{3}/.test(note) || /\b\d{3}[,/–-]\s*\d{3}/.test(note);
}

// Extract department codes mentioned in a note
function deptsInNote(note) {
  return [...new Set([...note.matchAll(/\b([A-Z]{2,6})\s+\d{3}/g)].map(m => m[1]))];
}

// Count how many courses in the inventory would match a general level filter
// e.g. "300-level" → count courses with numbers 300–399
function countLevelMatch(note, deptCode) {
  const courses = deptCourses[deptCode] ?? [];
  const levelMatch = note.match(/(\d{1})00[-–]level/i);
  if (!levelMatch) return courses.length; // all
  const prefix = parseInt(levelMatch[1], 10);
  return courses.filter(c => {
    const num = parseInt(c.code.split(' ')[1], 10);
    return num >= prefix * 100 && num < (prefix + 1) * 100;
  }).length;
}

// Load all non-CS program files
const programFiles = readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && !['coreCourses.json', 'optional.json'].includes(f));

const rows = [];

for (const fname of programFiles.sort()) {
  const fpath = path.join(DATA_DIR, fname);
  let prog;
  try { prog = JSON.parse(readFileSync(fpath, 'utf8')); } catch { continue; }
  if (CS_IDS.has(prog.id)) continue;
  if (!prog.electiveOptions) continue;

  for (const [key, group] of Object.entries(prog.electiveOptions)) {
    if (group.courses?.length) continue; // already has courses
    const note = group.note ?? '';

    if (isEnumerable(note)) {
      const depts = deptsInNote(note);
      rows.push({
        program: prog.id,
        group: key,
        label: group.label,
        credits: group.creditsRequired,
        type: 'ENUMERABLE',
        count: null,
        note: note.slice(0, 100),
        depts,
      });
    } else {
      // Open-ended: figure out which dept and level it's targeting
      // Use the program's own course dept codes as the primary dept
      const progDepts = [...new Set(
        (prog.courses ?? []).map(c => c.code.split(' ')[0])
      )];
      const count = progDepts.reduce((sum, d) => sum + countLevelMatch(note, d), 0);
      rows.push({
        program: prog.id,
        group: key,
        label: group.label,
        credits: group.creditsRequired,
        type: 'OPEN-ENDED',
        count,
        note: note.slice(0, 100),
        depts: progDepts,
      });
    }
  }
}

// Print report
const enumerable = rows.filter(r => r.type === 'ENUMERABLE');
const openEnded  = rows.filter(r => r.type === 'OPEN-ENDED');
const bigOpen    = openEnded.filter(r => r.count === null || r.count > 10);
const smallOpen  = openEnded.filter(r => r.count !== null && r.count <= 10);

console.log('='.repeat(72));
console.log(`ELECTIVE POOL ANALYSIS`);
console.log('='.repeat(72));
console.log(`Total pools without courses array: ${rows.length}`);
console.log(`  Enumerable (can add courses):    ${enumerable.length}`);
console.log(`  Open-ended ≤ 10 (might list):    ${smallOpen.length}`);
console.log(`  Open-ended > 10 (keep as note):  ${bigOpen.length}`);
console.log('');

console.log('--- ENUMERABLE POOLS ---');
for (const r of enumerable) {
  console.log(`  ${r.program} / ${r.group}`);
  console.log(`    Label: ${r.label}  (${r.credits} cr)`);
  console.log(`    Note:  ${r.note}`);
  console.log(`    Depts: ${r.depts.join(', ')}`);
  console.log('');
}

console.log('--- OPEN-ENDED POOLS (≤10 matching catalog courses — may list) ---');
for (const r of smallOpen) {
  console.log(`  ${r.program} / ${r.group}  [~${r.count} courses in inventory]`);
  console.log(`    Label: ${r.label}  (${r.credits} cr)`);
  console.log(`    Note:  ${r.note}`);
  console.log('');
}

console.log('--- OPEN-ENDED POOLS (>10 options — stay as note) ---');
for (const r of bigOpen) {
  const cnt = r.count ?? '?';
  console.log(`  ${r.program} / ${r.group}  [~${cnt} courses in inventory]`);
  console.log(`    Label: ${r.label}  (${r.credits} cr)`);
  console.log(`    Note:  ${r.note}`);
  console.log('');
}
