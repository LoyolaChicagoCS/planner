import coreCourseData from '../data/coreCourses.json';

export function coreRequirementGroup(requirementId) {
  return `core:${requirementId}`;
}

export function coreRequirementElementId(requirementId) {
  return `core-requirement-${requirementId}`;
}

function requiredCoreIds(program) {
  return new Set((program.coreRequirements ?? []).map(req => req.id));
}

export function getCoreCatalogAreasForProgram(program) {
  const requiredIds = requiredCoreIds(program);

  return coreCourseData.areas
    .map(area => {
      const groups = area.groups
        .map((group, index) => {
          const requirementId = area.requirementIds[index] ?? area.requirementIds[0];
          if (!requiredIds.has(requirementId)) return null;

          return {
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
          };
        })
        .filter(Boolean);

      if (groups.length === 0) return null;

      return { ...area, groups };
    })
    .filter(Boolean);
}

export function getCoreCatalogItemsForProgram(program) {
  return getCoreCatalogAreasForProgram(program).flatMap(area =>
    area.groups.flatMap(group => group.courses)
  );
}

export function getCoreCatalogItemsForRequirement(program, requirementId) {
  return getCoreCatalogAreasForProgram(program).flatMap(area =>
    area.groups
      .filter(group => group.requirementId === requirementId)
      .flatMap(group => group.courses)
  );
}

export function hasConcreteCoreSelection(program, completed, requirementId) {
  return getCoreCatalogItemsForRequirement(program, requirementId).some(course => completed.has(course.id));
}

export function getAllCoreCatalogCourseIds() {
  return coreCourseData.areas.flatMap(area =>
    area.groups.flatMap(group => group.courses.map(course => course.id))
  );
}
