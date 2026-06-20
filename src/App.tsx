import { useState, useEffect } from 'react';
import { useProgress } from './hooks/useProgress';
import { encodeCompletedIds, getValidProgressIds, validateProgressIds } from './utils/shareLink';
import HomeScreen from './components/HomeScreen';
import ProgramScreen from './components/ProgramScreen';
import { PROGRAMS } from './data/programs';

validateProgressIds(getValidProgressIds(PROGRAMS));

export default function App() {
  const [activeProgram, setActiveProgram] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const progId = params.get('p');
    return PROGRAMS.find(p => p.id === progId) ?? null;
  });

  const { completed, toggle, clear } = useProgress(PROGRAMS);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeProgram) {
      params.set('p', activeProgram.id);
      const validIds = getValidProgressIds(PROGRAMS, activeProgram.id);
      const shareIds = new Set<string>([...completed].filter(id => validIds.has(id)));
      if (shareIds.size > 0) params.set('d', encodeCompletedIds(shareIds));
      history.replaceState(null, '', `?${params}`);
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }, [activeProgram, completed]);

  return (
    <div className="h-full">
      {activeProgram ? (
        <ProgramScreen
          program={activeProgram}
          allPrograms={PROGRAMS}
          completed={completed}
          toggle={toggle}
          clear={clear}
          onBack={() => setActiveProgram(null)}
        />
      ) : (
        <HomeScreen
          programs={PROGRAMS}
          onSelect={setActiveProgram}
        />
      )}
    </div>
  );
}
