import optionalData from '../data/optional.json';

/**
 * Checklist — three sections:
 *   1. Semester estimate (full-time / part-time based on remaining credits)
 *   2. Remaining required courses (unchecked major courses)
 *   3. AP exam and transfer/placement credits
 *   4. Progress export / import
 *
 * Props:
 *   program     — full program data object
 *   completed   — Set of completed IDs
 *   toggle      — function(id) to mark/unmark
 *   hasConsent  — whether the user has agreed to persist data
 *   grantConsent, exportJSON, importJSON
 */

const GRADUATION_CREDITS = 120;

/** Sum all credits currently marked complete across courses, core, and electives */
function calcDoneCredits(program, completed) {
  const fromCourses = program.courses
    .filter(c => completed.has(c.id))
    .reduce((s, c) => s + c.credits, 0);

  const fromCore = program.coreRequirements
    .filter(r => completed.has(r.id))
    .reduce((s, r) => s + r.credits, 0);

  // Elective options each have their own course list with separate IDs
  const fromElectives = Object.values(program.electiveOptions)
    .flatMap(g => g.courses ?? [])
    .filter(c => completed.has(c.id))
    .reduce((s, c) => s + c.credits, 0);

  return fromCourses + fromCore + fromElectives;
}

export default function Checklist({ program, completed, toggle, hasConsent, grantConsent, exportJSON, importJSON }) {
  const apItems       = program.checklist.filter(i => i.category === 'ap');
  const transferItems = program.checklist.filter(i => i.category === 'transfer');

  const doneCredits      = calcDoneCredits(program, completed);
  const remainingCredits = Math.max(0, GRADUATION_CREDITS - doneCredits);

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => importJSON(ev.target.result);
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24">

      {/* Persistence consent banner */}
      {!hasConsent && (
        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4">
          <p className="text-sm text-gold-800 font-medium">Save your progress?</p>
          <p className="text-xs text-gold-700 mt-1">
            Your checklist can be saved in this browser so it persists between visits.
            Nothing leaves your device.
          </p>
          <button
            onClick={grantConsent}
            className="mt-3 w-full bg-gold-400 text-white text-sm font-medium py-2 rounded-xl active:bg-gold-500"
          >
            Yes, save my progress locally
          </button>
        </div>
      )}

      {/* Semester estimate */}
      <SemesterEstimate doneCredits={doneCredits} remainingCredits={remainingCredits} />

      {/* Remaining required courses */}
      <RemainingCourses program={program} completed={completed} toggle={toggle} />

      {/* AP and transfer credits */}
      <ChecklistSection title="AP Exam Credits"              items={apItems}       completed={completed} toggle={toggle} />
      <ChecklistSection title="Transfer & Placement Credits" items={transferItems} completed={completed} toggle={toggle} />

      {/* Optional CS courses that satisfy university requirements */}
      <OptionalCourses completed={completed} toggle={toggle} />

      {/* Export / Import */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">My Progress</h2>
        <div className="flex gap-3">
          <button
            onClick={exportJSON}
            className="flex-1 bg-maroon-500 text-white text-sm font-medium py-3 rounded-xl active:bg-maroon-600"
          >
            Export Progress
          </button>
          <label className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-3 rounded-xl text-center cursor-pointer active:bg-gray-200">
            Import Progress
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Export to a file and import on another device to restore your progress.
        </p>
      </div>
    </div>
  );
}

/**
 * Shows estimated semesters remaining for full-time (12 cr) and part-time (6 cr) enrollment.
 * Uses ceiling division so partial semesters round up.
 */
function SemesterEstimate({ doneCredits, remainingCredits }) {
  const fullTime = remainingCredits > 0 ? Math.ceil(remainingCredits / 12) : 0;
  const partTime = remainingCredits > 0 ? Math.ceil(remainingCredits /  6) : 0;
  const pct      = Math.min(100, Math.round((doneCredits / GRADUATION_CREDITS) * 100));

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Estimated Time to Graduate</h2>
      <div className="rounded-2xl overflow-hidden border border-maroon-100 shadow-sm">

        {/* Credit progress bar */}
        <div className="bg-maroon-500 px-4 py-3 flex items-center justify-between">
          <span className="text-white text-sm font-semibold">{doneCredits} / {GRADUATION_CREDITS} credits complete</span>
          <span className="text-maroon-200 text-xs">{pct}%</span>
        </div>
        <div className="h-1.5 bg-maroon-100">
          <div
            className="h-full bg-maroon-400 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Two enrollment scenarios */}
        <div className="bg-white divide-y divide-gray-50">
          <EnrollmentRow
            label="Full-time"
            sublabel="≥ 12 credits / semester"
            semesters={fullTime}
            icon="📚"
          />
          <EnrollmentRow
            label="Part-time"
            sublabel="≥ 6 credits / semester"
            semesters={partTime}
            icon="🕐"
          />
        </div>

        {remainingCredits === 0 && (
          <div className="bg-maroon-50 px-4 py-3 text-sm text-maroon-700 font-medium text-center">
            🎓 All requirements complete!
          </div>
        )}

        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 text-center">
          Estimates assume {remainingCredits} credits remaining. Actual scheduling may vary.
        </div>
      </div>
    </div>
  );
}

