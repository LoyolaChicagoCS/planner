import Footer from './Footer';

/**
 * HomeScreen — the landing page showing one card per degree program.
 * Tapping a card navigates into that program's detail view.
 *
 * Props:
 *   programs  — array of program data objects (id, name, degree, totalCredits)
 *   onSelect  — callback(program) when a card is tapped
 */

// Each program gets a distinct gradient, all anchored in LUC maroon/gold tones
const PROGRAM_COLORS = {
  cs:            'from-maroon-500 to-maroon-700',
  se:            'from-maroon-400 to-maroon-600',
  it:            'from-gold-400 to-gold-600',
  cybersecurity: 'from-maroon-600 to-maroon-800',
  datascience:   'from-gold-500 to-maroon-600',
  'ai-minor': 'from-maroon-500 to-gold-600',
  'ai-human-flourishing-minor': 'from-maroon-600 to-gray-800',
  'business-ai-minor': 'from-gold-500 to-gray-800',
};

const PROGRAM_ICONS = {
  cs:            '💻',
  se:            '🛠️',
  it:            '🌐',
  cybersecurity: '🔒',
  datascience:   '📊',
  'ai-minor': '🤖',
  'ai-human-flourishing-minor': '🧠',
  'business-ai-minor': '💼',
};

export default function HomeScreen({ programs, onSelect }) {
  const degreePrograms = programs.filter(program => program.kind !== 'minor');
  const minors = programs.filter(program => program.kind === 'minor');

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header — LUC maroon bar */}
      <div className="px-6 pt-12 pb-6 bg-maroon-500">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-white leading-tight">Loyola CS Advising Checklist</h1>
          <span className="flex-shrink-0 rounded-full bg-gold-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-maroon-900 shadow-sm">
            Beta
          </span>
        </div>
        <p className="text-maroon-100 mt-2 text-sm leading-relaxed">
          Track progress toward Loyola CS degree and minor requirements and bring your checklist to advising conversations.
        </p>
        <p className="text-maroon-200 mt-2 text-xs leading-relaxed">
          Built to support planning with your human advisor, not replace them.
        </p>
      </div>

      {/* Program cards */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8 space-y-4">
        <ProgramGroup title="Degree Programs" programs={degreePrograms} onSelect={onSelect} />
        <ProgramGroup title="Minors" programs={minors} onSelect={onSelect} />
      </div>
      <Footer />
    </div>
  );
}

function ProgramGroup({ title, programs, onSelect }) {
  if (!programs.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
      {programs.map(program => (
        <button
          key={program.id}
          onClick={() => onSelect(program)}
          className={`
            w-full text-left rounded-2xl p-5 shadow-md
            bg-gradient-to-br ${PROGRAM_COLORS[program.id] ?? 'from-maroon-500 to-maroon-700'}
            text-white active:scale-95 transition-transform
          `}
        >
          <div className="text-3xl mb-2">{PROGRAM_ICONS[program.id] ?? '🎓'}</div>
          <div className="text-lg font-semibold leading-tight">{program.name}</div>
          <div className="text-sm opacity-80 mt-1">
            {program.degree} &middot; {program.kind === 'minor'
              ? `${program.minorCredits ?? program.totalCredits} minor credits`
              : `${program.totalCredits} roadmap credits`}
          </div>
          {program.majorCredits && (
            <div className="text-xs opacity-75 mt-0.5">
              {program.majorCredits} major credits
            </div>
          )}
        </button>
      ))}
    </section>
  );
}
