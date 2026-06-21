/**
 * Deterministic scrape of Loyola academic PROGRAM pages (catalog.luc.edu).
 *
 * For each program in scripts/program-manifest.mjs, fetches the catalog page and
 * extracts — with NO model — the structured, parseable parts:
 *   - requirement course lists  (table.sc_courselist: codecol / titlecol / hourscol,
 *                                areaheader sections, orclass alternates, comment pools)
 *   - the Plan of Study roadmap (table.sc_plangrid: plangridyear / plangridterm / sums)
 * Course titles + credits are reconciled against the master list (course-index.json),
 * so the catalog remains the single source of truth for names.
 *
 * Output: one committed cache per program at src/data/program-extracts/<id>.json,
 * including a contentHash over the relevant page fragments so re-runs are stable and
 * the downstream AI overlay can be skipped when the page is unchanged.
 *
 * Requirement SEMANTICS (choose-N, credit caps, wildcard pools) are NOT decided here —
 * they are recorded as raw comments/sections for the AI-overlay layer to interpret.
 *
 * Usage:
 *   node scripts/fetch-program.mjs                 # all programs in the manifest
 *   node scripts/fetch-program.mjs cs ms-cs        # specific program ids
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

import { PROGRAMS_MANIFEST, MANIFEST_BY_ID } from './program-manifest.mjs';

const OUT_DIR = 'src/data/program-extracts';
const INDEX_PATH = 'src/data/course-index.json';

const index = JSON.parse(await readFile(INDEX_PATH, 'utf8')).courses;

// --- shared helpers (same conventions as fetch-dept-courses.mjs) -------------

function cleanText(html) {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;|&#160;| /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Authoritative title for a code, with base-number fallback (mirrors normalize-program-courses). */
function authTitle(code) {
  if (index[code]) return index[code].title;
  const base = code.replace(/([A-Z]{2,6}\s\d{3})[A-Z]+$/, '$1');
  if (base !== code && index[base]) return index[base].title;
  return null;
}
function authCredits(code) {
  if (index[code]) return index[code].credits;
  const base = code.replace(/([A-Z]{2,6}\s\d{3})[A-Z]+$/, '$1');
  if (base !== code && index[base]) return index[base].credits;
  return null;
}

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

// --- HTML extraction ---------------------------------------------------------

