import { useState } from 'react';
import SearchBox from './SearchBox';
import { hasConcreteCoreSelection } from '../utils/coreCatalog';
import { electivePlaceholderId } from '../utils/shareLink';
import { matchesSearch, normalizeSearch } from '../utils/search';
import type { CompletedSet, CoreRequirement, Course, Program, ProgressItem, RoadmapSemester } from '../types';
import type { RequirementStatus } from '../utils/progress';

type GetRequirementStatus = (itemOrId: ProgressItem | string) => RequirementStatus;
type ToggleItem = (itemOrId: ProgressItem | string) => void;

interface RoadmapProps {
  program: Program;
  completed: CompletedSet;
  getRequirementStatus: GetRequirementStatus;
  toggleItem: ToggleItem;
  onOpenCoreRequirement: (requirementId: string) => void;
}

interface ResolvedRoadmapItem extends ProgressItem {
  id: string;
  label: string;
  credits: number;
  isElective?: boolean;
}

/**
 * Roadmap — shows the suggested 4-year, semester-by-semester plan.
 *
 * Each semester card lists its courses. If a course has been checked off
 * anywhere in the app, it appears completed here too. A progress bar shows
 * how many of the semester's credits are done.
 *
 * Props:
 *   program   — full program data object
 *   completed — Set of completed course/item IDs
 *   toggle    — function(id) to mark/unmark a course
 */
export default function Roadmap({ program, completed, getRequirementStatus, toggleItem, onOpenCoreRequirement }: RoadmapProps) {
  const [query, setQuery] = useState('');
  const search = normalizeSearch(query);
  // Build a lookup map: courseId -> course object, for resolving roadmap refs
  const courseMap = Object.fromEntries((program.courses ?? []).map(c => [c.id, c]));
  const coreMap   = Object.fromEntries((program.coreRequirements ?? []).map(r => [r.id, r]));

  return (
    <div className="flex flex-col gap-4 px-4 py-6 pb-24">
      <SearchBox value={query} onChange={setQuery} placeholder="Search roadmap" />
      {(program.roadmap ?? []).map((sem, idx) => (
        <SemesterCard
          key={idx}
          semester={sem}
          courseMap={courseMap}
          coreMap={coreMap}
          completed={completed}
          program={program}
          search={search}
          getRequirementStatus={getRequirementStatus}
          toggleItem={toggleItem}
          onOpenCoreRequirement={onOpenCoreRequirement}
        />
      ))}
    </div>
  );
}

