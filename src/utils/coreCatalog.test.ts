import { describe, expect, it } from 'vitest';
import { PROGRAMS } from '../data/programs';
import coreCourseData from '../data/coreCourses.json';
import type { CoreCatalogData, Program } from '../types';
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

/**
 * Positional-join guards for the Core catalog.
 *
 * Each area pairs `groups[i]` with `requirementIds[i]` by index, and
 * `getCoreCatalogAreasForProgram` falls back to `requirementIds[0]` when an
 * index is missing. That fallback can silently attach a whole group of courses
 * to the wrong requirement if the two parallel arrays drift out of alignment.
 * These guards make such drift fail loudly.
 */
describe('coreCatalog positional join', () => {
  const areas = (coreCourseData as CoreCatalogData).areas;

  it('keeps requirementIds and groups length-aligned (no [0] fallback)', () => {
    const misaligned = areas
      .filter(area => area.requirementIds.length !== area.groups.length)
      .map(area => `${area.id}: ${area.requirementIds.length} ids vs ${area.groups.length} groups`);
    expect(misaligned, misaligned.join('\n')).toEqual([]);
  });

  it('references only requirement IDs that exist in some program', () => {
    const known = new Set(
      PROGRAMS.flatMap(p => (p.coreRequirements ?? []).map(r => r.id)),
    );
    const unknown = areas.flatMap(area =>
      area.requirementIds.filter(id => !known.has(id)).map(id => `${area.id}: ${id}`),
    );
    expect(unknown, unknown.join('\n')).toEqual([]);
  });

  it('matches the committed area -> group/requirement structure (pins order)', () => {
    const structure = areas.map(area => ({
      area: area.id,
      groups: area.groups.map((group, index) => ({
        groupLabel: group.label,
        requirementId: area.requirementIds[index] ?? null,
      })),
    }));
    expect(structure).toMatchSnapshot();
  });
});
