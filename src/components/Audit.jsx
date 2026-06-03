import optionalData from '../data/optional.json';

const GRADUATION_CREDITS = 120;

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
export default function Audit({ program, completed, toggle }) {
  const totalDone     = calcTotalDone(program, completed);
  const totalRequired = GRADUATION_CREDITS;
  const remaining     = Math.max(0, totalRequired - totalDone);
  const pct           = Math.min(100, Math.round((totalDone / totalRequired) * 100));

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-24">

      {/* Overall credit summary */}
      <CreditSummary done={totalDone} required={totalRequired} remaining={remaining} pct={pct} />

      {/* Major required courses */}
      <AuditCategory
        title="Major Required Courses"
        items={program.courses.map(c => ({
          id: c.id,
          label: c.code ? `${c.code} — ${c.title}` : c.title,
          credits: c.credits,
        }))}
        creditsRequired={program.courses.reduce((s, c) => s + c.credits, 0)}
        completed={completed}
        toggle={toggle}
      />

      {/* Elective groups */}
      {Object.values(program.electiveOptions).map(group => (
        <AuditCategory
          key={group.label}
          title={group.label}
          note={group.note}
          items={(group.courses ?? []).map(c => ({
            id: c.id,
            label: `${c.code} — ${c.title}`,
            credits: c.credits,
          }))}
          creditsRequired={group.creditsRequired}
          completed={completed}
          toggle={toggle}
        />
      ))}

      {/* University Core */}
      <AuditCategory
        title="University Core Curriculum"
        items={program.coreRequirements.map(r => ({
          id: r.id,
          label: r.label,
          credits: r.credits,
        }))}
        creditsRequired={program.coreRequirements.reduce((s, r) => s + r.credits, 0)}
        completed={completed}
        toggle={toggle}
      />

      {/* Optional CS courses — shown for awareness, not counted toward 120 */}
      <OptionalAuditSection completed={completed} toggle={toggle} />

    </div>
  );
}

/** Sums all completed credits across courses, core, and elective options */
function calcTotalDone(program, completed) {
  const courses   = program.courses.filter(c => completed.has(c.id)).reduce((s, c) => s + c.credits, 0);
  const core      = program.coreRequirements.filter(r => completed.has(r.id)).reduce((s, r) => s + r.credits, 0);
  const electives = Object.values(program.electiveOptions)
    .flatMap(g => g.courses ?? [])
    .filter(c => completed.has(c.id))
    .reduce((s, c) => s + c.credits, 0);
  return courses + core + electives;
}

/** Top-level credit summary card */
function CreditSummary({ done, required, remaining, pct }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-maroon-200 shadow-sm">
      <div className="bg-maroon-500 px-4 py-4">
        <div className="text-white text-lg font-bold">{done} / {required} Credits Complete</div>
        <div className="text-maroon-200 text-sm mt-0.5">{remaining} credits remaining to graduate</div>
      </div>
      <div className="h-2 bg-maroon-100">
        <div
          className="h-full bg-maroon-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
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
function AuditCategory({ title, note, items, creditsRequired, completed, toggle }) {
  const doneItems      = items.filter(i => completed.has(i.id));
  const remainingItems = items.filter(i => !completed.has(i.id));
  const doneCredits    = doneItems.reduce((s, i) => s + (i.credits ?? 0), 0);
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
          <AuditRow key={item.id} item={item} done={true} toggle={toggle} />
        ))}

        {/* Remaining items */}
        {remainingItems.map(item => (
          <AuditRow key={item.id} item={item} done={false} toggle={toggle} />
        ))}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="px-4 py-3 text-xs text-gray-400 italic">
            Choose courses from the elective list above.
          </div>
        )}
      </div>
    </div>
  );
}

/** A single course row in the audit — tappable to toggle completion */
function AuditRow({ item, done, toggle }) {
  return (
    <button
      onClick={() => toggle(item.id)}
      className="flex items-center gap-3 px-4 py-2.5 w-full text-left active:bg-gray-50 transition-colors"
    >
      <div className={`
        flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center
        ${done ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
      `}>
        {done && <span className="text-white text-[9px] leading-none">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm leading-snug ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
          {item.label}
        </span>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{item.credits} cr</span>
    </button>
  );
}

/**
 * Optional CS courses — writing intensive and core eligible.
 * Shown for awareness only; not counted toward the 120-credit total.
 */
function OptionalAuditSection({ completed, toggle }) {
  const groups = [optionalData.writingIntensive, optionalData.coreEligible];

  return (
    <div className="rounded-xl overflow-hidden border border-gold-100 shadow-sm">
      <div className="bg-gold-400 px-4 py-3">
        <div className="text-white text-sm font-semibold">Optional CS Courses</div>
        <div className="text-gold-100 text-xs mt-0.5">
          Not required for graduation — available to satisfy Writing Intensive or Core requirements.
        </div>
      </div>

      <div className="bg-white divide-y divide-gray-50">
        {groups.flatMap(g => g.courses).map(course => {
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
