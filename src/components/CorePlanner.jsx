import { useEffect, useMemo, useState } from 'react';
import SearchBox from './SearchBox';
import { coreRequirementElementId, getCoreCatalogAreasForProgram } from '../utils/coreCatalog';
import { matchesSearch, normalizeSearch } from '../utils/search';

function courseMatches(course, query) {
  return matchesSearch([course.code, course.title], query);
}

export default function CorePlanner({ program, completed, toggle, getRequirementStatus, focusTarget }) {
  const [query, setQuery] = useState('');
  const areas = useMemo(() => getCoreCatalogAreasForProgram(program), [program]);
  const requirementLabels = useMemo(
    () => Object.fromEntries((program.coreRequirements ?? []).map(req => [req.id, req.label])),
    [program]
  );
  const search = normalizeSearch(query);
  const focusedRequirementId = focusTarget?.requirementId;

  useEffect(() => {
    if (!focusedRequirementId) return;
    requestAnimationFrame(() => {
      document
        .getElementById(coreRequirementElementId(focusedRequirementId))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [focusedRequirementId, focusTarget?.requestId]);

  const totalRequirements = areas.reduce((sum, area) => sum + area.groups.length, 0);
  const completedRequirements = areas.reduce(
    (sum, area) => sum + area.groups.filter(group => isGroupSatisfied(group, completed)).length,
    0
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">
      <div className="rounded-2xl overflow-hidden border border-maroon-100 shadow-sm bg-white">
        <div className="bg-maroon-500 px-4 py-4">
          <div className="text-white text-lg font-bold">University Core</div>
          <div className="text-maroon-100 text-sm mt-0.5">
            {completedRequirements} of {totalRequirements} requirements satisfied
          </div>
        </div>
        <div className="h-2 bg-maroon-100">
          <div
            className="h-full bg-maroon-400 transition-all duration-500"
            style={{ width: `${Math.round((completedRequirements / totalRequirements) * 100)}%` }}
          />
        </div>
      </div>

      <SearchBox value={query} onChange={setQuery} placeholder="Search Core courses" />

      {areas.map(area => (
        <CoreAreaCard
          key={area.id}
          area={area}
          completed={completed}
          requirementLabels={requirementLabels}
          search={search}
          toggle={toggle}
          getRequirementStatus={getRequirementStatus}
          focusedRequirementId={focusedRequirementId}
        />
      ))}
    </div>
  );
}

function CoreAreaCard({ area, completed, requirementLabels, search, toggle, getRequirementStatus, focusedRequirementId }) {
  const doneGroups = area.groups.filter(group => isGroupSatisfied(group, completed)).length;
  const met = doneGroups >= area.groups.length;

  return (
    <section className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
      <div className={`px-4 py-3 flex items-start justify-between gap-3 ${met ? 'bg-maroon-500' : 'bg-gray-800'}`}>
        <div>
          <h2 className="text-white text-sm font-semibold leading-snug">{area.name}</h2>
          <div className="text-xs text-gray-300 mt-0.5">
            {area.groups.length > 1 ? 'Tier I and Tier II required' : 'One course required'}
          </div>
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5
          ${met ? 'bg-white text-maroon-600' : 'bg-gray-700 text-gray-300'}`}>
          {doneGroups}/{area.groups.length}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {area.groups.map(group => (
          <CoreGroup
            key={group.requirementId}
            group={group}
            completed={completed}
            requirementLabel={requirementLabels[group.requirementId] ?? group.label}
            search={search}
            toggle={toggle}
            getRequirementStatus={getRequirementStatus}
            focused={focusedRequirementId === group.requirementId}
          />
        ))}
      </div>
    </section>
  );
}

function CoreGroup({ group, completed, requirementLabel, search, toggle, getRequirementStatus, focused }) {
  const visibleCourses = group.courses.filter(course => courseMatches(course, search));
  const concreteDone = group.courses.filter(course => completed.has(course.id));
  const generalStatus = getRequirementStatus(group.requirementId);
  const groupDone = generalStatus.completed || generalStatus.satisfiedByAlternate || concreteDone.length > 0;

  return (
    <div
      id={coreRequirementElementId(group.requirementId)}
      className={focused ? 'ring-2 ring-gold-400 ring-inset' : ''}
    >
      <div className={`px-4 py-3 ${focused ? 'bg-gold-50' : groupDone ? 'bg-maroon-50' : 'bg-gray-50'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`text-sm font-semibold ${groupDone ? 'text-maroon-700' : 'text-gray-800'}`}>
              {requirementLabel}
            </h3>
            <div className="text-xs text-gray-500 mt-0.5">
              {group.label}
              {concreteDone.length > 0 && <span className="ml-1 text-maroon-500">· {concreteDone.length} selected</span>}
              {generalStatus.completed && concreteDone.length === 0 && (
                <span className="ml-1 text-maroon-500">· general requirement checked</span>
              )}
            </div>
          </div>
          <div className={`
            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
            ${groupDone ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
          `}>
            {groupDone && <span className="text-white text-xs">✓</span>}
          </div>
        </div>
      </div>

      {visibleCourses.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {visibleCourses.map(course => (
            <CoreCourseRow
              key={course.id}
              course={course}
              done={completed.has(course.id)}
              toggle={toggle}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-xs text-gray-400 italic">
          No matching courses in this requirement.
        </div>
      )}
    </div>
  );
}

function CoreCourseRow({ course, done, toggle }) {
  return (
    <button
      onClick={() => toggle(course.id)}
      className="flex items-start gap-3 px-4 py-2.5 w-full text-left active:bg-gray-50 transition-colors"
    >
      <div className={`
        mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${done ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
      `}>
        {done && <span className="text-white text-xs">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          <span className="font-medium">{course.code}</span> — {course.title}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {course.credits} cr
          {course.diversity && <span className="ml-1 text-gold-600">· diversity</span>}
        </div>
      </div>
    </button>
  );
}

function isGroupSatisfied(group, completed) {
  return completed.has(group.requirementId) || group.courses.some(course => completed.has(course.id));
}
