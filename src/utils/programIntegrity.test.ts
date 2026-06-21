import { describe, it, expect } from 'vitest';

import { PROGRAMS } from '../data/programs';
import { PROGRAMS_MANIFEST } from '../../scripts/program-manifest.mjs';
import type { Program } from '../types';

/**
 * Program-ingestion integrity guard.
 *
 * Enforces that academic programs are reproducible from committed inputs
 * (manifest + catalog extract + overlay + supplement) via scripts/build-programs.mjs.
 * See docs/INGESTION.md. The manifest is migrated in waves: entries marked
 * `generated: true` are adopted (byte-reproducible); the rest are legacy hand files
 * still awaiting migration, so the strict checks scope to generated entries.
 */

const byId = new Map(PROGRAMS.map(p => [p.id, p as Program]));
const generated = PROGRAMS_MANIFEST.filter((e: { generated?: boolean }) => e.generated);

function* coursesOf(program: Program) {
  for (const c of program.courses ?? []) yield c;
  for (const g of Object.values(program.electiveOptions ?? {})) {
    for (const c of g.courses ?? []) yield c;
  }
}

describe('program manifest ↔ registry', () => {
  it('every manifest program is registered and matches its metadata', () => {
    const problems: string[] = [];
    for (const e of PROGRAMS_MANIFEST) {
      const p = byId.get(e.id);
      if (!p) { problems.push(`${e.id}: in manifest but not registered in programs.ts`); continue; }
      if (p.degree !== e.degree) problems.push(`${e.id}: degree ${p.degree} != manifest ${e.degree}`);
      if (p.department !== e.department) problems.push(`${e.id}: department mismatch`);
      if ((p.kind ?? undefined) !== (e.kind ?? undefined)) problems.push(`${e.id}: kind ${p.kind} != manifest ${e.kind}`);
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});

describe('generated programs are well-formed', () => {
  it('roadmap refs resolve to a course in the same program', () => {
    const problems: string[] = [];
    for (const e of generated) {
      const p = byId.get(e.id);
      if (!p) continue;
      const ids = new Set([...coursesOf(p)].map(c => c.id));
      for (const sem of p.roadmap ?? []) {
        for (const item of sem.items ?? []) {
          if (item.ref && !ids.has(item.ref)) problems.push(`${e.id}: roadmap ref ${item.ref} unresolved`);
        }
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('credit totals are sane (program-requirement credits ≤ total)', () => {
    const problems: string[] = [];
    for (const e of generated) {
      const p = byId.get(e.id);
      if (!p) continue;
      for (const field of ['majorCredits', 'minorCredits', 'mastersCredits', 'phdCredits'] as const) {
        const v = p[field];
        if (typeof v === 'number' && v > p.totalCredits) problems.push(`${e.id}: ${field} ${v} > totalCredits ${p.totalCredits}`);
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
});

// The byte-reproducibility drift guard runs as a CLI step, `npm run check:programs`
// (node scripts/build-programs.mjs --check), invoked in the validation gate — it
// regenerates every generated program from inputs and fails on any drift. It lives
// outside vitest to avoid pulling Node child_process types into the typechecked suite.