/** A card for one semester showing all its courses */
function SemesterCard({ semester, courseMap, coreMap, completed, program, search, getRequirementStatus, toggleItem, onOpenCoreRequirement }: {
  semester: RoadmapSemester;
  courseMap: Record<string, Course>;
  coreMap: Record<string, CoreRequirement>;
  completed: CompletedSet;
  program: Program;
  search: string;
  getRequirementStatus: GetRequirementStatus;
  toggleItem: ToggleItem;
  onOpenCoreRequirement: (requirementId: string) => void;
}) {
  // Resolve each roadmap item to a displayable object with an id and label
  const items: ResolvedRoadmapItem[] = (semester.items ?? []).map((item, i) => {
    if (item.isElective) {
      // Elective slots don't have a fixed ID; use a stable per-semester key
      return { id: electivePlaceholderId(semester.year, semester.semester, i), label: item.label ?? 'Elective', credits: item.credits ?? 0, isElective: true };
    }
    if (item.ref) {
      // Look up in courses or core requirements
      const course = courseMap[item.ref] ?? coreMap[item.ref];
      if (course) {
        return { id: item.ref, label: course.code ? `${course.code} — ${course.title}` : course.label ?? item.ref, credits: course.credits };
      }
    }
    return { id: `unknown-${i}`, label: item.label ?? '?', credits: item.credits ?? 0 };
  });
  const visibleItems = items.filter(item =>
    matchesSearch([item.id, item.label, semester.year, semester.semester], search)
  );
  if (search && visibleItems.length === 0) return null;

  const totalCredits = visibleItems.reduce((sum, it) => sum + (it.credits ?? 0), 0);
  const doneCredits  = visibleItems
    .filter(it => {
      const status = getRequirementStatus(it);
      return status.completed || status.satisfiedByAlternate;
    })
    .reduce((sum, it) => sum + (it.credits ?? 0), 0);
  const pct = totalCredits > 0 ? Math.round((doneCredits / totalCredits) * 100) : 0;
  const allDone = pct === 100;

  return (
    <div className={`rounded-2xl shadow-sm overflow-hidden border ${allDone ? 'border-maroon-200' : 'border-gray-100'}`}>
      {/* Semester header */}
      <div className={`px-4 py-3 flex items-center justify-between ${allDone ? 'bg-maroon-500' : 'bg-gray-800'}`}>
        <div>
          <span className="text-white font-semibold text-sm">
            Year {semester.year} — {semester.semester}
          </span>
          <span className="text-gray-300 text-xs ml-2">{totalCredits} cr</span>
        </div>
        {/* Progress badge */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${allDone ? 'bg-white text-maroon-600' : 'bg-gray-700 text-gray-300'}`}>
          {doneCredits}/{totalCredits} cr
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${allDone ? 'bg-maroon-500' : 'bg-maroon-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Course rows */}
      <div className="bg-white divide-y divide-gray-50">
        {visibleItems.map(item => (
          <RoadmapItem
            key={item.id}
            item={item}
            status={getRequirementStatus(item)}
            completed={completed}
            program={program}
            toggleItem={toggleItem}
            onOpenCoreRequirement={onOpenCoreRequirement}
          />
        ))}
      </div>
    </div>
  );
}

/** A single course row within a semester card */
function RoadmapItem({ item, status, completed, program, toggleItem, onOpenCoreRequirement }: {
  item: ResolvedRoadmapItem;
  status: RequirementStatus;
  completed: CompletedSet;
  program: Program;
  toggleItem: ToggleItem;
  onOpenCoreRequirement: (requirementId: string) => void;
}) {
  const { completed: generalCompleted, satisfiedByAlternate } = status;
  const needsSpecificCore = generalCompleted
    && item.id.startsWith('CORE_')
    && !hasConcreteCoreSelection(program, completed, item.id);

  return (
    <div>
      <button
        onClick={() => toggleItem(item)}
        className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-gray-50 transition-colors"
      >
        {/* Completion circle */}
        <div className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          ${generalCompleted ? 'bg-maroon-500 border-maroon-500' : satisfiedByAlternate ? 'bg-gold-400 border-gold-400' : 'border-gray-300'}
          ${item.isElective ? 'border-dashed' : ''}
        `}>
          {(generalCompleted || satisfiedByAlternate) && <span className="text-white text-xs">✓</span>}
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-sm leading-snug truncate ${generalCompleted ? 'text-gray-400 line-through' : satisfiedByAlternate ? 'text-gold-800' : 'text-gray-800'}`}>
            {item.label}
          </div>
          {satisfiedByAlternate && (
            <div className="text-xs text-gold-500 mt-0.5">Requirement satisfied by selected Core course</div>
          )}
          {item.isElective && (
            <div className="text-xs text-gold-500 mt-0.5">Elective — choose from list</div>
          )}
        </div>

        <div className="text-xs text-gray-400 flex-shrink-0">{item.credits} cr</div>
      </button>
      {needsSpecificCore && (
        <button
          onClick={() => onOpenCoreRequirement?.(item.id)}
          className="w-full border-t border-gray-100 px-4 py-2 text-left text-xs font-semibold text-maroon-600 active:bg-maroon-50"
        >
          Choose specific Core course
        </button>
      )}
    </div>
  );
}
