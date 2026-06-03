import { useState } from 'react';
import { useProgress } from './hooks/useProgress';
import HomeScreen from './components/HomeScreen';
import ProgramScreen from './components/ProgramScreen';

// Program data files — add more here as they are built out
import csData           from './data/cs.json';
import seData           from './data/se.json';
import itData           from './data/it.json';
import cybersecurityData from './data/cybersecurity.json';
import datascienceData  from './data/datascience.json';

const PROGRAMS = [csData, seData, itData, cybersecurityData, datascienceData];

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
