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
export default function Roadmap({ program, completed, toggle }) {
  // Build a lookup map: courseId -> course object, for resolving roadmap refs
  const courseMap = Object.fromEntries(program.courses.map(c => [c.id, c]));
  const coreMap   = Object.fromEntries(program.coreRequirements.map(r => [r.id, r]));

  return (
    <div className="flex flex-col gap-4 px-4 py-6 pb-24">
      {program.roadmap.map((sem, idx) => (
        <SemesterCard
          key={idx}
          semester={sem}
          courseMap={courseMap}
          coreMap={coreMap}
          completed={completed}
          toggle={toggle}
        />
      ))}
    </div>
  );
}

/** A card for one semester showing all its courses */
function SemesterCard({ semester, courseMap, coreMap, completed, toggle }) {
  // Resolve each roadmap item to a displayable object with an id and label
  const items = semester.items.map((item, i) => {
    if (item.isElective) {
      // Elective slots don't have a fixed ID; use a stable per-semester key
      return { id: `elective-${semester.year}-${semester.semester}-${i}`, label: item.label, credits: item.credits, isElective: true };
    }
    if (item.ref) {
      // Look up in courses or core requirements
      const course = courseMap[item.ref] ?? coreMap[item.ref];
      if (course) {
        return { id: item.ref, label: course.code ? `${course.code} — ${course.title}` : course.label, credits: course.credits };
      }
    }
    return { id: `unknown-${i}`, label: item.label ?? '?', credits: item.credits ?? 0 };
  });

  const totalCredits = items.reduce((sum, it) => sum + (it.credits ?? 0), 0);
  const doneCredits  = items.filter(it => completed.has(it.id)).reduce((sum, it) => sum + (it.credits ?? 0), 0);
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
        {items.map(item => (
          <RoadmapItem
            key={item.id}
            item={item}
            done={completed.has(item.id)}
            toggle={toggle}
          />
        ))}
      </div>
    </div>
  );
}

/** A single course row within a semester card */
function RoadmapItem({ item, done, toggle }) {
  return (
    <button
      onClick={() => toggle(item.id)}
      className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-gray-50 transition-colors"
    >
      {/* Completion circle */}
      <div className={`
        flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${done ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
        ${item.isElective ? 'border-dashed' : ''}
      `}>
        {done && <span className="text-white text-xs">✓</span>}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug truncate ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {item.label}
        </div>
        {item.isElective && (
          <div className="text-xs text-gold-500 mt-0.5">Elective — choose from list</div>
        )}
      </div>

      <div className="text-xs text-gray-400 flex-shrink-0">{item.credits} cr</div>
    </button>
  );
}
