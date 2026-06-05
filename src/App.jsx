import { useState, useEffect } from 'react';
import { useProgress } from './hooks/useProgress';
import { encodeCompletedIds, getValidProgressIds, validateProgressIds } from './utils/shareLink';
import HomeScreen from './components/HomeScreen';
import ProgramScreen from './components/ProgramScreen';

import csData            from './data/cs.json';
import seData            from './data/se.json';
import itData            from './data/it.json';
import cybersecurityData from './data/cybersecurity.json';
import datascienceData   from './data/datascience.json';

const PROGRAMS = [csData, seData, itData, cybersecurityData, datascienceData];
validateProgressIds(getValidProgressIds(PROGRAMS));

export default function App() {
  // Restore active program from URL param on first load
  const [activeProgram, setActiveProgram] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const progId = params.get('p');
    return PROGRAMS.find(p => p.id === progId) ?? null;
  });

  const { completed, toggle } = useProgress(PROGRAMS);

  // Keep the URL in sync with current program + completed state so the
  // page is always shareable without any manual action by the student.
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeProgram) {
      params.set('p', activeProgram.id);
      const validIds = getValidProgressIds(PROGRAMS, activeProgram.id);
      const shareIds = new Set([...completed].filter(id => validIds.has(id)));
      if (shareIds.size > 0) params.set('d', encodeCompletedIds(shareIds));
      history.replaceState(null, '', `?${params}`);
    } else {
      // Back on home — clear params but keep the path
      history.replaceState(null, '', window.location.pathname);
    }
  }, [activeProgram, completed]);

  return (
    <div className="h-full">
      {activeProgram ? (
        <ProgramScreen
          program={activeProgram}
          completed={completed}
          toggle={toggle}
          onBack={() => setActiveProgram(null)}
        />
      ) : (
        <HomeScreen programs={PROGRAMS} onSelect={setActiveProgram} />
      )}
    </div>
  );
}