const tableBlocks = (html, cls) => {
  const re = new RegExp(`<table[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)</table>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[0]);
  return out;
};

const rows = block => {
  const re = /<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi;
  const out = [];
  let m;
  while ((m = re.exec(block))) out.push({ attrs: m[1] || '', inner: m[2] || '' });
  return out;
};

/** Pull "DEPT NNN" from a codecol cell's /search/?P=DEPT%20NNN link. */
function codeFromCell(inner) {
  const m = inner.match(/\?P=([A-Z]{2,6})(?:%20|\s)(\d{3}[A-Z]?)/i);
  return m ? `${m[1].toUpperCase()} ${m[2]}` : null;
}
function hoursFromRow(inner) {
  const m = inner.match(/class="hourscol"[^>]*>\s*([\d]+(?:\.\d+)?)\s*(?:-\s*\d+)?\s*</i);
  return m ? parseInt(m[1], 10) : null;
}
function commentText(inner) {
  const m = inner.match(/class="(?:courselistcomment|comment)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  return m ? cleanText(m[1]) : null;
}

/** Parse every sc_courselist table into sections of course/comment rows. */
function parseCourseLists(html) {
  const lists = [];
  for (const block of tableBlocks(html, 'sc_courselist')) {
    let current = { label: null, rows: [] };
    const sections = [current];
    let total = null;

    for (const { attrs, inner } of rows(block)) {
      const isArea = /\bareaheader\b/.test(attrs) || /courselistcomment areaheader/.test(inner);
      const isSum = /\blistsum\b/.test(attrs);
      const isOr = /\borclass\b/.test(attrs);
      const code = codeFromCell(inner);

      if (isSum) { total = hoursFromRow(inner) ?? total; continue; }
      if (isArea) {
        const label = commentText(inner);
        // Start a new section unless the current one is still empty/unlabeled.
        if (current.label === null && current.rows.length === 0) current.label = label;
        else { current = { label, rows: [] }; sections.push(current); }
        continue;
      }
      if (code) {
        current.rows.push({
          type: 'course',
          code,
          title: authTitle(code) ?? commentText(inner) ?? null,
          credits: hoursFromRow(inner) ?? authCredits(code),
          or: isOr,
        });
        continue;
      }
      const comment = commentText(inner);
      if (comment) {
        current.rows.push({ type: 'comment', text: comment, credits: hoursFromRow(inner) });
      }
    }

    lists.push({ sections: sections.filter(s => s.rows.length > 0), total });
  }
  return lists;
}

const TERM_RANK = { Fall: 0, Winter: 1, Spring: 2, Summer: 3 };

/** Parse the first sc_plangrid into a roadmap of semesters. */
function parsePlanGrid(html) {
  const blocks = tableBlocks(html, 'sc_plangrid');
  if (blocks.length === 0) return [];
  const semesters = [];
  let year = 0;
  let current = null;

  for (const { attrs, inner } of rows(blocks[0])) {
    if (/\bplangridyear\b/.test(attrs)) {
      const ym = cleanText(inner).match(/(\d+)/);
      year = ym ? parseInt(ym[1], 10) : year + 1;
      continue;
    }
    if (/\bplangridterm\b/.test(attrs)) {
      const term = cleanText(inner).replace(/Hours$/, '').trim();
      current = { year, semester: term, credits: 0, items: [] };
      semesters.push(current);
      continue;
    }
    if (/\bplangridsum\b/.test(attrs)) {
      if (current) current.credits = hoursFromRow(inner) ?? current.credits;
      continue;
    }
    if (/\bplangridtotal\b/.test(attrs)) continue;
    if (!current) continue;

    const code = codeFromCell(inner);
    if (code) {
      current.items.push({ ref: code, credits: hoursFromRow(inner) ?? authCredits(code) });
    } else {
      const comment = commentText(inner);
      if (comment) current.items.push({ label: comment, credits: hoursFromRow(inner), isElective: true });
    }
  }
  return semesters;
}

function contentHash(html) {
  const frags = [...tableBlocks(html, 'sc_courselist'), ...tableBlocks(html, 'sc_plangrid')]
    .map(cleanText)
    .join('\n');
  return 'sha256:' + createHash('sha256').update(frags).digest('hex').slice(0, 32);
}

// --- main --------------------------------------------------------------------

const requested = process.argv.slice(2);
const targets = requested.length > 0
  ? requested.map(id => MANIFEST_BY_ID[id]).filter(Boolean)
  : PROGRAMS_MANIFEST;

if (requested.length > 0 && targets.length !== requested.length) {
  const known = new Set(PROGRAMS_MANIFEST.map(p => p.id));
  const missing = requested.filter(id => !known.has(id));
  console.error(`Unknown program id(s): ${missing.join(', ')}`);
  process.exit(1);
}

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

const results = [];
for (const entry of targets) {
  process.stdout.write(`Fetching ${entry.id} … `);
  if (results.length > 0) await new Promise(r => setTimeout(r, 300));
  try {
    const html = await fetchWithRetry(entry.catalogUrl);
    const courseLists = parseCourseLists(html);
    const roadmap = entry.skipRoadmap ? [] : parsePlanGrid(html);
    const extract = {
      id: entry.id,
      catalogUrl: entry.catalogUrl,
      fetchedAt: new Date().toISOString().slice(0, 10),
      contentHash: contentHash(html),
      courseLists,
      roadmap,
    };
    await writeFile(path.join(OUT_DIR, `${entry.id}.json`), `${JSON.stringify(extract, null, 2)}\n`);
    const nCourses = courseLists.reduce((n, l) => n + l.sections.reduce((m, s) => m + s.rows.length, 0), 0);
    console.log(`${nCourses} rows, ${roadmap.length} roadmap terms`);
    results.push({ id: entry.id, ok: true });
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    results.push({ id: entry.id, ok: false, error: err.message });
  }
}

console.log('');
const ok = results.filter(r => r.ok).length;
console.log(`Done: ${ok}/${results.length} extracts written to ${OUT_DIR}/`);
for (const r of results.filter(r => !r.ok)) console.log(`  FAILED ${r.id}: ${r.error}`);
