import { useState } from 'react';
import { useProgress } from './hooks/useProgress';
import HomeScreen from './components/HomeScreen';
import ProgramScreen from './components/ProgramScreen';

// Program data files — add more here as they are built out
import csData from './data/cs.json';

/**
 * Available degree programs. Each entry needs at minimum:
 *   id, name, degree, totalCredits
 * The rest of the data lives in the imported JSON.
 */
const PROGRAMS = [
  csData,
  // Placeholder stubs — will be replaced with real JSON files
  { id: 'se',            name: 'Software Engineering',  degree: 'BS', totalCredits: 120 },
  { id: 'it',            name: 'Information Technology', degree: 'BS', totalCredits: 120 },
  { id: 'cybersecurity', name: 'Cybersecurity',          degree: 'BS', totalCredits: 120 },
  { id: 'datascience',   name: 'Data Science',           degree: 'BS', totalCredits: 120 },
];

export default function App() {
  // null = home screen; a program object = program detail screen
  const [activeProgram, setActiveProgram] = useState(null);

  const {
    completed, toggle,
    hasConsent, grantConsent,
    exportJSON, importJSON,
  } = useProgress();

  // Stub programs have no courses array — show a placeholder until data is added
  if (activeProgram && !activeProgram.courses) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex items-center gap-3 px-4 pt-10 pb-3 bg-white border-b border-gray-100">
          <button onClick={() => setActiveProgram(null)} className="p-2 -ml-1 rounded-xl text-gray-500 text-lg">
            ←
          </button>
          <h1 className="text-base font-bold text-gray-900">{activeProgram.name}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Curriculum data coming soon.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {activeProgram ? (
        <ProgramScreen
          program={activeProgram}
          completed={completed}
          toggle={toggle}
          hasConsent={hasConsent}
          grantConsent={grantConsent}
          exportJSON={exportJSON}
          importJSON={importJSON}
          onBack={() => setActiveProgram(null)}
        />
      ) : (
        <HomeScreen programs={PROGRAMS} onSelect={setActiveProgram} />
      )}
    </div>
  );
}
