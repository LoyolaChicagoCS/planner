import optionalData from '../data/optional.json';

const DELIMITER = '.';

function addId(ids, id) {
  if (id) ids.add(id);
}

function addCourseIds(ids, courses = []) {
  for (const course of courses) addId(ids, course.id);
}

export function getValidProgressIds(programs, programId) {
  const ids = new Set();
  const selectedPrograms = programId
    ? programs.filter(program => program.id === programId)
    : programs;

  for (const program of selectedPrograms) {
    addCourseIds(ids, program.courses);
    addCourseIds(ids, program.coreRequirements);
    addCourseIds(ids, Object.values(program.electiveOptions ?? {}).flatMap(group => group.courses ?? []));

    for (const item of program.checklist ?? []) {
      addId(ids, item.id);
      addId(ids, item.courseRef);
      addId(ids, item.alsoCourseRef);
    }

    for (const semester of program.roadmap ?? []) {
      for (const [index, item] of (semester.items ?? []).entries()) {
        if (item.ref) addId(ids, item.ref);
        if (item.isElective) addId(ids, `elective-${semester.year}-${semester.semester}-${index}`);
      }
    }
  }

  addCourseIds(ids, optionalData.writingIntensive?.courses);
  addCourseIds(ids, optionalData.coreEligible?.courses);

  return ids;
}

export function validateProgressIds(ids) {
  const invalid = [...ids].filter(id => id.includes(DELIMITER) || /\s/.test(id));
  if (invalid.length > 0) {
    throw new Error(`Progress IDs cannot contain dots or whitespace: ${invalid.join(', ')}`);
  }
}

export function encodeCompletedIds(completed) {
  const ids = [...completed].sort();
  validateProgressIds(ids);
  return ids.join(DELIMITER);
}

export function decodeCompletedIds(value, validIds) {
  if (!value) return [];

  const delimiter = value.includes(',') ? ',' : DELIMITER;
  return value
    .split(delimiter)
    .filter(Boolean)
    .filter(id => !id.includes(DELIMITER) && !/\s/.test(id))
    .filter(id => !validIds || validIds.has(id));
}
