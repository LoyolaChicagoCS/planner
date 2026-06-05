function itemKey(item) {
  if (item?.code && item?.title) {
    return `course:${item.code.trim().toUpperCase()}|${item.title.trim().toUpperCase()}`;
  }
  return `id:${item?.id}`;
}

function requirementKey(item) {
  return item?.requirementGroup ? `group:${item.requirementGroup}` : itemKey(item);
}

function requirementItems(program) {
  return [
    ...(program.courses ?? []),
    ...(program.coreRequirements ?? []),
    ...Object.values(program.electiveOptions ?? {}).flatMap(group => group.courses ?? []),
  ];
}

export function createProgressHelpers(program, completed, toggle) {
  const idsByKey = new Map();
  const keyById = new Map();
  const idsByRequirement = new Map();
  const requirementById = new Map();

  for (const item of requirementItems(program)) {
    const key = itemKey(item);
    const reqKey = requirementKey(item);
    keyById.set(item.id, key);
    requirementById.set(item.id, reqKey);
    if (!idsByKey.has(key)) idsByKey.set(key, new Set());
    idsByKey.get(key).add(item.id);
    if (!idsByRequirement.has(reqKey)) idsByRequirement.set(reqKey, new Set());
    idsByRequirement.get(reqKey).add(item.id);
  }

  function idsFor(itemOrId) {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const key = typeof itemOrId === 'string'
      ? keyById.get(id)
      : (itemOrId.code && itemOrId.title ? itemKey(itemOrId) : keyById.get(id));
    return key ? [...(idsByKey.get(key) ?? [id])] : [id];
  }

  function isCompleted(itemOrId) {
    return idsFor(itemOrId).some(id => completed.has(id));
  }

  function requirementIdsFor(itemOrId) {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    const key = typeof itemOrId === 'string'
      ? requirementById.get(id)
      : (itemOrId.requirementGroup ? requirementKey(itemOrId) : requirementById.get(id));
    return key ? [...(idsByRequirement.get(key) ?? [id])] : [id];
  }

  function isRequirementSatisfied(itemOrId) {
    return requirementIdsFor(itemOrId).some(id => completed.has(id));
  }

  function getRequirementStatus(itemOrId) {
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

  function toggleItem(itemOrId) {
    const ids = idsFor(itemOrId);
    const nextDone = !ids.some(id => completed.has(id));

    for (const id of ids) {
      if (completed.has(id) !== nextDone) toggle(id);
    }
  }

  return { isCompleted, isRequirementSatisfied, getRequirementStatus, toggleItem };
}

export function calcDistinctDoneCredits(program, completed) {
  const creditsByKey = new Map();
  const doneKeys = new Set();

  for (const item of requirementItems(program)) {
    const key = requirementKey(item);
    if (!creditsByKey.has(key)) creditsByKey.set(key, item.credits ?? 0);
    if (completed.has(item.id)) doneKeys.add(key);
  }

  return [...doneKeys].reduce((sum, key) => sum + (creditsByKey.get(key) ?? 0), 0);
}

export function calcDistinctItemCredits(items, isCompleted) {
  const seen = new Set();
  let total = 0;

  for (const item of items) {
    const key = itemKey(item);
    if (!isCompleted(item) || seen.has(key)) continue;
    seen.add(key);
    total += item.credits ?? 0;
  }

  return total;
}

export function calcRequiredCredits(items) {
  const creditsByRequirement = new Map();

  for (const item of items) {
    const key = requirementKey(item);
    if (!creditsByRequirement.has(key)) creditsByRequirement.set(key, item.credits ?? 0);
  }

  return [...creditsByRequirement.values()].reduce((sum, credits) => sum + credits, 0);
}

export function calcSatisfiedRequirementCredits(items, isRequirementSatisfied) {
  const creditsByRequirement = new Map();
  const satisfied = new Set();

  for (const item of items) {
    const key = requirementKey(item);
    if (!creditsByRequirement.has(key)) creditsByRequirement.set(key, item.credits ?? 0);
    if (isRequirementSatisfied(item)) satisfied.add(key);
  }

  return [...satisfied].reduce((sum, key) => sum + (creditsByRequirement.get(key) ?? 0), 0);
}
