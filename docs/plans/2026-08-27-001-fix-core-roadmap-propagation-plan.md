---
title: "fix: Core-requirement selections propagate to the Roadmap tab"
type: fix
status: completed
created: 2026-08-27
execution_posture: test-first
---

# fix: Core-requirement selections propagate to the Roadmap tab

## Problem Frame

On a program's **Roadmap** tab, University-Core rows (e.g. "CORE: Scientific Knowledge
Tier 1") are label-only `isElective` placeholders with **no `ref`** to the Core
requirement they describe (`CORE_SCI1`). Because they carry a synthetic, position-based
id (`elective-<year>-<sem>-<index>`) instead of the requirement id, selecting a concrete
Core course on the **Core** tab (ENVS 101 → `CORE_ENVS101`, which maps to `CORE_SCI1`)
never marks the matching Roadmap row complete. The **Courses** tab already works, because
its University-Core rows are bound to the real `CORE_SCI1` id.

Reproduced locally and on production (`https://advising.cs.luc.edu/?p=cs&d=CORE_ENVS101`):
Courses tab shows "✓ … satisfied by selected Core course"; Roadmap shows no check.

The label-only-Core-placeholder pattern spans ~100 rows across 9 programs; the affected
set is **mixed** — `cs` is a `generated: true` program, the other 8 are legacy hand files.

---

## Approach (settled)

Do **not** hand-annotate roadmap rows with `ref`s (that would duplicate a fact the data
already implies, in ~100 places, across two different authoring mechanisms, and could be
silently dropped by the yearly catalog re-scrape). Instead, **derive** the roadmap-row →
Core-requirement link at runtime from data already present — the program's own
`coreRequirements` list — via a single shared resolver that both `Roadmap.tsx` and
`shareLink.ts` call.

This fixes all 9 programs (generated and hand files) uniformly, touches no data, never
interacts with the generation pipeline or drift guard, and cannot fall out of sync. It
also removes a pre-existing DRY violation: today `Roadmap.tsx` and `shareLink.ts` each
independently branch on `isElective`.

### Resolver contract (directional guidance, not implementation spec)

```
resolveRoadmapItemId(program, semester, item, index):
  1. item.ref present            -> resolve to a course id OR a coreRequirement id
  2. else label matches EXACTLY ONE coreRequirement (after normalization)
                                 -> that requirement's id
  3. else                        -> positional elective placeholder (unchanged)
```

- Normalization: lowercase, strip a leading `core:` prefix, unify `&`/`and`, drop
  punctuation, collapse whitespace.
- **Unique-match guard:** auto-resolve only when the normalized label matches exactly one
  requirement. Ambiguous labels (three identical "CAS Elective" rows) and no-match labels
  ("COMP Free Elective", "First Year Seminar") fall through to the placeholder — behavior
  identical to today.

---

## Scope Boundaries

**In scope**
- A shared roadmap-item resolver + label normalizer.
- Refactor `Roadmap.tsx` and `shareLink.ts` to use it (removes duplicated `isElective` logic).
- Test guards for the new resolver and the pre-existing Core catalog positional join.
- The already-drafted Playwright propagation test + vitest e2e exclusion.

**Deferred to Follow-Up Work**
- Deeper model refactor of the Core requirement/catalog structure (anemic requirement
  stubs, the four-conventions completion bag, positional-placeholder identity). Noted as
  structural debt; not required to fix this bug.
- A proposed `CONTRIBUTING.md` for the upstream repo.

**Out of scope / non-goals**
- No data edits to any `src/data/*.json`.
- No changes to the program-generation pipeline (`scripts/build-programs.mjs`, extracts,
  overlays, supplements) or the drift guard.
- No change to how genuine electives behave.

---

## User Stories

**US1 — Roadmap reflects a concrete Core selection.**
As a student, when I pick a specific Core course on the Core tab, the matching Core row on
the Roadmap tab shows as satisfied, so the Roadmap and Courses tabs agree.

**US2 — Genuine electives are untouched.**
As a student, free/restricted/ambiguous elective rows on the Roadmap still behave as
before (individually checkable placeholders), with no accidental linking.

**US3 — A mis-aligned label fails loudly, not silently.**
As a maintainer, if a roadmap label or requirement label drifts so a row stops resolving,
starts resolving to the wrong requirement, or becomes ambiguous, a test fails and names
the exact program and row — so the bug can't quietly return.

**US4 — The Core catalog positional join can't silently mis-map.**
As a maintainer, if the `coreCourses.json` `groups` / `requirementIds` parallel arrays
drift out of alignment (length or order), a test fails — so a whole group of courses can
never be silently attached to the wrong requirement via the `?? requirementIds[0]`
fallback.

