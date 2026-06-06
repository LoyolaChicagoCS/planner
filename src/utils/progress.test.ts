import { describe, expect, it } from 'vitest';
import {
  calcDistinctDoneCredits,
  calcDistinctItemCredits,
  calcRequiredCredits,
  calcSatisfiedRequirementCredits,
  createProgressHelpers,
} from './progress';
import { getCoreCatalogItemsForRequirement } from './coreCatalog';
import { PROGRAMS } from '../data/programs';
import type { Program, ProgressItem } from '../types';

const duplicateCourseProgram: Program = {
  id: 'duplicates',
  name: 'Duplicate Course Program',
  degree: 'BS',
  school: 'Loyola University Chicago',
  totalCredits: 120,
  courses: [
    { id: 'COMP313', code: 'COMP 313', title: 'Object-Oriented Design', credits: 3 },
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
  coreRequirements: [],
  roadmap: [],
  checklist: [],
};

const eitherOrProgram: Program = {
  id: 'either-or',
  name: 'Either Or Program',
  degree: 'BS',
  school: 'Loyola University Chicago',
  totalCredits: 120,
  courses: [
    {
      id: 'COMP310',
      code: 'COMP 310',
      title: 'Operating Systems',
      credits: 3,
      requirementGroup: 'systems',
    },
    {
      id: 'COMP362',
      code: 'COMP 362',
      title: 'Computer Architecture',
      credits: 3,
      requirementGroup: 'systems',
    },
  ],
  electiveOptions: {},
  coreRequirements: [],
  roadmap: [],
  checklist: [],
};

describe('progress helpers', () => {
  it('shares completion across duplicate concrete courses by course identity', () => {
    const completed = new Set(['COMP313']);
    const helpers = createProgressHelpers(duplicateCourseProgram, completed, () => undefined);
    const duplicateElective = duplicateCourseProgram.electiveOptions?.restricted.courses?.[0];

    expect(duplicateElective).toBeDefined();
    expect(helpers.isCompleted('ELEC_COMP313')).toBe(true);
    expect(helpers.isCompleted(duplicateElective as ProgressItem)).toBe(true);
    expect(calcDistinctDoneCredits(duplicateCourseProgram, completed)).toBe(3);
  });

  it('toggles all duplicate concrete course IDs together', () => {
    const toggled: string[] = [];
    const helpers = createProgressHelpers(duplicateCourseProgram, new Set(), id => toggled.push(id));

    helpers.toggleItem('COMP313');

    expect(toggled.sort()).toEqual(['COMP313', 'ELEC_COMP313']);
  });

  it('marks unchosen either-or siblings as alternate-satisfied and counts the group once', () => {
    const completed = new Set(['COMP310', 'COMP362']);
    const helpers = createProgressHelpers(eitherOrProgram, completed, () => undefined);

    expect(helpers.getRequirementStatus('COMP310')).toEqual({
      completed: true,
      satisfiedByAlternate: false,
      actuallyCompleted: true,
    });
    expect(helpers.getRequirementStatus('COMP362')).toEqual({
      completed: false,
      satisfiedByAlternate: true,
      actuallyCompleted: true,
    });
    expect(calcDistinctDoneCredits(eitherOrProgram, completed)).toBe(3);
    expect(calcRequiredCredits(eitherOrProgram.courses ?? [])).toBe(3);
    expect(calcSatisfiedRequirementCredits(eitherOrProgram.courses ?? [], helpers.isRequirementSatisfied)).toBe(3);
  });

  it('counts duplicate item credits only once in category-level calculations', () => {
    const items = [
      { id: 'COMP313', code: 'COMP 313', title: 'Object-Oriented Design', credits: 3 },
      { id: 'ELEC_COMP313', code: 'COMP 313', title: 'Object-Oriented Design', credits: 3 },
    ];

    expect(calcDistinctItemCredits(items, () => true)).toBe(3);
  });
});

describe('Core progress integration', () => {
  it('lets a concrete Core catalog course satisfy its general Core requirement', () => {
    const csProgram = PROGRAMS.find(program => program.id === 'cs');
    expect(csProgram).toBeDefined();

    const [historicalCoreCourse] = getCoreCatalogItemsForRequirement(csProgram as Program, 'CORE_HIST1');
    expect(historicalCoreCourse).toBeDefined();

    const completed = new Set([historicalCoreCourse.id]);
    const helpers = createProgressHelpers(csProgram as Program, completed, () => undefined);

    expect(helpers.isRequirementSatisfied('CORE_HIST1')).toBe(true);
    expect(helpers.getRequirementStatus('CORE_HIST1')).toEqual({
      completed: false,
      satisfiedByAlternate: true,
      actuallyCompleted: false,
    });
    expect(calcDistinctDoneCredits(csProgram as Program, completed)).toBe(3);
  });
});
