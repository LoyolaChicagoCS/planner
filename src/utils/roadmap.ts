import type { Program, RoadmapItem, RoadmapSemester } from '../types';

/**
 * Roadmap item identity resolution — the single source of truth for turning a
 * roadmap row into the progress id it represents. Both the Roadmap UI
 * (`src/components/Roadmap.tsx`) and the share-link id computation
 * (`src/utils/shareLink.ts`) call this so they can never disagree.
 *
 * A roadmap row resolves in one of three ways:
 *   1. An explicit `ref` to a course or Core-requirement id — used as-is.
 *   2. A label-only Core placeholder whose label matches exactly one of the
 *      program's `coreRequirements` (after normalization) — resolves to that
 *      requirement id, so a concrete Core-course selection marks it complete.
 *   3. Anything else (free/restricted/ambiguous electives) — a stable,
 *      position-based placeholder id, unchanged from historical behavior.
 */

function slugProgressPart(value: string | number): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Stable id for a roadmap elective slot that has no fixed course identity. */
export function electivePlaceholderId(year: number, semester: string, index: number): string {
  return `elective-${slugProgressPart(year)}-${slugProgressPart(semester)}-${index}`;
}

/**
 * Normalize a Core label for matching: lowercase, drop a leading "CORE:"
 * prefix, unify "&"/"and", strip punctuation, and collapse whitespace. This
 * lets "CORE: Theological and Religious Studies Tier 1" match the requirement
 * label "Theological & Religious Studies Tier 1".
 */
export function normalizeCoreLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/^\s*core:\s*/, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Build a `normalizedLabel -> requirementId` map for a program's Core
 * requirements, keeping only labels that map to exactly one requirement.
 * Ambiguous labels (e.g. three identical "CAS Elective" rows) are omitted, so a
 * roadmap row bearing an ambiguous label safely falls through to a placeholder.
 */
export function buildCoreRequirementLabelMap(program: Program): Map<string, string> {
  const counts = new Map<string, number>();
  const firstId = new Map<string, string>();

  for (const req of program.coreRequirements ?? []) {
    if (!req.label) continue;
    const key = normalizeCoreLabel(req.label);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!firstId.has(key)) firstId.set(key, req.id);
  }

  const unique = new Map<string, string>();
  for (const [key, count] of counts) {
    if (count === 1) unique.set(key, firstId.get(key)!);
  }
  return unique;
}

export interface RoadmapItemResolution {
  /** The progress id this row toggles / reads. */
  id: string;
  /**
   * True when the row is an anonymous positional placeholder (no fixed course
   * or requirement identity) — drives the "choose from list" elective display.
   */
  isElective: boolean;
  /**
   * True when the id is a real, shareable progress id (a course/requirement ref
   * or an explicit elective placeholder). False for inert `static` rows, which
   * are excluded from share-link valid-id computation — preserving historical
   * behavior for label-only rows that were never marked `isElective`.
   */
  registered: boolean;
}

/**
 * Resolve a single roadmap item to its progress id. `coreLabelMap` is the
 * program's map from `buildCoreRequirementLabelMap`; pass it in so callers can
 * build it once per program rather than per row.
 *
 * Resolution order — `ref` and a unique Core-label match are the only things
 * that link a row to a real requirement/course. Only rows explicitly marked
 * `isElective` become shareable elective placeholders; every other unmatched
 * row stays an inert `static` row (as it rendered before this resolver
 * existed), so the fix does not silently reclassify unrelated roadmap rows.
 */
export function resolveRoadmapItemId(
  item: RoadmapItem,
  semester: RoadmapSemester,
  index: number,
  coreLabelMap: Map<string, string>,
): RoadmapItemResolution {
  if (item.ref) {
    return { id: item.ref, isElective: false, registered: true };
  }

  if (item.label) {
    const requirementId = coreLabelMap.get(normalizeCoreLabel(item.label));
    if (requirementId) {
      return { id: requirementId, isElective: false, registered: true };
    }
  }

  if (item.isElective) {
    return {
      id: electivePlaceholderId(semester.year, semester.semester, index),
      isElective: true,
      registered: true,
    };
  }

  // Inert label-only (or empty) row with no requirement/course identity and no
  // elective marker — keep its historical non-shareable placeholder id.
  return { id: `unknown-${index}`, isElective: false, registered: false };
}
