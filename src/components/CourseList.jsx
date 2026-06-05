/**
 * CourseList — displays all required courses for a program, grouped
 * by category (major requirements, core curriculum, electives).
 *
 * Each course row has a checkbox. Checking it marks the course complete
 * everywhere in the app (roadmap, checklist) via the shared progress state.
 *
 * Props:
 *   program   — full program data object (from JSON)
 *   completed — Set of completed course/item IDs
 *   toggle    — function(id) to mark/unmark a course
 */
export default function CourseList({ program, isCompleted, getRequirementStatus, toggleItem }) {
  const majorCourses = program.courses.filter(c => c.category === 'major');
  const electiveCourses = program.courses.filter(c => c.category === 'elective');

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24">
      <Section title="Major Requirements" courses={majorCourses} getRequirementStatus={getRequirementStatus} toggleItem={toggleItem} />
      <Section title="Electives & Capstone" courses={electiveCourses} getRequirementStatus={getRequirementStatus} toggleItem={toggleItem} />
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Elective Requirements</h2>
        <ElectiveInfo program={program} isCompleted={isCompleted} toggleItem={toggleItem} />
      </div>
      <CoreInfo program={program} isCompleted={isCompleted} toggleItem={toggleItem} />
    </div>
  );
}

/** A labeled group of course rows */
function Section({ title, courses, getRequirementStatus, toggleItem }) {
  if (!courses.length) return null;
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{title}</h2>
      <div className="flex flex-col gap-2">
        {courses.map(course => (
          <CourseRow key={course.id} course={course} getRequirementStatus={getRequirementStatus} toggleItem={toggleItem} />
        ))}
      </div>
    </div>
  );
}

/** A single tappable course row with completion checkbox */
function CourseRow({ course, getRequirementStatus, toggleItem }) {
  const { completed, satisfiedByAlternate } = getRequirementStatus(course);
  return (
    <button
      onClick={() => toggleItem(course)}
      className={`
        flex items-start gap-3 p-3 rounded-xl text-left w-full
        transition-colors
        ${completed ? 'bg-maroon-50' : satisfiedByAlternate ? 'bg-gold-50' : 'bg-white'}
        border ${completed ? 'border-maroon-200' : satisfiedByAlternate ? 'border-gold-200' : 'border-gray-100'}
        shadow-sm
      `}
    >
      {/* Checkbox circle */}
      <div className={`
        mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${completed ? 'bg-maroon-500 border-maroon-500' : satisfiedByAlternate ? 'bg-gold-400 border-gold-400' : 'border-gray-300'}
      `}>
        {(completed || satisfiedByAlternate) && <span className="text-white text-xs">✓</span>}
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium leading-snug ${completed ? 'text-maroon-700 line-through' : satisfiedByAlternate ? 'text-gold-800' : 'text-gray-800'}`}>
          {course.code} — {course.title}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {course.credits} cr
          {course.choiceNote && <span className="ml-1">· {course.choiceNote}</span>}
          {satisfiedByAlternate && <span className="ml-1 text-gold-600">· requirement satisfied by alternate</span>}
          {course.alternateNote && <span className="ml-1">· {course.alternateNote}</span>}
          {course.apCredit && (
            <span className="ml-1 text-maroon-400">
              · AP: {course.apCredit.exam} ≥{course.apCredit.minScore}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Renders each elective group (restricted, practicum, free) as a collapsible
 * section with checkable course rows and a live credit progress bar.
 */
function ElectiveInfo({ program, isCompleted, toggleItem }) {
  const { restricted, practicum, free } = program.electiveOptions;
  return (
    <div className="flex flex-col gap-4">
      {[restricted, practicum, free].map(group => (
        <ElectiveGroup key={group.label} group={group} isCompleted={isCompleted} toggleItem={toggleItem} />
      ))}
    </div>
  );
}

/** One elective group with a header, credit progress, and checkable course rows */
function ElectiveGroup({ group, isCompleted, toggleItem }) {
  const courses = group.courses ?? [];

  // Count credits completed within this group
  const doneCredits = courses
    .filter(c => isCompleted(c))
    .reduce((sum, c) => sum + c.credits, 0);
  const pct = Math.min(100, Math.round((doneCredits / group.creditsRequired) * 100));
  const met = doneCredits >= group.creditsRequired;

  return (
    <div className="rounded-xl overflow-hidden border border-gold-100 shadow-sm">
      {/* Group header with credit progress */}
      <div className="bg-gold-50 px-3 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gold-800">{group.label}</div>
          {group.note && <div className="text-xs text-gray-500 mt-0.5 italic">{group.note}</div>}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2
          ${met ? 'bg-maroon-500 text-white' : 'bg-gold-200 text-gold-800'}`}>
          {doneCredits}/{group.creditsRequired} cr
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${met ? 'bg-maroon-500' : 'bg-gold-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Course rows */}
      {courses.length > 0 && (
        <div className="bg-white divide-y divide-gray-50">
          {courses.map(course => (
            <ElectiveCourseRow key={course.id} course={course} isCompleted={isCompleted} toggleItem={toggleItem} />
          ))}
        </div>
      )}
    </div>
  );
}

/** A single selectable row inside an elective group */
function ElectiveCourseRow({ course, isCompleted, toggleItem }) {
  const done = isCompleted(course);
  return (
    <button
      onClick={() => toggleItem(course)}
      className="flex items-center gap-3 px-3 py-2.5 w-full text-left active:bg-gray-50 transition-colors"
    >
      <div className={`
        flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${done ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
      `}>
        {done && <span className="text-white text-xs">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {course.code} — {course.title}
        </div>
      </div>
      <div className="text-xs text-gray-400 flex-shrink-0">{course.credits} cr</div>
    </button>
  );
}

/** Core curriculum items with checkboxes */
function CoreInfo({ program, isCompleted, toggleItem }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">University Core</h2>
      <div className="flex flex-col gap-2">
        {program.coreRequirements.map(req => {
          const done = isCompleted(req);
          return (
            <button
              key={req.id}
              onClick={() => toggleItem(req)}
              className={`
                flex items-center gap-3 p-3 rounded-xl text-left w-full
                transition-colors shadow-sm
                ${done ? 'bg-maroon-50 border border-maroon-200' : 'bg-white border border-gray-100'}
              `}
            >
              <div className={`
                flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${done ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
              `}>
                {done && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${done ? 'text-maroon-700 line-through' : 'text-gray-800'}`}>
                  {req.label}
                </div>
                <div className="text-xs text-gray-400">{req.credits} cr</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
