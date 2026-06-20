import type { Program } from '../types';

interface ProgramPickerProps {
  programs: Program[];
  activeProgram: Program | null;
  additionalPrograms: Program[];
  onAdd: (program: Program) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export default function ProgramPicker({
  programs,
  activeProgram,
  additionalPrograms,
  onAdd,
  onRemove,
  onClose,
}: ProgramPickerProps) {
  const additionalIds = new Set(additionalPrograms.map(p => p.id));
  const activeProgramId = activeProgram?.id;

  // Exclude graduate programs and the active primary program.
  // Include CS-dept minors (so CS majors can track a minor alongside their major).
  const pickable = programs.filter(
    p => p.id !== activeProgramId
      && p.kind !== 'masters'
      && p.kind !== 'phd'
      && (p.department !== 'Computer Science' || p.kind === 'minor'),
  );

  // Group by department
  const byDept = new Map<string, Program[]>();
  for (const p of pickable) {
    const dept = p.department ?? 'Other';
    if (!byDept.has(dept)) byDept.set(dept, []);
    byDept.get(dept)!.push(p);
  }
  const deptEntries = [...byDept.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mt-auto flex flex-col bg-white rounded-t-2xl max-h-[80vh]">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 pt-2 flex items-center justify-between border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add an Additional Major or Minor</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select programs to track alongside your primary major</p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-gray-400 font-semibold px-3 py-1 rounded-full active:bg-gray-100"
          >
            Done
          </button>
        </div>

        {/* Program list */}
        <div className="overflow-y-auto flex-1">
          {deptEntries.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No additional programs available yet.<br />
              <span className="text-xs">Other CAS department programs coming soon.</span>
            </div>
          ) : (
            deptEntries.map(([dept, deptPrograms]) => (
              <div key={dept}>
                <div className="px-5 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {dept}
                </div>
                <div className="divide-y divide-gray-50">
                  {deptPrograms
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(program => {
                      const selected = additionalIds.has(program.id);
                      return (
                        <button
                          key={program.id}
                          onClick={() => selected ? onRemove(program.id) : onAdd(program)}
                          className="w-full flex items-center gap-3 px-5 py-3 text-left active:bg-gray-50 transition-colors"
                        >
                          <div className={`
                            flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                            ${selected ? 'bg-maroon-500 border-maroon-500' : 'border-gray-300'}
                          `}>
                            {selected && <span className="text-white text-[9px] leading-none">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{program.name}</div>
                            <div className="text-xs text-gray-400">
                              {program.degree} · {program.majorCredits ?? program.minorCredits ?? program.totalCredits} credits
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))
          )}
          {/* Bottom safe area spacer */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
