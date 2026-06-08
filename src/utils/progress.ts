import { coreRequirementGroup, getCoreCatalogItemsForProgram } from './coreCatalog';
import type { CompletedSet, Program, ProgressItem } from '../types';

export interface RequirementStatus {
  completed: boolean;
  satisfiedByAlternate: boolean;
  actuallyCompleted: boolean;
}

export interface ProgressHelpers {
  isCompleted: (itemOrId: ProgressItem | string) => boolean;
  isRequirementSatisfied: (itemOrId: ProgressItem | string) => boolean;
  getRequirementStatus: (itemOrId: ProgressItem | string) => RequirementStatus;
  toggleItem: (itemOrId: ProgressItem | string) => void;
}

type ToggleProgress = (id: string) => void;

function itemKey(item: ProgressItem | undefined): string {
  if (item?.uniqueProgress) {
    return `id:${item.id}`;
  }
  if (item?.code && item?.title) {
    return `course:${item.code.trim().toUpperCase()}|${item.title.trim().toUpperCase()}`;
  }
  return `id:${item?.id}`;
}

function requirementKey(item: ProgressItem | undefined): string {
  return item?.requirementGroup ? `group:${item.requirementGroup}` : itemKey(item);
}

function requirementItems(program: Program): ProgressItem[] {
  const coreRequirements = (program.coreRequirements ?? []).map(item => ({
    ...item,
    requirementGroup: coreRequirementGroup(item.id),
  }));

  return [
    ...(program.courses ?? []),
    ...coreRequirements,
    ...Object.values(program.electiveOptions ?? {}).flatMap(group => group.courses ?? []),
    ...getCoreCatalogItemsForProgram(program),
  ];
}

export function createProgressHelpers(program: Program, completed: CompletedSet, toggle: ToggleProgress): ProgressHelpers {
  const idsByKey = new Map<string, Set<string>>();
  const keyById = new Map<string, string>();
  const idsByRequirement = new Map<string, Set<string>>();
  const requirementById = new Map<string, string>();

  for (const item of requirementItems(program)) {
    const key = itemKey(item);
    const reqKey = requirementKey(item);
    keyById.set(item.id, key);
    requirementById.set(item.id, reqKey);
    if (!idsByKey.has(key)) idsByKey.set(key, new Set());
    idsByKey.get(key)?.add(item.id);
    if (!idsByRequirement.has(reqKey)) idsByRequirement.set(reqKey, new Set());
    idsByRequirement.get(reqKey)?.add(item.id);
  }

  function idsFor(itemOrId: ProgressItem | string): string[] {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const key = typeof itemOrId === 'string'
      ? keyById.get(id)
      : (itemOrId.code && itemOrId.title ? itemKey(itemOrId) : keyById.get(id));
    return key ? [...(idsByKey.get(key) ?? [id])] : [id];
  }

  function isCompleted(itemOrId: ProgressItem | string): boolean {
    return idsFor(itemOrId).some(id => completed.has(id));
  }

  function requirementIdsFor(itemOrId: ProgressItem | string): string[] {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const key = typeof itemOrId === 'string'
      ? requirementById.get(id)
      : (itemOrId.requirementGroup ? requirementKey(itemOrId) : requirementById.get(id));
    return key ? [...(idsByRequirement.get(key) ?? [id])] : [id];
  }

  function isRequirementSatisfied(itemOrId: ProgressItem | string): boolean {
    return requirementIdsFor(itemOrId).some(id => completed.has(id));
  }

  function getRequirementStatus(itemOrId: ProgressItem | string): RequirementStatus {
    const itemIds = idsFor(itemOrId);
    const doneIds = requirementIdsFor(itemOrId).filter(id => completed.has(id));
    const itemDone = itemIds.some(id => completed.has(id));
    const isCountedChoice = itemDone && itemIds.includes(doneIds[0]);
    return {
      completed: isCountedChoice,
      satisfiedByAlternate: !isCountedChoice && doneIds.length > 0,
      actuallyCompleted: itemDone,
    };
  }

  function toggleItem(itemOrId: ProgressItem | string): void {
    const ids = idsFor(itemOrId);
    const nextDone = !ids.some(id => completed.has(id));

    for (const id of ids) {
      if (completed.has(id) !== nextDone) toggle(id);
    }
  }

  return { isCompleted, isRequirementSatisfied, getRequirementStatus, toggleItem };
}

