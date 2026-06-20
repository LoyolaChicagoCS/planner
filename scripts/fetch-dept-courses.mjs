/**
 * Fetch course listings for academic departments from catalog.luc.edu.
 *
 * Writes one JSON file per department to src/data/dept-courses/<CODE>.json.
 * Run annually when the catalog rolls over, or when adding a new department.
 *
 * Usage:
 *   node scripts/fetch-dept-courses.mjs            # fetch all departments
 *   node scripts/fetch-dept-courses.mjs PHIL MATH  # fetch specific departments
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://catalog.luc.edu/course-descriptions';
const OUT_DIR = 'src/data/dept-courses';
const CATALOG_YEAR = '2026-2027';

// When using dept-courses data to populate undergraduate elective pools,
// filter courses to numbers ≤ this value. At Loyola, 400+ courses in CAS,
// Communication, and Business departments are graduate-level and must not
// appear in additional-major elective arrays. Note: specific required courses
// (e.g. 490 capstones, NEUR 400) may still appear in program JSON `courses`
// arrays because they are explicitly designated undergraduate requirements —
// this cap applies only to elective pool population from the inventory.
export const UNDERGRAD_MAX_COURSE_NUM = 399;

/**
 * All departments needed to populate elective pools across CAS, Communication,
 * and Business additional-major program files. Each entry maps the department
 * prefix used in course IDs (e.g. "PHIL") to the URL slug on the catalog site.
 * When a department's catalog slug differs from the lowercase code, override it
 * with the `slug` field.
 */
const DEPARTMENTS = [
  // College of Arts and Sciences
  { code: 'AFR',   name: 'African Studies' },
  { code: 'ANTH',  name: 'Anthropology' },
  { code: 'BIOL',  name: 'Biology' },
  { code: 'CHEM',  name: 'Chemistry' },
  { code: 'CJC',   name: 'Criminal Justice and Criminology' },
  { code: 'CLST',  name: 'Classical Studies' },
  { code: 'DANC',  name: 'Dance' },
  { code: 'ECON',  name: 'Economics' },
  { code: 'ENGL',  name: 'English' },
  { code: 'FNAR',  name: 'Fine and Performing Arts' },
  // FORS courses (310/320/325/330/410/420/490) have no standalone catalog page;
  // the Forensic Science program uses BIOL/CHEM/PHYS for its science requirements
  // { code: 'FORS', name: 'Forensic Science' },
  { code: 'FREN',  name: 'French' },
  { code: 'GLST',  name: 'Global Studies' },
  { code: 'HIST',  name: 'History' },
  // HSRV courses have no standalone catalog page at catalog.luc.edu/course-descriptions/
  // { code: 'HSRV', name: 'Human Services' },
  { code: 'ITAL',  name: 'Italian' },
  { code: 'MATH',  name: 'Mathematics' },
  { code: 'MUSC',  name: 'Music' },
  { code: 'NEUR',  name: 'Neuroscience' },
  { code: 'PHIL',  name: 'Philosophy' },
  { code: 'PHYS',  name: 'Physics' },
  // Political Science uses PLSC at Loyola (POLS = Polish Language)
  { code: 'PLSC',  name: 'Political Science' },
  { code: 'PSYC',  name: 'Psychology' },
  // Religious Studies courses are listed under THEO (Theology); no separate RELS page
  { code: 'SOCL',  name: 'Sociology' },
  // SOCI prefix does not exist at Loyola — Sociology uses SOCL
  { code: 'SPAN',  name: 'Spanish' },
  { code: 'STAT',  name: 'Statistics' },
  { code: 'THEO',  name: 'Theology' },
  { code: 'THTR',  name: 'Theatre' },
  { code: 'WSGS',  name: 'Women\'s Studies and Gender Studies' },
  // School of Communication
  { code: 'COMM',  name: 'Communication' },
  { code: 'MARK',  name: 'Marketing' },
  { code: 'SPRT',  name: 'Sport Management' },
  // Business (elective pools only; core BBA courses are already enumerated)
  { code: 'ACCT',  name: 'Accounting' },
  { code: 'ENTR',  name: 'Entrepreneurship' },
  { code: 'FINC',  name: 'Finance' },
  { code: 'INFS',  name: 'Information Systems' },
  { code: 'ISSCM', name: 'Information Systems / Supply Chain Management' },
  { code: 'MGMT',  name: 'Management' },
  { code: 'SCMG',  name: 'Supply Chain Management' },
];

