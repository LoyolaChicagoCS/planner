import { useState } from 'react';
import SearchBox from './SearchBox';
import optionalData from '../data/optional.json';
import {
  calcDistinctDoneCredits,
  calcProgramRequirementCreditGoal,
  calcProgramRequirementDoneCredits,
  calcRequiredCredits,
  calcSatisfiedRequirementCredits,
} from '../utils/progress';
import { progressBackgroundColor, progressBarStyle, progressColor } from '../utils/progressColor';
import { matchesSearch, normalizeSearch } from '../utils/search';
import type { CompletedSet, CoreRequirement, Course, Program, ProgressItem } from '../types';
import type { RequirementStatus } from '../utils/progress';

type IsCompleted = (itemOrId: ProgressItem | string) => boolean;
type IsRequirementSatisfied = (itemOrId: ProgressItem | string) => boolean;
type GetRequirementStatus = (itemOrId: ProgressItem | string) => RequirementStatus;
type Toggle = (id: string) => void;
type ToggleItem = (itemOrId: ProgressItem | string) => void;

interface OptionalCourseGroup {
  label: string;
  note: string;
  courses: Course[];
}

interface OptionalData {
  writingIntensive: OptionalCourseGroup;
  coreEligible: OptionalCourseGroup;
}

interface AuditItem extends ProgressItem {
  label: string;
  credits: number;
}

interface OptionalAuditCourse extends Course {
  groupLabel: string;
  groupNote: string;
}

const typedOptionalData = optionalData as OptionalData;

interface AuditProps {
  program: Program;
  completed: CompletedSet;
  toggle: Toggle;
  isCompleted: IsCompleted;
  isRequirementSatisfied: IsRequirementSatisfied;
  getRequirementStatus: GetRequirementStatus;
  toggleItem: ToggleItem;
}

/**
 * Audit — a full degree audit view showing every requirement category,
 * what has been completed, what remains, and a credit tally per category.
 *
 * Categories shown:
 *   1. Major Required Courses
 *   2. Electives (restricted, practicum, free)
 *   3. University Core Curriculum
 *   4. Optional CS Courses (writing intensive / core eligible)
 *
 * Props:
 *   program   — full program data object
 *   completed — Set of completed IDs
 *   toggle    — function(id) to mark/unmark
 */
