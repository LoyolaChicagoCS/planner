import { useState } from 'react';

import Footer from './Footer';
import type { Program } from '../types';
import loyolaLogo from '../assets/loyola-ramblers-logo.svg';

const PROGRAM_COLORS: Record<string, string> = {
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

const PROGRAM_ICONS: Record<string, string> = {
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

type SchoolKey = 'cs' | 'cas';
type CsTabKey = 'majors' | 'interdisciplinary' | 'minors' | 'masters' | 'doctoral';

const SCHOOL_TABS: { key: SchoolKey; label: string }[] = [
  { key: 'cs',  label: 'CS Department' },
  { key: 'cas', label: 'Arts & Sciences' },
];

const CS_TABS: { key: CsTabKey; label: string }[] = [
  { key: 'majors',            label: 'Majors' },
  { key: 'interdisciplinary', label: 'Interdisciplinary' },
  { key: 'minors',            label: 'Minors' },
  { key: 'masters',           label: 'Masters' },
  { key: 'doctoral',          label: 'Doctoral' },
];

const sortByName = (arr: Program[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name));

function groupByDepartment(programs: Program[]): [string, Program[]][] {
  const map = new Map<string, Program[]>();
  for (const p of programs) {
    const dept = p.department ?? 'Other';
    if (!map.has(dept)) map.set(dept, []);
    map.get(dept)!.push(p);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dept, progs]) => [dept, sortByName(progs)]);
}

interface HomeScreenProps {
  programs: Program[];
  onSelect: (program: Program) => void;
}

export default function HomeScreen({ programs, onSelect }: HomeScreenProps) {
  const [school, setSchool] = useState<SchoolKey>('cs');
  const [csTab, setCsTab]   = useState<CsTabKey>('majors');

  // CS department programs
  const csPrograms = {
    majors:            sortByName(programs.filter(p => ['cs', 'se', 'it', 'cybersecurity', 'datascience', 'bioinformatics'].includes(p.id))),
    interdisciplinary: sortByName(programs.filter(p => p.kind === 'interdisciplinary')),
    minors:            sortByName(programs.filter(p => p.kind === 'minor')),
    masters:           sortByName(programs.filter(p => p.kind === 'masters')),
    doctoral:          sortByName(programs.filter(p => p.kind === 'phd')),
  };

  // CAS BA/BS programs (not CS dept, not Communication, not Business)
  const casPrograms = programs.filter(p =>
    (p.degree === 'BA' || p.degree === 'BS') &&
    p.department !== 'Computer Science' &&
    p.department !== 'Communication' &&
    p.department !== 'Business Administration',
  );
  const casByDept = groupByDepartment(casPrograms);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-maroon-500 flex-shrink-0">
        <div className="px-6 pt-12 pb-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                <img src={loyolaLogo} alt="Loyola Ramblers" className="h-full w-full object-contain" />
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

      {/* School selector */}
      <div className="flex bg-maroon-700 flex-shrink-0">
        {SCHOOL_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSchool(tab.key)}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
              school === tab.key
                ? 'bg-white text-maroon-700'
                : 'text-maroon-200 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {school === 'cs' ? (
        <>
          {/* CS sub-tabs */}
          <div className="flex bg-white border-b border-gray-200 flex-shrink-0">
            {CS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setCsTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  csTab === tab.key
                    ? 'text-maroon-600 border-b-2 border-maroon-600'
                    : 'text-gray-400 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div key={csTab} className="flex-1 overflow-y-auto px-4 pt-5 pb-8 space-y-3">
            {csPrograms[csTab].map(program => (
              <ProgramCard key={program.id} program={program} onSelect={onSelect} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8">
          {casByDept.map(([dept, progs]) => (
            <div key={dept} className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                {dept}
              </h2>
              <div className="space-y-2">
                {progs.map(program => (
                  <ProgramCard key={program.id} program={program} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
}

function ProgramCard({ program, onSelect }: { program: Program; onSelect: (p: Program) => void }) {
  const color = PROGRAM_COLORS[program.id] ?? 'from-maroon-500 to-maroon-700';
  const icon  = PROGRAM_ICONS[program.id] ?? '🎓';
  const isMinor = program.kind === 'minor';

  return (
    <button
      onClick={() => onSelect(program)}
      className={`
        w-full text-left rounded-2xl shadow-md
        bg-gradient-to-br ${color}
        text-white active:scale-95 transition-transform
        ${isMinor ? 'p-5' : 'p-4'}
      `}
    >
      <div className={`flex items-center gap-3 ${isMinor ? 'mb-2' : ''}`}>
        <div className={`${isMinor ? 'text-3xl' : 'text-2xl'} flex-shrink-0`}>{icon}</div>
        <div className={`${isMinor ? 'text-lg' : 'text-xl'} font-bold leading-tight`}>
          {program.name}
        </div>
      </div>
      <div className="text-sm opacity-80 mt-1">
        {program.degree}
        {program.kind === 'minor'
          ? ` · ${program.minorCredits ?? program.totalCredits} minor credits`
          : program.kind === 'masters'
          ? ` · ${program.totalCredits} program credits`
          : program.kind === 'phd'
          ? ` · ${program.totalCredits} program credits`
          : program.majorCredits
          ? ` · ${program.majorCredits} major credits`
          : ` · ${program.totalCredits} credits`}
      </div>
    </button>
  );
}