// ---------------------------------------------------------------------------
// HTML parsing helpers (regex-based, no external dependencies)
// ---------------------------------------------------------------------------

function cleanText(html) {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;|&#160;| /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse course blocks from a catalog course-descriptions page.
 *
 * Loyola's catalog (powered by Modern Campus) renders course blocks as:
 *
 *   <div class="courseblock">
 *     <div class="cols noindent">
 *       <span class="text detail-code …"><strong>PHIL 130</strong></span>
 *       <span class="text detail-title …"><strong>Philosophy &amp; Persons</strong></span>
 *       <span class="text detail-hours_html …"><strong>(3 Credit Hours)</strong></span>
 *       ...
 *     </div>
 *   </div>
 *
 * Credits may appear as:
 *   - "(3 Credit Hours)"
 *   - "(1-6 Credit Hours)"  → we take the lower bound
 *   - "(0 Credit Hours)"
 */
function parseCourseBlocks(html) {
  const courses = [];

  // Each top-level courseblock is a standalone <div class="courseblock">…</div>.
  // We split on the opening tag and process each chunk.
  const chunks = html.split(/<div[^>]*class="[^"]*\bcourseblock\b[^"]*"[^>]*>/i);

  for (const chunk of chunks.slice(1)) {
    // Course code: <span class="text detail-code …"><strong>DEPT NNN</strong></span>
    const codeMatch = chunk.match(/class="[^"]*\bdetail-code\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    if (!codeMatch) continue;
    const codeRaw = cleanText(codeMatch[1]);

    // Must look like "DEPT NNN" — uppercase letters then a space then digits
    const codeParsed = codeRaw.match(/^([A-Z]{2,6})\s+(\d{3}[A-Z]?)$/);
    if (!codeParsed) continue;
    const deptCode = codeParsed[1];
    const num = codeParsed[2];

    // Course title: <span class="text detail-title …"><strong>…</strong></span>
    const titleMatch = chunk.match(/class="[^"]*\bdetail-title\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    if (!titleMatch) continue;
    const title = cleanText(titleMatch[1]);

    // Credits: <span class="text detail-hours_html …"><strong>(N Credit Hours)</strong></span>
    const hoursMatch = chunk.match(/class="[^"]*\bdetail-hours_html\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    let credits = 3; // sensible default
    if (hoursMatch) {
      const hoursText = cleanText(hoursMatch[1]);
      const hoursNum = hoursText.match(/(\d+)(?:-\d+)?\s*Credit/i);
      if (hoursNum) credits = parseInt(hoursNum[1], 10);
    }

    const id = `${deptCode}${num}`;
    const code = `${deptCode} ${num}`;

    courses.push({ id, code, title, credits });
  }

  return courses;
}

/**
 * Consolidate lettered course variants into single "topics" entries.
 *
 * Loyola uses letter suffixes for several purposes:
 *   A, B, C, D, E, F … — repeatable topics courses (different theme each semester)
 *   L                  — laboratory section (keep separate, not a topics variant)
 *   H                  — honors section (keep separate)
 *
 * Rule: if a base number has 2 or more lettered variants (excluding L and H),
 * collapse all of them (plus the bare base if it exists) into one entry marked
 * isTopics: true with a topicsCount field. Labs and honors sections always stay
 * as standalone entries.
 *
 * Example:
 *   HIST 300, 300A, 300B, 300C, 300D, 300E → one entry "Topics in History" (isTopics, topicsCount: 6)
 *   BIOL 361L                               → kept as-is (lab)
 *   ACCT 201, 201H                          → kept as two separate entries (honors)
 *   MUSC 280K, 280P, 280S, 280Z            → one entry "Applied Music" (isTopics, topicsCount: 4)
 */
function consolidateCourses(courses) {
  // Partition into labs, honors, and regular (including lettered variants)
  const labs    = [];
  const honors  = [];
  const regular = [];

  for (const c of courses) {
    const suffix = c.code.split(' ')[1].replace(/^\d{3}/, ''); // '' | 'A' | 'L' | 'H' | 'AB' etc.
    if (suffix === 'L') { labs.push(c); continue; }
    if (suffix === 'H') { honors.push(c); continue; }
    regular.push(c);
  }

  // Group regular entries by their base number (digits only)
  const groups = new Map(); // "DEPT NNN" → { base, variants[] }
  for (const c of regular) {
    const [dept, numFull] = c.code.split(' ');
    const baseNum = numFull.replace(/[A-Z]+$/, '');
    const key = `${dept} ${baseNum}`;
    if (!groups.has(key)) groups.set(key, { key, dept, baseNum, base: null, variants: [] });
    const g = groups.get(key);
    if (numFull === baseNum) g.base = c; else g.variants.push(c);
  }

  const result = [];

  for (const g of groups.values()) {
    if (g.variants.length < 2) {
      // 0 or 1 lettered variant — not a topics group, keep each entry separately
      if (g.base) result.push(g.base);
      result.push(...g.variants);
      continue;
    }

    // 2+ lettered variants → consolidate as a topics entry
    const totalCount = (g.base ? 1 : 0) + g.variants.length;
    const representative = g.base ?? g.variants[0];

    // Derive a clean title: strip instrument/focus suffixes after ":" or " - "
    // so "Applied Music: Viola" → "Applied Music", "Topics in History" stays as-is
    let title = representative.title;
    if (!g.base) {
      const stripped = title.replace(/\s*[:–—-]\s*.+$/, '').trim();
      if (stripped.length >= 4) title = stripped;
    }

    result.push({
      id: `${g.dept}${g.baseNum}`,
      code: `${g.dept} ${g.baseNum}`,
      title,
      credits: representative.credits,
      isTopics: true,
      topicsCount: totalCount,
    });
  }

  // Labs and honors pass through unchanged
  result.push(...labs, ...honors);

  // Re-sort by numeric course number (labs/honors sort alongside their base)
  return result.sort((a, b) => {
    const an = parseInt(a.code.split(' ')[1], 10);
    const bn = parseInt(b.code.split(' ')[1], 10);
    return an - bn || a.code.localeCompare(b.code);
  });
}

// ---------------------------------------------------------------------------
// Network helper
// ---------------------------------------------------------------------------

async function fetchWithRetry(url, tries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < tries) await new Promise(r => setTimeout(r, 600 * attempt));
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const requestedCodes = process.argv.slice(2).map(s => s.toUpperCase());
const targets = requestedCodes.length > 0
  ? DEPARTMENTS.filter(d => requestedCodes.includes(d.code))
  : DEPARTMENTS;

if (requestedCodes.length > 0 && targets.length === 0) {
  console.error(`No matching departments for: ${requestedCodes.join(', ')}`);
  console.error(`Available codes: ${DEPARTMENTS.map(d => d.code).join(', ')}`);
  process.exit(1);
}

if (!existsSync(OUT_DIR)) {
  await mkdir(OUT_DIR, { recursive: true });
}

let totalCourses = 0;
const results = [];

for (const dept of targets) {
  const slug = dept.slug ?? dept.code.toLowerCase();
  const url = `${BASE_URL}/${slug}/`;

  process.stdout.write(`Fetching ${dept.code} (${dept.name}) … `);

  // Polite crawl delay between departments
  if (results.length > 0) await new Promise(r => setTimeout(r, 300));

  let courses = [];
  let error = null;

  try {
    const html = await fetchWithRetry(url);
    courses = consolidateCourses(parseCourseBlocks(html));

    if (courses.length === 0) {
      // Retry with alternate slug patterns that Loyola sometimes uses
      const altSlugs = [
        dept.code.toLowerCase().replace(/\s+/g, '-'),
        dept.name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/-+$/, ''),
      ];
      for (const alt of altSlugs) {
        if (alt === slug) continue;
        try {
          const altHtml = await fetchWithRetry(`${BASE_URL}/${alt}/`);
          const altCourses = consolidateCourses(parseCourseBlocks(altHtml));
          if (altCourses.length > 0) {
            courses = altCourses;
            break;
          }
        } catch {
          // ignore alt failures
        }
      }
    }

    console.log(`${courses.length} courses`);
  } catch (err) {
    error = err.message;
    console.log(`ERROR: ${error}`);
  }

  const output = {
    catalog: CATALOG_YEAR,
    code: dept.code,
    name: dept.name,
    sourceUrl: url,
    fetchedAt: new Date().toISOString().slice(0, 10),
    courses,
    ...(error ? { fetchError: error } : {}),
  };

  const outPath = path.join(OUT_DIR, `${dept.code}.json`);
  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`);

  totalCourses += courses.length;
  results.push({ code: dept.code, count: courses.length, error });
}

console.log('');
console.log('Summary:');
for (const r of results) {
  const status = r.error ? `ERROR: ${r.error}` : `${r.count} courses`;
  console.log(`  ${r.code.padEnd(8)} ${status}`);
}
console.log(`\nTotal: ${totalCourses} courses across ${results.length} departments`);
console.log(`Output: ${OUT_DIR}/`);
