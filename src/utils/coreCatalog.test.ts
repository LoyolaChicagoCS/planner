import { describe, expect, it } from 'vitest';
import { PROGRAMS } from '../data/programs';
import type { Program } from '../types';
import {
  coreRequirementElementId,
  coreRequirementGroup,
  getAllCoreCatalogCourseIds,
  getCoreCatalogAreasForProgram,
  getCoreCatalogItemsForRequirement,
  hasConcreteCoreSelection,
} from './coreCatalog';

const csProgram = PROGRAMS.find(program => program.id === 'cs') as Program;
const aiMinor = PROGRAMS.find(program => program.id === 'ai-minor') as Program;

describe('coreCatalog', () => {
  it('uses stable IDs for Core requirement groups and page anchors', () => {
    expect(coreRequirementGroup('CORE_HIST1')).toBe('core:CORE_HIST1');
    expect(coreRequirementElementId('CORE_HIST1')).toBe('core-requirement-CORE_HIST1');
  });

  it('returns only Core areas required by the selected program', () => {
    const degreeAreas = getCoreCatalogAreasForProgram(csProgram);
    const minorAreas = getCoreCatalogAreasForProgram(aiMinor);

    expect(degreeAreas.length).toBeGreaterThan(0);
    expect(degreeAreas.flatMap(area => area.groups.map(group => group.requirementId)))
      .toContain('CORE_QUANT');
    expect(minorAreas).toEqual([]);
  });

  it('maps concrete Core courses to the matching general requirement ID', () => {
    const quantitativeCourses = getCoreCatalogItemsForRequirement(csProgram, 'CORE_QUANT');

    expect(quantitativeCourses.length).toBeGreaterThan(0);
    expect(quantitativeCourses.every(course => course.coreRequirementId === 'CORE_QUANT')).toBe(true);
    expect(quantitativeCourses.every(course => course.requirementGroup === 'core:CORE_QUANT')).toBe(true);
  });

  it('detects concrete Core selections for general Core requirements', () => {
    const [course] = getCoreCatalogItemsForRequirement(csProgram, 'CORE_HIST1');

    expect(hasConcreteCoreSelection(csProgram, new Set([course.id]), 'CORE_HIST1')).toBe(true);
    expect(hasConcreteCoreSelection(csProgram, new Set([course.id]), 'CORE_HIST2')).toBe(false);
  });

  it('exposes all concrete Core catalog course IDs for share-link validation', () => {
    const ids = getAllCoreCatalogCourseIds();

    expect(ids.length).toBeGreaterThan(100);
    expect(ids.every(id => id.startsWith('CORE_'))).toBe(true);
  });
});