**US5 — No divergence between rendering and share-links.**
As a maintainer, the Roadmap rendering and the share-link id computation resolve roadmap
rows the same way, because they share one resolver.

### Acceptance Examples

- **AE1 (US1):** Program `cs`, no prior progress → Core tab → select ENVS 101 → Roadmap
  tab, Year 2 Spring → the "Scientific Knowledge Tier 1" row shows ✓
  ("Requirement satisfied by selected Core course").
- **AE2 (US1):** With `?d=CORE_ENVS101` in the URL, the Roadmap Tier 1 row loads already
  satisfied.
- **AE3 (US2):** The three "CAS Elective" rows and "COMP Free Elective" remain
  independent, unchecked placeholders after selecting a Core course.
- **AE4 (US3):** Renaming a `cs` roadmap Core label so it no longer matches its
  requirement flips its snapshot entry to "unresolved" and fails the resolution snapshot
  test.
- **AE5 (US4):** Removing one entry from a `coreCourses.json` area's `requirementIds` (so
  it is shorter than `groups`) fails the length-alignment test for that area.

---

## Implementation Units

> Execution posture: **test-first** for every feature-bearing unit. Write the failing
> test(s) named in each unit, then implement until green. Do not expand into
> RED/GREEN/REFACTOR micro-steps.

### U1. Shared roadmap-item resolver + label normalizer

**Goal:** One pure module that resolves a roadmap item to its canonical id (course id,
Core requirement id, or positional placeholder) plus a normalizer for Core labels.
**Requirements:** US1, US2, US5.
**Dependencies:** none.
**Files:**
- `src/utils/roadmap.ts` (new) — `resolveRoadmapItemId(...)`, `normalizeCoreLabel(...)`,
  and a helper to build a program's `normalizedLabel -> requirementId` map.
- `src/utils/roadmap.test.ts` (new).
**Approach:** Pure functions, no React. Build the requirement-label map from
`program.coreRequirements`. Reuse the existing `electivePlaceholderId` from
`src/utils/shareLink.ts` (or move it here and re-export) so placeholder ids stay
byte-identical. Only auto-resolve on a unique normalized match.
**Patterns to follow:** existing resolution logic in `src/components/Roadmap.tsx`
(`courseMap`/`coreMap`) and `src/utils/shareLink.ts:getValidProgressIds` roadmap loop.
**Execution note:** Start from the failing unit tests below.
**Test scenarios** (`src/utils/roadmap.test.ts`):
- Covers US1. Item with `ref` to a course id → returns that course id.
- Covers US1. Item with `ref` to a Core requirement id (`CORE_SCI1`) → returns it.
- Covers US1. Label-only "CORE: Scientific Knowledge Tier 1" in `cs` → resolves to
  `CORE_SCI1`.
- Covers US1. Normalization cases: "CORE: Theological and Religious Studies Tier 1" →
  `CORE_THEO1` ("and" vs "&"); "CAS Language Requirement 101 level" → `CAS_LANG1`
  (punctuation).
- Covers US2. Ambiguous label matching >1 requirement ("CAS Elective" ×3) → placeholder id,
  not a requirement id.
- Covers US2. No-match label ("COMP Free Elective", "First Year Seminar") → placeholder id.
- Covers US2/US5. Placeholder id for a label-only item equals
  `electivePlaceholderId(year, semester, index)` (byte-identical to current behavior).
- Tier disambiguation: "…Tier 1" vs "…Tier 2" resolve to distinct ids.

### U2. Use the shared resolver in Roadmap + shareLink

**Goal:** Both consumers call the U1 resolver; remove the duplicated `isElective`
branching. Fixes AE1/AE2 in the running app.
**Requirements:** US1, US5.
**Dependencies:** U1.
**Files:**
- `src/components/Roadmap.tsx` (modify item resolution; memoize the requirement-label map).
- `src/utils/shareLink.ts` (modify `getValidProgressIds` roadmap loop to use the resolver).
- `src/utils/shareLink.test.ts` (extend).
**Approach:** Replace the `if (item.isElective) …` short-circuit in `Roadmap.tsx` and the
roadmap loop in `shareLink.ts` with calls to `resolveRoadmapItemId`. Preserve display:
rows that resolve to a Core requirement render via the existing `coreMap` path (requirement
label + satisfied/"Choose specific Core course" affordance); rows that fall through keep
`isElective` display (dashed circle, "Elective — choose from list").
**Patterns to follow:** existing `coreMap` rendering branch in `Roadmap.tsx`.
**Execution note:** The `e2e/core-roadmap-propagation.spec.ts` propagation test (U5) is the
integration proof for this unit.
**Test scenarios** (`src/utils/shareLink.test.ts`):
- Covers US5. `getValidProgressIds` for `cs` includes `CORE_SCI1` for the resolved Tier 1
  roadmap row.
