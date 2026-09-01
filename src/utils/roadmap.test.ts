import { describe, it, expect } from 'vitest';

import {
  normalizeCoreLabel,
  buildCoreRequirementLabelMap,
  resolveRoadmapItemId,
  electivePlaceholderId,
} from './roadmap';
import type { CoreRequirement, Program, RoadmapItem, RoadmapSemester } from '../types';

function req(id: string, label: string): CoreRequirement {
  return { id, label, credits: 3 };
}

/** Minimal program exercising the label-matching cases we care about. */
const program: Program = {
  id: 'test',
  name: 'Test',
  degree: 'BS',
  school: 'LUC',
  totalCredits: 120,
  coreRequirements: [
    req('CORE_SCI1', 'Scientific Knowledge Tier 1'),
    req('CORE_SCI2', 'Scientific Knowledge Tier 2'),
    req('CORE_THEO1', 'Theological & Religious Studies Tier 1'),
    req('CAS_LANG1', 'CAS Language Requirement (101-level)'),
    // Three identical labels -> ambiguous, must NOT resolve.
    req('CAS_ELEC1', 'CAS Elective'),
    req('CAS_ELEC2', 'CAS Elective'),
    req('CAS_ELEC3', 'CAS Elective'),
  ],
};

const semester: RoadmapSemester = { year: 2, semester: 'Spring', credits: 15 };
const labelMap = buildCoreRequirementLabelMap(program);

function resolve(item: RoadmapItem, index = 0) {
  return resolveRoadmapItemId(item, semester, index, labelMap);
}

describe('normalizeCoreLabel', () => {
  it('strips the CORE: prefix and lowercases', () => {
    expect(normalizeCoreLabel('CORE: Scientific Knowledge Tier 1')).toBe(
      'scientific knowledge tier 1',
    );
    expect(normalizeCoreLabel('Scientific Knowledge Tier 1')).toBe(
      'scientific knowledge tier 1',
    );
  });

  it('unifies "&" and "and"', () => {
    expect(normalizeCoreLabel('CORE: Theological and Religious Studies Tier 1')).toBe(
      normalizeCoreLabel('Theological & Religious Studies Tier 1'),
    );
  });

  it('drops punctuation so 101-level matches "101 level"', () => {
    expect(normalizeCoreLabel('CAS Language Requirement (101-level)')).toBe(
      normalizeCoreLabel('CAS Language Requirement 101 level'),
    );
  });
});

describe('resolveRoadmapItemId', () => {
  it('returns a course/core ref as-is (ref wins)', () => {
    expect(resolve({ ref: 'COMP313' })).toEqual({ id: 'COMP313', isElective: false, registered: true });
    expect(resolve({ ref: 'CORE_SCI1' })).toEqual({ id: 'CORE_SCI1', isElective: false, registered: true });
  });

  it('resolves a label-only Core row to its requirement id', () => {
    expect(resolve({ label: 'CORE: Scientific Knowledge Tier 1', isElective: true })).toEqual({
      id: 'CORE_SCI1',
      isElective: false,
      registered: true,
    });
  });

  it('resolves through normalization ("and"/"&" and punctuation)', () => {
    expect(resolve({ label: 'CORE: Theological and Religious Studies Tier 1', isElective: true }).id).toBe('CORE_THEO1');
    expect(resolve({ label: 'CAS Language Requirement 101 level', isElective: true }).id).toBe('CAS_LANG1');
  });

  it('disambiguates Tier 1 vs Tier 2', () => {
    expect(resolve({ label: 'CORE: Scientific Knowledge Tier 1', isElective: true }).id).toBe('CORE_SCI1');
    expect(resolve({ label: 'CORE: Scientific Knowledge Tier 2', isElective: true }).id).toBe('CORE_SCI2');
  });

  it('does NOT resolve an ambiguous label that matches multiple requirements', () => {
    const r = resolve({ label: 'CAS Elective', isElective: true }, 4);
    expect(r.isElective).toBe(true);
    expect(r.id).toBe(electivePlaceholderId(2, 'Spring', 4));
  });

  it('falls through to a placeholder for a no-match elective', () => {
    const r = resolve({ label: 'COMP Free Elective', isElective: true }, 1);
    expect(r.isElective).toBe(true);
    expect(r.registered).toBe(true);
    expect(r.id).toBe(electivePlaceholderId(2, 'Spring', 1));
  });

  it('keeps a non-elective, no-match, label-only row inert (static, not registered)', () => {
    // Honors isElective: rows never marked elective are NOT reclassified into
    // shareable dashed placeholders (prevents the cross-program broadening).
    const r = resolve({ label: 'Applied Music: Voice (MUSC 280K)', isElective: false }, 3);
    expect(r).toEqual({ id: 'unknown-3', isElective: false, registered: false });
  });

  it('treats a bare label-only row (no isElective flag) as inert static', () => {
    const r = resolve({ label: 'Core' }, 2);
    expect(r).toEqual({ id: 'unknown-2', isElective: false, registered: false });
  });

  it('produces a byte-identical placeholder id (parity with prior behavior)', () => {
    expect(electivePlaceholderId(2, 'Spring', 2)).toBe('elective-2-spring-2');
  });
});
