export function normalizeSearch(value) {
  return value.trim().toLowerCase();
}

export function matchesSearch(values, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return values
    .filter(value => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}
