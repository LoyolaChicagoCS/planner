import { describe, it, expect } from 'vitest';

import { PROGRAMS } from '../data/programs';
import { buildCoreRequirementLabelMap, normalizeCoreLabel, resolveRoadmapItemId } from './roadmap';
import type { Program } from '../types';

/**
 * Drift guard for roadmap-row -> Core-requirement resolution.
 *
 * The resolver derives the link from label matching, which is powerful but
 * inherently sensitive to label edits. These tests turn that fragility into an
 * enforced invariant:
 *
 *  - The golden snapshot pins, for every program, exactly which label-only
 *    roadmap rows resolve to which requirement id. A label edit that stops a
 *    row from matching drops it from the snapshot; an edit that re-points a row
 *    changes its id. Either way the snapshot diff fails loudly — including the
 *    dangerous *wrong-match* case a structural invariant could never catch.
 *  - The explicit cs pin documents the reported bug's requirements in
 *    human-readable form, independent of the snapshot file.
 */

/** Rows that resolve via label->requirement matching (not via `ref`, not placeholders). */
function labelMatchedRows(program: Program): Array<{ label: string; requirementId: string }> {
  const labelMap = buildCoreRequirementLabelMap(program);
  const rows: Array<{ label: string; requirementId: string }> = [];
  for (const semester of program.roadmap ?? []) {
    (semester.items ?? []).forEach((item, index) => {
      if (item.ref) return;
      const { id, isElective, registered } = resolveRoadmapItemId(item, semester, index, labelMap);
      // Genuine requirement match: registered + not an elective placeholder.
      // Excludes inert `static` rows (registered:false) and elective slots.
      if (registered && !isElective && item.label) rows.push({ label: item.label, requirementId: id });
    });
  }
  return rows;
}

describe('roadmap Core-row resolution', () => {
  it('resolves the reported cs Core rows to their requirements (explicit pin)', () => {
    const cs = PROGRAMS.find(p => p.id === 'cs')!;
    const byLabel = Object.fromEntries(labelMatchedRows(cs).map(r => [r.label, r.requirementId]));

    // The reported bug: Year 2 Spring "Scientific Knowledge Tier 1".
    expect(byLabel['CORE: Scientific Knowledge Tier 1']).toBe('CORE_SCI1');
    // A representative spread across normalization cases.
    expect(byLabel['CORE: Historical Knowledge Tier 1']).toBe('CORE_HIST1');
    expect(byLabel['CORE: Theological and Religious Studies Tier 1']).toBe('CORE_THEO1');
    expect(byLabel['CAS Language Requirement 101 level']).toBe('CAS_LANG1');

    // Ambiguous "CAS Elective" (x3) must NOT resolve.
    expect(byLabel['CAS Elective']).toBeUndefined();
  });

  it('never turns a non-elective, non-matching row into a shareable placeholder', () => {
    // Guards the fix's blast radius: a roadmap row with no `ref`, no
    // `isElective` flag, and no unique Core-label match must stay inert
    // (isElective:false, registered:false) rather than becoming a dashed,
    // share-registered elective slot.
    const offenders: string[] = [];
    for (const program of PROGRAMS) {
      const labelMap = buildCoreRequirementLabelMap(program);
      for (const semester of program.roadmap ?? []) {
        (semester.items ?? []).forEach((item, index) => {
          if (item.ref || item.isElective) return;
          const matched = item.label && labelMap.get(normalizeCoreLabel(item.label));
          if (matched) return; // legitimately resolves to a requirement
          const r = resolveRoadmapItemId(item, semester, index, labelMap);
          if (r.isElective || r.registered) {
            offenders.push(`${program.id} Y${semester.year} ${semester.semester}: "${item.label}"`);
          }
        });
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('matches the committed program-wide resolution snapshot', () => {
    const resolution: Record<string, Array<{ label: string; requirementId: string }>> = {};
    for (const program of [...PROGRAMS].sort((a, b) => a.id.localeCompare(b.id))) {
      const rows = labelMatchedRows(program);
      if (rows.length > 0) resolution[program.id] = rows;
    }
    expect(resolution).toMatchSnapshot();
  });
});
