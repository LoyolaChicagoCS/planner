import coreCourseData from '../data/coreCourses.json';
import type {
  CompletedSet,
  CoreCatalogArea,
  CoreCatalogCourse,
  CoreCatalogData,
  CoreCatalogGroup,
  Program,
} from '../types';

const typedCoreCourseData = coreCourseData as CoreCatalogData;

export function coreRequirementGroup(requirementId: string): string {
  return `core:${requirementId}`;
}

export function coreRequirementElementId(requirementId: string): string {
  return `core-requirement-${requirementId}`;
}

function requiredCoreIds(program: Program): Set<string> {
  return new Set((program.coreRequirements ?? []).map(req => req.id));
}

export function getCoreCatalogAreasForProgram(program: Program): CoreCatalogArea[] {
  const requiredIds = requiredCoreIds(program);
  const areas: CoreCatalogArea[] = [];

  for (const area of typedCoreCourseData.areas) {
    const groups: CoreCatalogGroup[] = [];

    for (const [index, group] of area.groups.entries()) {
      const requirementId = area.requirementIds[index] ?? area.requirementIds[0];
      if (!requiredIds.has(requirementId)) continue;

      groups.push({
        ...group,
        requirementId,
        requirementGroup: coreRequirementGroup(requirementId),
        courses: group.courses.map(course => ({
          ...course,
          coreAreaId: area.id,
          coreAreaName: area.name,
          coreRequirementId: requirementId,
          requirementGroup: coreRequirementGroup(requirementId),
        })),
      });
    }

    if (groups.length > 0) areas.push({ ...area, groups });
  }

  return areas;
}

export function getCoreCatalogItemsForProgram(program: Program): CoreCatalogCourse[] {
  return getCoreCatalogAreasForProgram(program).flatMap(area =>
    area.groups.flatMap(group => group.courses)
  );
}

export function getCoreCatalogItemsForRequirement(program: Program, requirementId: string): CoreCatalogCourse[] {
  return getCoreCatalogAreasForProgram(program).flatMap(area =>
    area.groups
      .filter(group => group.requirementId === requirementId)
      .flatMap(group => group.courses)
  );
}

export function hasConcreteCoreSelection(program: Program, completed: CompletedSet, requirementId: string): boolean {
  return getCoreCatalogItemsForRequirement(program, requirementId).some(course => completed.has(course.id));
}

export function getAllCoreCatalogCourseIds(): string[] {
  return typedCoreCourseData.areas.flatMap(area =>
    area.groups.flatMap(group => group.courses.map(course => course.id))
  );
}