- Covers US5. Genuine elective rows still contribute their `electivePlaceholderId` to the
  valid set.
- Regression: existing shareLink encode/decode tests remain green.

### U3. Roadmap resolution snapshot + resolver invariants

**Goal:** Catch label mis-alignment — including silent wrong-matching — across all programs.
**Requirements:** US3.
**Dependencies:** U1.
**Files:**
- `src/utils/roadmapResolution.test.ts` (new).
**Approach:** Golden snapshot is the centerpiece (only thing that catches wrong-repointing);
two cheap invariants back it up.
**Test scenarios:**
- Covers US3 (golden). For every program, compute the ordered list of
  `roadmap row label -> resolved id OR null(=placeholder)` and assert it equals a committed
  snapshot (inline snapshot preferred). Includes intentionally-unresolved rows so a broken
  match flips an entry to `null` and a re-point changes the id — both fail visibly.
- Covers US3 (ambiguity invariant). No program has two `coreRequirements` whose normalized
  labels collide (guarantees the unique-match precondition is real).
- Covers US3 (dangling-id invariant). Every id the resolver returns exists as a real
  course or `coreRequirement` id in that program (no ghost ids).
- Covers AE4. (Documented in the test as the expected failure mode when a label drifts.)

### U4. Core catalog positional-join guards

**Goal:** Prevent the `?? area.requirementIds[0]` silent mis-map when the parallel arrays
drift.
**Requirements:** US4.
**Dependencies:** none (independent of U1).
**Files:**
- `src/utils/coreCatalog.test.ts` (new or extend if present).
**Approach:** Length invariant kills the missing-entry fallback; a small structure-only
golden pins order without the yearly course-list churn.
**Test scenarios:**
- Covers US4 / AE5 (length invariant). For every area in `coreCourses.json`,
  `area.requirementIds.length === area.groups.length`.
- Covers US4 (structure-only golden). Snapshot `area.id -> [ {groupLabel, requirementId} ]`
  for all areas (labels + ids only, **no** course lists) and assert it matches. Pins the
  group↔requirement order; immune to course additions/removals.
- Every `requirementId` referenced by an area exists (sanity), so the golden can't pin a
  typo'd id.

### U5. Formalize the e2e propagation test + vitest e2e exclusion

**Goal:** Lock in the end-to-end reproduction and keep Playwright specs out of vitest.
**Requirements:** US1 (AE1, AE2).
**Dependencies:** U2 (goes green once U2 lands).
**Files:**
- `e2e/core-roadmap-propagation.spec.ts` (already drafted this session).
- `playwright.config.ts` (already drafted).
- `vite.config.js` (already adds `test.include: ['src/**/*.test.{ts,tsx}']`).
**Approach:** Keep the sanity test (Courses tab reflects selection) and the propagation
test (Roadmap reflects selection). Confirm both green after U2.
**Execution note:** This is the integration-level red test for the whole change — it is
currently failing on `main` and should pass only after U2.
**Test scenarios:**
- Covers AE1. Select ENVS 101 on Core tab → Roadmap Year 2 Spring Tier 1 row shows ✓.
- Covers AE2 (optional). Deep-link `?p=cs&d=CORE_ENVS101` loads with the Roadmap row
  already satisfied.

---

## Sequencing

U1 → U2 → U5 is the fix spine (resolver → wire in → e2e proof). U3 depends on U1; U4 is
independent and can land any time. Suggested order: **U1, U3, U4, U2, U5** (write the
guard tests close to the resolver, wire in, then confirm e2e).

---

## Risks & Mitigations

- **Label-matching brittleness (the core tradeoff).** Mitigated by unique-match-only
  resolution, normalization, and the U3 golden snapshot that fails loudly on any drift
  including wrong-matches.
- **Behavior change across all programs' Core roadmap rows.** Intended (fixes the whole
  class), but broader than cs-only — the U3 snapshot makes the full set of newly-resolving
  rows explicit and reviewable, which is useful in the PR description for George.
- **Placeholder-id stability.** U1 must reproduce `electivePlaceholderId` exactly so
  existing share links and localStorage for genuine electives are unaffected (covered by a
  U1 test).

---

## Verification

- `npm test` green (new unit/snapshot tests + existing suite).
- `npx playwright test` green (`e2e/core-roadmap-propagation.spec.ts`).
- `npm run typecheck`, `npm run lint`, `npm run build` clean.
- `npm run check:programs` still green (no data touched → no drift).
- Manual/e2e spot check of AE1 on `cs`.
