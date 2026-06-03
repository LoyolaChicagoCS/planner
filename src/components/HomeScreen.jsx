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
};

const PROGRAM_ICONS = {
  cs:            '💻',
  se:            '🛠️',
  it:            '🌐',
  cybersecurity: '🔒',
  datascience:   '📊',
};

export default function HomeScreen({ programs, onSelect }) {
  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header — LUC maroon bar */}
      <div className="px-6 pt-12 pb-6 bg-maroon-500">
        <h1 className="text-2xl font-bold text-white">LUC Computer Science Advising</h1>
        <p className="text-maroon-200 mt-1 text-sm">
          Tap a program to explore requirements and your four-year plan.
        </p>
      </div>

      {/* Program cards */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8 space-y-4">
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
              {program.degree} &middot; {program.totalCredits} credits
            </div>
          </button>
        ))}
      </div>
      <Footer />
    </div>
  );
}