export default function Audit({ program, completed, toggle, isCompleted, isRequirementSatisfied, getRequirementStatus, toggleItem }: AuditProps) {
  const [query, setQuery] = useState('');
  const search = normalizeSearch(query);
  const totalDone     = calcDistinctDoneCredits(program, completed);
  const totalRequired = program.kind === 'minor' || program.kind === 'masters' || program.kind === 'phd' ? program.totalCredits : 120;
  const remaining     = Math.max(0, totalRequired - totalDone);
  const pct           = Math.min(100, Math.round((totalDone / totalRequired) * 100));
  const requirementDone = calcProgramRequirementDoneCredits(program, isRequirementSatisfied);
  const requirementRequired = calcProgramRequirementCreditGoal(program);
  const requirementRemaining = Math.max(0, requirementRequired - requirementDone);
  const requirementPct = requirementRequired > 0
    ? Math.min(100, Math.round((requirementDone / requirementRequired) * 100))
    : 0;
  const requirementLabel = program.kind === 'minor' ? 'Minor Credits' : program.kind === 'masters' ? 'Graduate Credits' : program.kind === 'phd' ? 'Doctoral Credits' : 'Major Credits';

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <SearchBox value={query} onChange={setQuery} placeholder="Search audit" />

      {/* Overall credit summary */}
      <div className="grid gap-3">
        <CreditSummary
          title="Total Credits"
          done={totalDone}
          required={totalRequired}
          remaining={remaining}
          remainingLabel="credits remaining to graduate"
          pct={pct}
        />
        <CreditSummary
          title={requirementLabel}
          done={requirementDone}
          required={requirementRequired}
          remaining={requirementRemaining}
          remainingLabel={program.kind === 'minor' ? 'minor credits remaining' : program.kind === 'masters' ? 'graduate credits remaining' : program.kind === 'phd' ? 'doctoral credits remaining' : 'major credits remaining'}
          pct={requirementPct}
        />
      </div>

      {/* Major required courses */}
      <AuditCategory
        title={program.kind === 'minor' ? 'Minor Requirements' : program.kind === 'masters' ? 'Foundation & Required Courses' : program.kind === 'phd' ? 'Doctoral Required Courses' : 'Major Required Courses'}
        items={(program.courses ?? []).map(c => ({
          ...c,
          id: c.id,
          label: c.code ? `${c.code} — ${c.title}` : c.title,
          credits: c.credits,
        }))}
        search={search}
        creditsRequired={calcRequiredCredits(program.courses ?? [])}
        isCompleted={isCompleted}
        isRequirementSatisfied={isRequirementSatisfied}
        getRequirementStatus={getRequirementStatus}
        toggleItem={toggleItem}
      />

      {/* Elective groups */}
      {Object.values(program.electiveOptions ?? {})
        .filter(group => (group.courses ?? []).length > 0 || group.creditsRequired > 0)
        .map(group => (
        <AuditCategory
          key={group.label}
          title={group.label}
          note={group.note}
          items={(group.courses ?? []).map(c => ({
            ...c,
            id: c.id,
            label: `${c.code} — ${c.title}`,
            credits: c.credits,
          }))}
          search={search}
          creditsRequired={group.creditsRequired}
          isCompleted={isCompleted}
          isRequirementSatisfied={isRequirementSatisfied}
          getRequirementStatus={getRequirementStatus}
          toggleItem={toggleItem}
        />
      ))}

      {/* University Core */}
      <AuditCategory
        title="University Core Curriculum"
        items={(program.coreRequirements ?? []).map((r: CoreRequirement) => ({
          ...r,
          id: r.id,
          label: r.label,
          credits: r.credits,
        }))}
        search={search}
        creditsRequired={calcRequiredCredits(program.coreRequirements ?? [])}
        isCompleted={isCompleted}
        isRequirementSatisfied={isRequirementSatisfied}
        getRequirementStatus={getRequirementStatus}
        toggleItem={toggleItem}
      />

      {/* Optional CS courses — shown for awareness, not counted toward 120; not relevant for graduate programs */}
      {program.kind !== 'masters' && program.kind !== 'phd' && <OptionalAuditSection search={search} completed={completed} toggle={toggle} />}

    </div>
  );
}

/** Top-level credit summary card */
function CreditSummary({
  title,
  done,
  required,
  remaining,
  remainingLabel,
  pct,
}: {
  title: string;
  done: number;
  required: number;
  remaining: number;
  remainingLabel: string;
  pct: number;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="px-4 py-4" style={{ backgroundColor: progressColor(pct) }}>
        <div className="text-white text-lg font-bold">{done} / {required} {title} Complete</div>
        <div className="text-white/80 text-sm mt-0.5">{remaining} {remainingLabel}</div>
      </div>
      <div className="h-2" style={{ backgroundColor: progressBackgroundColor(pct) }}>
        <div
          className="h-full transition-all duration-500"
          style={progressBarStyle(pct)}
        />
      </div>
      <div className="bg-white px-4 py-3 flex justify-between text-xs text-gray-500">
        <span>{pct}% complete</span>
        <span>Goal: {required} cr</span>
      </div>
    </div>
  );
}

/**
 * A single requirement category showing:
 *   - Header with credit progress badge
 *   - Completed items (indented, struck-through)
 *   - Remaining items (normal weight)
 */
