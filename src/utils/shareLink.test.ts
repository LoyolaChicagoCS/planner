import { describe, expect, it } from 'vitest';
import {
  decodeCompletedIds,
  encodeCompletedIds,
  getValidProgressIds,
  validateProgressIds,
} from './shareLink';
import { electivePlaceholderId } from './roadmap';
import type { Program } from '../types';

const program: Program = {
  id: 'sample',
  name: 'Sample',
  degree: 'BS',
  school: 'Loyola University Chicago',
  totalCredits: 120,
  courses: [
    { id: 'COMP170', code: 'COMP 170', title: 'Intro Programming', credits: 3 },
  ],
  electiveOptions: {
    restricted: {
      label: 'Restricted Electives',
      creditsRequired: 3,
      courses: [
        { id: 'ELEC_COMP313', code: 'COMP 313', title: 'Object-Oriented Design', credits: 3 },
      ],
    },
  },
  coreRequirements: [
    { id: 'CORE_HIST1', label: 'Historical Knowledge Tier 1', credits: 3 },
  ],
  roadmap: [
    {
      year: 2,
      semester: 'Fall',
      credits: 6,
      items: [
        { ref: 'COMP170' },
        { isElective: true, label: 'Free elective', credits: 3 },
      ],
    },
  ],
  checklist: [
    {
      id: 'TRANSFER_CALC',
      label: 'Transfer calculus credit',
      courseRef: 'MATH161',
      alsoCourseRef: 'MATH162',
    },
  ],
};

describe('shareLink', () => {
  it('encodes completed IDs in stable dot-delimited order', () => {
    expect(encodeCompletedIds(new Set(['MATH161', 'COMP170', 'CORE_HIST1'])))
      .toBe('COMP170.CORE_HIST1.MATH161');
  });

  it('rejects IDs that would corrupt the share-link delimiter contract', () => {
    expect(() => validateProgressIds(['COMP170', 'BAD.ID'])).toThrow(/dots or whitespace/);
    expect(() => validateProgressIds(['COMP170', 'BAD ID'])).toThrow(/dots or whitespace/);
  });

  it('decodes dot-delimited and legacy comma-delimited links while filtering invalid IDs', () => {
    const validIds = new Set(['COMP170', 'MATH161']);

    expect(decodeCompletedIds('COMP170.MATH161.UNKNOWN.BAD.ID', validIds))
      .toEqual(['COMP170', 'MATH161']);
    expect(decodeCompletedIds('COMP170,MATH161,UNKNOWN', validIds))
      .toEqual(['COMP170', 'MATH161']);
  });

  it('collects valid IDs from courses, electives, Core requirements, roadmap placeholders, and checklist refs', () => {
    const ids = getValidProgressIds([program], 'sample');

    expect([...ids]).toEqual(expect.arrayContaining([
      'COMP170',
      'ELEC_COMP313',
      'CORE_HIST1',
      'TRANSFER_CALC',
      'MATH161',
      'MATH162',
      'elective-2-fall-1',
    ]));
  });

  it('registers a label-matched Core roadmap row as its requirement id, and never a static row', () => {
    const withCoreRow: Program = {
      ...program,
      roadmap: [
        {
          year: 1,
          semester: 'Spring',
          credits: 6,
          items: [
            // Label-only Core row (no ref, no isElective) -> resolves to CORE_HIST1.
            { label: 'CORE: Historical Knowledge Tier 1', credits: 3 },
            // Inert non-elective label row -> stays static, must NOT be registered.
            { label: 'Applied Music: Voice', credits: 3, isElective: false },
          ],
        },
      ],
    };
    const ids = getValidProgressIds([withCoreRow], 'sample');

    expect(ids.has('CORE_HIST1')).toBe(true);
    expect([...ids].some(id => id.startsWith('unknown-'))).toBe(false);
  });

  it('generates URL-safe elective placeholder IDs from display labels', () => {
    expect(electivePlaceholderId(2, 'Semester III', 0)).toBe('elective-2-semester-iii-0');
  });
});
