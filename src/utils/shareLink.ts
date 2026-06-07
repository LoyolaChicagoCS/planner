import optionalData from '../data/optional.json';
import { getAllCoreCatalogCourseIds } from './coreCatalog';
import type { Course, Program, ProgressItem } from '../types';

const DELIMITER = '.';

function slugProgressPart(value: string | number): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function electivePlaceholderId(year: number, semester: string, index: number): string {
  return `elective-${slugProgressPart(year)}-${slugProgressPart(semester)}-${index}`;
}

interface OptionalCourseGroup {
  courses?: Course[];
}

interface OptionalData {
  writingIntensive?: OptionalCourseGroup;
  coreEligible?: OptionalCourseGroup;
}

const typedOptionalData = optionalData as OptionalData;

function addId(ids: Set<string>, id?: string): void {
  if (id) ids.add(id);
}

function addCourseIds(ids: Set<string>, courses: ProgressItem[] = []): void {
  for (const course of courses) addId(ids, course.id);
}

export function getValidProgressIds(programs: Program[], programId?: string): Set<string> {
  const ids = new Set<string>();
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
        if (item.isElective) addId(ids, electivePlaceholderId(semester.year, semester.semester, index));
      }
    }
  }

  addCourseIds(ids, typedOptionalData.writingIntensive?.courses);
  addCourseIds(ids, typedOptionalData.coreEligible?.courses);
  for (const id of getAllCoreCatalogCourseIds()) addId(ids, id);

  return ids;
}

export function validateProgressIds(ids: Iterable<string>): void {
  const invalid = [...ids].filter(id => id.includes(DELIMITER) || /\s/.test(id));
  if (invalid.length > 0) {
    throw new Error(`Progress IDs cannot contain dots or whitespace: ${invalid.join(', ')}`);
  }
}

export function encodeCompletedIds(completed: Iterable<string>): string {
  const ids = [...completed].sort();
  validateProgressIds(ids);
  return ids.join(DELIMITER);
}

export function decodeCompletedIds(value: string | null, validIds?: ReadonlySet<string>): string[] {
  if (!value) return [];

  const delimiter = value.includes(',') ? ',' : DELIMITER;
  return value
    .split(delimiter)
    .filter(Boolean)
    .filter(id => !id.includes(DELIMITER) && !/\s/.test(id))
    .filter(id => !validIds || validIds.has(id));
}
