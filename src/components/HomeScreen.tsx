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
  cs:            'from-maroon-500 to-maroon-700',
  se:            'from-maroon-400 to-maroon-600',
  it:            'from-gold-400 to-gold-600',
  cybersecurity: 'from-maroon-600 to-maroon-800',
  datascience:   'from-gold-500 to-maroon-600',
  bioinformatics: 'from-maroon-500 to-gold-700',
  'cs-minor': 'from-maroon-500 to-gray-800',
  'it-minor': 'from-gold-400 to-gray-800',
  'computer-crime-forensics-minor': 'from-maroon-600 to-gold-600',
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
  bioinformatics: '🧬',
  'cs-minor': '💻',
  'it-minor': '🌐',
  'computer-crime-forensics-minor': '🔎',
  'ai-minor': '🤖',
  'ai-human-flourishing-minor': '🧠',
  'business-ai-minor': '💼',
};

const REPOSITORY_URL = 'https://github.com/LoyolaChicagoCS/planner';

interface HomeScreenProps {
  programs: Program[];
  onSelect: (program: Program) => void;
}

interface ProgramGroupProps extends HomeScreenProps {
  title: string;
}

const PROGRAM_COLOR_BY_ID: Record<string, string> = PROGRAM_COLORS;
const PROGRAM_ICON_BY_ID: Record<string, string> = PROGRAM_ICONS;
const sortByProgramName = (programs: Program[]) =>
  [...programs].sort((first, second) => first.name.localeCompare(second.name));

export default function HomeScreen({ programs, onSelect }: HomeScreenProps) {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const departmentalDegrees = sortByProgramName(
    programs.filter(program => ['cs', 'se', 'it', 'cybersecurity'].includes(program.id))
  );
  const interdisciplinaryMajors = sortByProgramName(
    programs.filter(program => program.kind === 'interdisciplinary')
  );
  const minors = sortByProgramName(programs.filter(program => program.kind === 'minor'));
  const handleProgramListScroll = (scrollTop: number) => {
    const shouldHideHeader = scrollTop > 0;
    setIsHeaderHidden(previous => previous === shouldHideHeader ? previous : shouldHideHeader);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header — LUC maroon bar */}
      <div
        className={`overflow-hidden bg-maroon-500 transition-all duration-300 ease-out
          ${isHeaderHidden ? 'max-h-0 opacity-0' : 'max-h-56 opacity-100'}`}
      >
        <div className="px-6 pt-12 pb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                <img
                  src={loyolaLogo}
                  alt="Loyola Ramblers"
                  className="h-full w-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-white leading-tight">Loyola CS Advising Checklist</h1>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <a
                href={REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="View source code on GitHub"
                title="View source code on GitHub"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white shadow-sm transition-colors active:bg-white/25"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M8 0C3.58 0 0 3.67 0 8.2c0 3.62 2.29 6.69 5.47 7.77.4.08.55-.18.55-.4v-1.4c-2.23.5-2.7-1.1-2.7-1.1-.36-.95-.89-1.2-.89-1.2-.73-.51.05-.5.05-.5.81.06 1.24.85 1.24.85.72 1.26 1.89.9 2.35.69.07-.53.28-.9.51-1.1-1.78-.21-3.64-.91-3.64-4.04 0-.89.31-1.62.82-2.19-.08-.21-.36-1.04.08-2.16 0 0 .67-.22 2.2.84A7.38 7.38 0 0 1 8 3.58c.68 0 1.36.09 2 .27 1.52-1.06 2.19-.84 2.19-.84.44 1.12.16 1.95.08 2.16.51.57.82 1.3.82 2.19 0 3.14-1.87 3.83-3.65 4.03.29.26.54.76.54 1.53v2.65c0 .22.14.48.55.4A8.12 8.12 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z" />
                </svg>
              </a>
              <span className="rounded-full bg-gold-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-maroon-900 shadow-sm">
                {import.meta.env.VITE_APP_VERSION}
              </span>
            </div>
          </div>
          <p className="text-maroon-100 mt-2 text-sm leading-relaxed">
            Track progress toward Loyola CS degrees, interdisciplinary majors, and minors, then bring your checklist to advising conversations.
          </p>
        </div>
      </div>

      {/* Program cards */}
      <div
        onScroll={event => handleProgramListScroll(event.currentTarget.scrollTop)}
        className="flex-1 overflow-y-auto px-4 pt-5 pb-8 space-y-4"
      >
        <ProgramGroup title="Departmental Degree Programs" programs={departmentalDegrees} onSelect={onSelect} />
        <ProgramGroup title="Interdisciplinary Majors" programs={interdisciplinaryMajors} onSelect={onSelect} />
        <ProgramGroup title="Minors" programs={minors} onSelect={onSelect} />
      </div>
      <Footer />
    </div>
  );
}

function ProgramGroup({ title, programs, onSelect }: ProgramGroupProps) {
  if (!programs.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</h2>
      {programs.map(program => (
        <button
          key={program.id}
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