export function calcDistinctDoneCredits(program: Program, completed: CompletedSet): number {
  const creditsByKey = new Map<string, number>();
  const doneKeys = new Set<string>();

  for (const item of requirementItems(program)) {
    const key = requirementKey(item);
    if (!creditsByKey.has(key)) creditsByKey.set(key, item.credits ?? 0);
    if (completed.has(item.id)) doneKeys.add(key);
  }

  return [...doneKeys].reduce<number>((sum, key) => sum + (creditsByKey.get(key) ?? 0), 0);
}

export function calcDistinctItemCredits(
  items: ProgressItem[],
  isCompleted: (item: ProgressItem) => boolean,
): number {
  const seen = new Set<string>();
  let total = 0;

  for (const item of items) {
    const key = itemKey(item);
    if (!isCompleted(item) || seen.has(key)) continue;
    seen.add(key);
    total += item.credits ?? 0;
  }

  return total;
}

export function calcRequiredCredits(items: ProgressItem[]): number {
  const creditsByRequirement = new Map<string, number>();

  for (const item of items) {
    const key = requirementKey(item);
    if (!creditsByRequirement.has(key)) creditsByRequirement.set(key, item.credits ?? 0);
  }

  return [...creditsByRequirement.values()].reduce((sum, credits) => sum + credits, 0);
}

export function calcSatisfiedRequirementCredits(
  items: ProgressItem[],
  isRequirementSatisfied: (item: ProgressItem) => boolean,
): number {
  const creditsByRequirement = new Map<string, number>();
  const satisfied = new Set<string>();

  for (const item of items) {
    const key = requirementKey(item);
    if (!creditsByRequirement.has(key)) creditsByRequirement.set(key, item.credits ?? 0);
    if (isRequirementSatisfied(item)) satisfied.add(key);
  }

  return [...satisfied].reduce<number>((sum, key) => sum + (creditsByRequirement.get(key) ?? 0), 0);
}

export function calcProgramRequirementDoneCredits(
  program: Program,
  isRequirementSatisfied: (item: ProgressItem) => boolean,
): number {
  const countedCourseKeys = new Set<string>();
  const requiredCourseCredits = calcSatisfiedDistinctProgramCredits(
    program.courses ?? [],
    isRequirementSatisfied,
    countedCourseKeys,
  );
  const electiveCredits = Object.values(program.electiveOptions ?? {}).reduce((sum, group) => {
    const done = calcSatisfiedDistinctProgramCredits(group.courses ?? [], isRequirementSatisfied, countedCourseKeys);
    return sum + Math.min(done, group.creditsRequired);
  }, 0);

  return requiredCourseCredits + electiveCredits;
}

export function calcProgramRequirementCreditGoal(program: Program): number {
  if (program.kind === 'minor') return program.minorCredits ?? program.totalCredits;
  if (program.majorCredits) return program.majorCredits;

  const requiredCourseCredits = calcRequiredCredits(program.courses ?? []);
  const electiveCredits = Object.values(program.electiveOptions ?? {}).reduce(
    (sum, group) => sum + group.creditsRequired,
    0,
  );

  return requiredCourseCredits + electiveCredits;
}

function calcSatisfiedDistinctProgramCredits(
  items: ProgressItem[],
  isRequirementSatisfied: (item: ProgressItem) => boolean,
  countedCourseKeys: Set<string>,
): number {
  const creditsByRequirement = new Map<string, number>();
  const courseKeyByRequirement = new Map<string, string>();
  const satisfied = new Set<string>();

  for (const item of items) {
    const reqKey = requirementKey(item);
    if (!creditsByRequirement.has(reqKey)) creditsByRequirement.set(reqKey, item.credits ?? 0);
    if (!courseKeyByRequirement.has(reqKey)) courseKeyByRequirement.set(reqKey, itemKey(item));
    if (isRequirementSatisfied(item)) satisfied.add(reqKey);
  }

  let total = 0;
  for (const reqKey of satisfied) {
    const courseKey = courseKeyByRequirement.get(reqKey);
    if (!courseKey || countedCourseKeys.has(courseKey)) continue;
    countedCourseKeys.add(courseKey);
    total += creditsByRequirement.get(reqKey) ?? 0;
  }

  return total;
}
