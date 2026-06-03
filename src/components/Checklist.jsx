/**
 * Checklist — lets students mark off prior credit (AP exams, transfer courses,
 * language proficiency) before they arrive. Completing an item here also marks
 * the corresponding course as done in the roadmap and course list.
 *
 * Props:
 *   program     — full program data object
 *   completed   — Set of completed IDs
 *   toggle      — function(id) to mark/unmark
 *   hasConsent  — whether the user has agreed to persist data
 *   grantConsent
 *   exportJSON
 *   importJSON
 */
export default function Checklist({ program, completed, toggle, hasConsent, grantConsent, exportJSON, importJSON }) {
  const apItems     = program.checklist.filter(i => i.category === 'ap');
  const transferItems = program.checklist.filter(i => i.category === 'transfer');

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => importJSON(ev.target.result);
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 pb-24">

      {/* Persistence consent banner — shown until the user decides */}
      {!hasConsent && (
        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4">
          <p className="text-sm text-gold-800 font-medium">Save your progress?</p>
          <p className="text-xs text-gold-700 mt-1">
            Your checklist can be saved in this browser so it persists between visits.
            Nothing leaves your device.
          </p>
          <button
            onClick={grantConsent}
            className="mt-3 w-full bg-gold-500 text-white text-sm font-medium py-2 rounded-xl active:bg-gold-500"
          >
            Yes, save my progress locally
          </button>
        </div>
      )}

      <ChecklistSection
        title="AP Exam Credits"
        items={apItems}
        completed={completed}
        toggle={toggle}
      />

      <ChecklistSection
        title="Transfer & Placement Credits"
        items={transferItems}
        completed={completed}
        toggle={toggle}
      />

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

/** A labeled group of checklist items */
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

/** A single checklist row — tap to check off */
function ChecklistItem({ item, completed, toggle }) {
  // The item is "done" if the checklist item itself OR its linked course ref is checked
  const done = completed.has(item.id) || (item.courseRef && completed.has(item.courseRef));

  // Toggling this item marks BOTH the checklist entry and the course ref
  function handleToggle() {
    toggle(item.id);
    if (item.courseRef) toggle(item.courseRef);
    if (item.alsoCourseRef) toggle(item.alsoCourseRef);
  }

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-start gap-3 p-3 rounded-xl text-left w-full shadow-sm
        transition-colors
        ${done ? 'bg-maroon-50 border border-maroon-200' : 'bg-white border border-gray-100'}
      `}
    >
      {/* Checkbox */}
      <div className={`
        mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${done ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
      `}>
        {done && <span className="text-white text-xs">✓</span>}
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium leading-snug ${done ? 'text-maroon-700' : 'text-gray-800'}`}>
          {item.label}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{item.grants}</div>
      </div>
    </button>
  );
}