/** A single row in the enrollment estimate card */
function EnrollmentRow({ label, sublabel, semesters, icon }) {
  const years        = Math.floor(semesters / 2);
  const extraSem     = semesters % 2;
  const timeLabel    = semesters === 0
    ? 'Done!'
    : years > 0
      ? `${years} yr${years > 1 ? 's' : ''}${extraSem ? ' + 1 sem' : ''}`
      : `${semesters} semester${semesters > 1 ? 's' : ''}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        <div className="text-xs text-gray-400">{sublabel}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-maroon-600">{semesters} semesters</div>
        <div className="text-xs text-gray-400">{timeLabel}</div>
      </div>
    </div>
  );
}

/**
 * Lists all required major courses that haven't been checked off yet.
 * Gives the student a quick "what do I still need?" answer for program-specific courses.
 */
function RemainingCourses({ program, completed, toggle }) {
  const remaining = program.courses.filter(c => !completed.has(c.id));
  if (remaining.length === 0) {
    return (
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Remaining Required Courses</h2>
        <div className="bg-maroon-50 border border-maroon-100 rounded-xl p-4 text-sm text-maroon-700 text-center font-medium">
          All required courses complete ✓
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
        Remaining Required Courses
        <span className="ml-2 normal-case font-normal text-gray-400">({remaining.length} courses)</span>
      </h2>
      <div className="flex flex-col gap-2">
        {remaining.map(course => (
          <button
            key={course.id}
            onClick={() => toggle(course.id)}
            className="flex items-center gap-3 p-3 rounded-xl text-left w-full bg-white border border-gray-100 shadow-sm active:bg-gray-50"
          >
            {/* Empty circle — tapping marks it complete */}
            <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 leading-snug">
                {course.code ? `${course.code} — ${course.title}` : course.label}
              </div>
              {course.alternateNote && (
                <div className="text-xs text-gray-400 mt-0.5">{course.alternateNote}</div>
              )}
            </div>
            <div className="text-xs text-gray-400 flex-shrink-0">{course.credits} cr</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A labeled group of AP or transfer checklist items */
function ChecklistSection({ title, items, completed, toggle }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{title}</h2>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <ChecklistItem key={item.id} item={item} completed={completed} toggle={toggle} />
        ))}
      </div>
    </div>
  );
}

/**
 * Optional CS courses that can satisfy Writing Intensive or Core requirements.
 * These appear in all programs — they are never required for any degree.
 */
function OptionalCourses({ completed, toggle }) {
  const groups = [optionalData.writingIntensive, optionalData.coreEligible];

  return (
    <div className="flex flex-col gap-4">
      {groups.map(group => (
        <div key={group.label}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            {group.label}
            <span className="ml-2 normal-case font-normal text-gold-500">Optional</span>
          </h2>
          <p className="text-xs text-gray-400 mb-2">{group.note}</p>
          <div className="flex flex-col gap-2">
            {group.courses.map(course => {
              const done = completed.has(course.id);
              return (
                <button
                  key={course.id}
                  onClick={() => toggle(course.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl text-left w-full shadow-sm transition-colors
                    ${done ? 'bg-gold-50 border border-gold-200' : 'bg-white border border-gray-100'}
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${done ? 'bg-gold-400 border-gold-400' : 'border-gray-300 border-dashed'}
                  `}>
                    {done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium leading-snug ${done ? 'text-gold-700' : 'text-gray-800'}`}>
                      {course.code} — {course.title}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">{course.credits} cr</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A single AP/transfer checklist row */
function ChecklistItem({ item, completed, toggle }) {
  const done = completed.has(item.id) || (item.courseRef && completed.has(item.courseRef));

  function handleToggle() {
    toggle(item.id);
    if (item.courseRef)     toggle(item.courseRef);
    if (item.alsoCourseRef) toggle(item.alsoCourseRef);
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-start gap-3 p-3 rounded-xl text-left w-full shadow-sm transition-colors
        ${done ? 'bg-maroon-50 border border-maroon-200' : 'bg-white border border-gray-100'}
      `}
    >
      <div className={`
        mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${done ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
      `}>
        {done && <span className="text-white text-xs">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium leading-snug ${done ? 'text-maroon-700' : 'text-gray-800'}`}>
          {item.label}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{item.grants}</div>
      </div>
    </button>
  );
}
