import { useState } from 'react';

import Footer from './Footer';
import type { Program } from '../types';
import loyolaLogo from '../assets/loyola-ramblers-logo.svg';

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
  cs:            'from-maroon-600 to-maroon-800',
  se:            'from-gold-500 to-maroon-600',
  it:            'from-gold-400 to-maroon-500',
  cybersecurity: 'from-maroon-600 to-maroon-800',
  datascience:   'from-gold-400 to-maroon-500',
  bioinformatics: 'from-gold-500 to-maroon-600',
  'cs-minor': 'from-maroon-500 to-gold-700',
  'it-minor': 'from-gold-400 to-maroon-500',
  'computer-crime-forensics-minor': 'from-gold-500 to-maroon-700',
  'ai-minor': 'from-maroon-600 to-maroon-800',
  'ai-human-flourishing-minor': 'from-maroon-600 to-maroon-800',
  'business-ai-minor': 'from-maroon-500 to-gold-700',
  'ms-cs':            'from-maroon-700 to-maroon-900',
  'ms-it':            'from-gold-500 to-maroon-700',
  'ms-cybersecurity': 'from-maroon-600 to-maroon-900',
  'ms-se':            'from-gold-400 to-maroon-600',
  'ms-ds':            'from-maroon-500 to-gold-700',
  'phd-cs':           'from-maroon-900 to-gray-900',
};

const PROGRAM_ICONS = {
  cs:            '💻',
  se:            '🛠️',
  it:            '🌐',
  cybersecurity: '🔒',
  datascience:   '📊',
  bioinformatics: '🧬',
  'cs-minor': '💻',
  'it-minor': '🌐',
  'computer-crime-forensics-minor': '🔎',
  'ai-minor': '🤖',
  'ai-human-flourishing-minor': '🧠',
  'business-ai-minor': '💼',
  'ms-cs':            '🎓',
  'ms-it':            '🌐',
  'ms-cybersecurity': '🔒',
  'ms-se':            '🛠️',
  'ms-ds':            '📊',
  'phd-cs':           '🔬',
};


type TabKey = 'majors' | 'interdisciplinary' | 'minors' | 'masters' | 'doctoral';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'majors',           label: 'Majors' },
  { key: 'interdisciplinary', label: 'Interdisciplinary' },
  { key: 'minors',           label: 'Minors' },
  { key: 'masters',          label: 'Masters' },
  { key: 'doctoral',         label: 'Doctoral' },
];

interface HomeScreenProps {
  programs: Program[];
  onSelect: (program: Program) => void;
}

const PROGRAM_COLOR_BY_ID: Record<string, string> = PROGRAM_COLORS;
const PROGRAM_ICON_BY_ID: Record<string, string> = PROGRAM_ICONS;
const sortByProgramName = (programs: Program[]) =>
  [...programs].sort((first, second) => first.name.localeCompare(second.name));

export default function HomeScreen({ programs, onSelect }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('majors');

  const departmentalDegrees = sortByProgramName(
    programs.filter(program => ['cs', 'se', 'it', 'cybersecurity'].includes(program.id))
  );
  const interdisciplinaryMajors = sortByProgramName(
    programs.filter(program => program.kind === 'interdisciplinary')
  );
  const minors = sortByProgramName(programs.filter(program => program.kind === 'minor'));
  const mastersPrograms = sortByProgramName(programs.filter(program => program.kind === 'masters'));
  const doctoralPrograms = sortByProgramName(programs.filter(program => program.kind === 'phd'));

  const tabPrograms: Record<TabKey, Program[]> = {
    majors:           departmentalDegrees,
    interdisciplinary: interdisciplinaryMajors,
    minors:           minors,
    masters:          mastersPrograms,
    doctoral:         doctoralPrograms,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header — LUC maroon bar */}
      <div className="bg-maroon-500 flex-shrink-0">
        <div className="px-6 pt-12 pb-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                <img
                  src={loyolaLogo}
                  alt="Loyola Ramblers"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">Academic Checklist</h1>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="rounded-full bg-gold-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-maroon-900 shadow-sm">
                {import.meta.env.VITE_APP_VERSION}
              </span>
            </div>
          </div>
          <p className="text-maroon-100 mt-2 text-sm leading-relaxed">
            Track your progress in our degree programs.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white border-b border-gray-200 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex-1 py-2.5 text-xs font-semibold transition-colors
              ${activeTab === tab.key
                ? 'text-maroon-600 border-b-2 border-maroon-600'
                : 'text-gray-400 border-b-2 border-transparent'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Program cards */}
      <div
        key={activeTab}
        className="flex-1 overflow-y-auto px-4 pt-5 pb-8 space-y-3"
      >
        {tabPrograms[activeTab].map(program => (
          <ProgramCard key={program.id} program={program} onSelect={onSelect} />
        ))}
      </div>
      <Footer />
    </div>
  );
}

function ProgramCard({ program, onSelect }: { program: Program; onSelect: (p: Program) => void }) {
  return (
    <button
      onClick={() => onSelect(program)}
      className={`
        w-full text-left rounded-2xl shadow-md
        bg-gradient-to-br ${PROGRAM_COLOR_BY_ID[program.id] ?? 'from-maroon-500 to-maroon-700'}
        text-white active:scale-95 transition-transform
        ${program.kind === 'minor' ? 'p-5' : 'p-4'}
      `}
    >
      <div className={`flex items-center gap-3 ${program.kind === 'minor' ? 'mb-2' : ''}`}>
        <div className={`${program.kind === 'minor' ? 'text-3xl' : 'text-2xl'} flex-shrink-0`}>
          {PROGRAM_ICON_BY_ID[program.id] ?? '🎓'}
        </div>
        <div className={`${program.kind === 'minor' ? 'text-lg' : 'text-xl'} font-bold leading-tight`}>
          {program.name}
        </div>
      </div>
      <div className="text-sm opacity-80 mt-1">
        {program.degree} &middot; {program.kind === 'minor'
          ? `${program.minorCredits ?? program.totalCredits} minor credits`
          : program.kind === 'masters'
          ? `30–${program.totalCredits} program credits`
          : `${program.totalCredits} roadmap credits`}
      </div>
      {program.majorCredits && program.kind !== 'masters' && (
        <div className="text-xs opacity-75 mt-0.5">
          {program.majorCredits} major credits
        </div>
      )}
      {program.mastersCredits && program.kind === 'masters' && (
        <div className="text-xs opacity-75 mt-0.5">
          {program.mastersCredits} required credits
        </div>
      )}
    </button>
  );
}
