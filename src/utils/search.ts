export function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesSearch(values: Array<string | number | null | undefined>, query: string): boolean {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  return values
    .filter(value => value !== undefined && value !== null)
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}