function AuditCategory({ title, note, items, search, creditsRequired, isCompleted, isRequirementSatisfied, getRequirementStatus, toggleItem }: {
  title: string;
  note?: string;
  items: AuditItem[];
  search: string;
  creditsRequired: number;
  isCompleted: IsCompleted;
  isRequirementSatisfied: IsRequirementSatisfied;
  getRequirementStatus: GetRequirementStatus;
  toggleItem: ToggleItem;
}) {
  if (items.length === 0 && creditsRequired === 0) return null;

  const visibleItems = items.filter(item => matchesSearch([title, note, item.id, item.code, item.title, item.label], search));
  const doneItems      = visibleItems.filter(i => isCompleted(i));
  const waivedItems    = visibleItems.filter(i => getRequirementStatus(i).satisfiedByAlternate);
  const remainingItems = visibleItems.filter(i => !isRequirementSatisfied(i));
  const doneCredits    = calcSatisfiedRequirementCredits(items, isRequirementSatisfied);
  const met            = doneCredits >= creditsRequired;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      {/* Category header */}
      <div className={`px-4 py-3 flex items-start justify-between gap-2 ${met ? 'bg-maroon-500' : 'bg-gray-800'}`}>
        <div>
          <div className="text-white text-sm font-semibold">{title}</div>
          {note && <div className="text-gray-300 text-xs mt-0.5 italic">{note}</div>}
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5
          ${met ? 'bg-white text-maroon-600' : 'bg-gray-700 text-gray-300'}`}>
          {doneCredits}/{creditsRequired} cr
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${met ? 'bg-maroon-500' : 'bg-maroon-300'}`}
          style={{ width: `${Math.min(100, Math.round((doneCredits / creditsRequired) * 100))}%` }}
        />
      </div>

      <div className="bg-white divide-y divide-gray-50">
        {/* Completed items */}
        {doneItems.map(item => (
          <AuditRow key={item.id} item={item} done={true} toggleItem={toggleItem} />
        ))}

        {waivedItems.map(item => (
          <AuditRow key={item.id} item={item} done={false} satisfiedByAlternate={true} toggleItem={toggleItem} />
        ))}

        {/* Remaining items */}
        {remainingItems.map(item => (
          <AuditRow key={item.id} item={item} done={false} toggleItem={toggleItem} />
        ))}

        {/* Empty state */}
        {visibleItems.length === 0 && (
          <div className="px-4 py-3 text-xs text-gray-400 italic">
            Choose courses from the elective list above.
          </div>
        )}
      </div>
    </div>
  );
}

/** A single course row in the audit — tappable to toggle completion */
function AuditRow({ item, done, satisfiedByAlternate = false, toggleItem }: {
  item: AuditItem;
  done: boolean;
  satisfiedByAlternate?: boolean;
  toggleItem: ToggleItem;
}) {
  return (
    <button
      onClick={() => toggleItem(item)}
      className="flex items-center gap-3 px-4 py-2.5 w-full text-left active:bg-gray-50 transition-colors"
    >
      <div className={`
        flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
        ${done ? 'bg-maroon-500 border-maroon-500' : satisfiedByAlternate ? 'bg-gold-400 border-gold-400' : 'border-gray-300'}
      `}>
        {(done || satisfiedByAlternate) && <span className="text-white text-[9px] leading-none">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm leading-snug ${done ? 'text-gray-400 line-through' : satisfiedByAlternate ? 'text-gold-800' : 'text-gray-700'}`}>
          {item.label}
        </span>
        {satisfiedByAlternate && (
          <div className="text-xs text-gold-500 mt-0.5">Requirement satisfied by alternate</div>
        )}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{item.credits} cr</span>
    </button>
  );
}

/**
 * Optional CS courses — writing intensive and core eligible.
 * Shown for awareness only; not counted toward the 120-credit total.
 */
function OptionalAuditSection({ search, completed, toggle }: { search: string; completed: CompletedSet; toggle: Toggle }) {
  const groups = [typedOptionalData.writingIntensive, typedOptionalData.coreEligible];
  const courses: OptionalAuditCourse[] = groups
    .flatMap(g => g.courses.map(course => ({ ...course, groupLabel: g.label, groupNote: g.note })))
    .filter(course => matchesSearch([course.groupLabel, course.groupNote, course.code, course.title], search));

  return (
    <div className="rounded-xl overflow-hidden border border-gold-100 shadow-sm">
      <div className="bg-gold-400 px-4 py-3">
        <div className="text-white text-sm font-semibold">Optional CS Courses</div>
        <div className="text-gold-100 text-xs mt-0.5">
          Not required for graduation — available to satisfy Writing Intensive or Core requirements.
        </div>
      </div>

      <div className="bg-white divide-y divide-gray-50">
        {courses.map(course => {
          const done = completed.has(course.id);
          return (
            <button
              key={course.id}
              onClick={() => toggle(course.id)}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-left active:bg-gray-50 transition-colors"
            >
              <div className={`
                flex-shrink-0 w-4 h-4 rounded-full border-2 border-dashed flex items-center justify-center
                ${done ? 'bg-gold-400 border-gold-400' : 'border-gray-300'}
              `}>
                {done && <span className="text-white text-[9px] leading-none">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm leading-snug ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {course.code} — {course.title}
                </span>
              </div>
              <span className="text-xs text-gold-500 flex-shrink-0">{course.credits} cr · optional</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
