import { describe, it, expect } from 'vitest';

import { PROGRAMS } from '../data/programs';
import courseIndex from '../data/course-index.json';
import exceptions from '../data/course-exceptions.json';
import type { Course, Program } from '../types';

/**
 * Course-integrity guard.
 *
 * The catalog is the single source of truth: every course number maps to exactly
 * one title (src/data/course-index.json, produced by scripts/fetch-dept-courses.mjs).
 * These tests fail if any program references a course code that is not in the index,
 * or pairs a code with a title different from the catalog's. Run the pipeline to fix:
 *   node scripts/fetch-dept-courses.mjs && node scripts/normalize-program-courses.mjs
 */

const index = courseIndex.courses as Record<string, { title: string; credits: number }>;
const pagelessPrefixes = new Set(exceptions.prefixesWithoutCatalogPage);
const knownMissing = new Set(exceptions.knownMissingCodes);

const REAL_CODE = /^[A-Z]{2,6}\s\d{3}[A-Z]?$/; // "PHYS 121", "CLST 271G" — excludes "COMP 3XX" pools

function authTitle(code: string): string | null {
  if (index[code]) return index[code].title;
  const base = code.replace(/([A-Z]{2,6}\s\d{3})[A-Z]+$/, '$1');
  if (base !== code && index[base]) return index[base].title;
  return null;
}

function* coursesOf(program: Program): Generator<Course> {
  for (const c of program.courses ?? []) yield c;
  for (const g of Object.values(program.electiveOptions ?? {})) {
    for (const c of g.courses ?? []) yield c;
  }
}

/** Real course codes in a program that are not exempted. */
function checkableCourses(program: Program): Course[] {
  const out: Course[] = [];
  for (const c of coursesOf(program)) {
    const code = (c.code ?? '').trim();
    if (!REAL_CODE.test(code)) continue;
    if (pagelessPrefixes.has(code.split(' ')[0])) continue;
    if (knownMissing.has(code)) continue;
    out.push({ ...c, code });
  }
  return out;
}

describe('course integrity (catalog is source of truth)', () => {
  it('every program course code exists in the catalog index', () => {
    const missing: string[] = [];
    for (const program of PROGRAMS) {
      for (const c of checkableCourses(program)) {
        if (authTitle(c.code) == null) missing.push(`${c.code} [${program.id}]`);
      }
    }
    expect(
      missing,
      `Codes not in course-index.json. Re-run the scraper, fix the code, or add to `
      + `course-exceptions.json with a LIKELY_WRONG.md note:\n${missing.join('\n')}`,
    ).toEqual([]);
  });

  it('every program course title matches the catalog (one name per number)', () => {
    const mismatches: string[] = [];
    for (const program of PROGRAMS) {
      for (const c of checkableCourses(program)) {
        const want = authTitle(c.code);
        if (want != null && (c.title ?? '').trim() !== want) {
          mismatches.push(`${c.code} [${program.id}]: "${(c.title ?? '').trim()}" should be "${want}"`);
        }
      }
    }
    expect(
      mismatches,
      `Titles differ from the catalog. Run: node scripts/normalize-program-courses.mjs\n${mismatches.join('\n')}`,
    ).toEqual([]);
  });
});
