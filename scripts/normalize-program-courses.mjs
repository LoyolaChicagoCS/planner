/**
 * Normalize course TITLES in every program JSON to the authoritative catalog
 * course list (src/data/course-index.json), enforcing one name per course number.
 *
 * The catalog is the single source of truth: a course title is looked up by its
 * number and never copied from a sibling program or hand-typed. Run this after
 * scraping (scripts/fetch-dept-courses.mjs) whenever course data changes.
 *
 * Scope: titles only. Credits are intentionally left untouched (program credit
 * totals depend on them); see CREDITS_DISCREPANCIES.md for the credit report.
 *
 * Usage:
 *   node scripts/normalize-program-courses.mjs            # apply
 *   node scripts/normalize-program-courses.mjs --dry-run  # report, change nothing
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = 'src/data';
const INDEX_PATH = 'src/data/course-index.json';
const SKIP_FILES = new Set(['coreCourses.json', 'optional.json', 'course-index.json', 'programs.ts']);
const dryRun = process.argv.includes('--dry-run');

const REAL_CODE = /^[A-Z]{2,6}\s\d{3}[A-Z]?$/; // "PHYS 121", "CLST 271G" — excludes "COMP 3XX"

const index = JSON.parse(await readFile(INDEX_PATH, 'utf8')).courses;

/** Look up the authoritative title for a code: exact, then base-number fallback. */
function authTitle(code) {
  if (index[code]) return index[code].title;
  // Lettered variant not individually listed → fall back to the base number
  const base = code.replace(/([A-Z]{2,6}\s\d{3})[A-Z]+$/, '$1');
  if (base !== code && index[base]) return index[base].title;
  return null;
}

function* coursesOf(program) {
  for (const c of program.courses ?? []) yield c;
  for (const g of Object.values(program.electiveOptions ?? {})) {
    for (const c of g.courses ?? []) yield c;
  }
}

const files = (await readdir(DATA_DIR)).filter(f => f.endsWith('.json') && !SKIP_FILES.has(f));

let changed = 0;
const filesChanged = new Set();
const changes = [];
const unmatched = new Map(); // prefix → Set(codes)

for (const file of files) {
  const full = path.join(DATA_DIR, file);
  let program;
  try { program = JSON.parse(await readFile(full, 'utf8')); } catch { continue; }
  if (!program || typeof program !== 'object' || !('id' in program)) continue;

  let dirty = false;
  for (const c of coursesOf(program)) {
    if (!c.code || !REAL_CODE.test(c.code.trim())) continue;
    const code = c.code.trim();
    const title = authTitle(code);
    if (title == null) {
      const prefix = code.split(' ')[0];
      if (!unmatched.has(prefix)) unmatched.set(prefix, new Set());
      unmatched.get(prefix).add(code);
      continue;
    }
    if ((c.title ?? '').trim() !== title) {
      changes.push({ code, file, from: (c.title ?? '').trim(), to: title });
      c.title = title;
      changed += 1;
      dirty = true;
      filesChanged.add(file);
    }
  }
  if (dirty && !dryRun) await writeFile(full, `${JSON.stringify(program, null, 2)}\n`);
}

console.log(`${dryRun ? '[dry-run] ' : ''}Title changes: ${changed} across ${filesChanged.size} files`);
for (const ch of changes.slice(0, 40)) console.log(`  ${ch.code}: "${ch.from}" -> "${ch.to}" [${ch.file}]`);
if (changes.length > 40) console.log(`  … and ${changes.length - 40} more`);

if (unmatched.size > 0) {
  console.log(`\nCodes not in course-index (no catalog title found), by prefix:`);
  for (const [prefix, codes] of [...unmatched.entries()].sort()) {
    console.log(`  ${prefix} (${codes.size}): ${[...codes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(', ')}`);
  }
}
