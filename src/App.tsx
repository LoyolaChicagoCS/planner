import { useState, useEffect } from 'react';
import { useProgress } from './hooks/useProgress';
import { encodeCompletedIds, getValidProgressIds, validateProgressIds } from './utils/shareLink';
import HomeScreen from './components/HomeScreen';
import ProgramScreen from './components/ProgramScreen';
import { PROGRAMS } from './data/programs';
import type { Program } from './types';

validateProgressIds(getValidProgressIds(PROGRAMS));

const ADDITIONAL_STORAGE_KEY = 'advising_additional';

function loadAdditionalPrograms(): Program[] {
  try {
    const raw = localStorage.getItem(ADDITIONAL_STORAGE_KEY);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    return ids.flatMap(id => PROGRAMS.filter(p => p.id === id));
  } catch {
    return [];
  }
}

function parseAdditionalFromUrl(): Program[] {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('m');
  if (!raw) return [];
  return raw.split(',').flatMap(id => PROGRAMS.filter(p => p.id === id.trim()));
}

export default function App() {
  const [activeProgram, setActiveProgram] = useState<Program | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const progId = params.get('p');
    return PROGRAMS.find(p => p.id === progId) ?? null;
  });

  const [additionalPrograms, setAdditionalPrograms] = useState<Program[]>(() => {
    const fromUrl = parseAdditionalFromUrl();
    return fromUrl.length > 0 ? fromUrl : loadAdditionalPrograms();
  });

  const { completed, toggle, clear } = useProgress(PROGRAMS);

  useEffect(() => {
    localStorage.setItem(
      ADDITIONAL_STORAGE_KEY,
      JSON.stringify(additionalPrograms.map(p => p.id)),
    );
  }, [additionalPrograms]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeProgram) {
      params.set('p', activeProgram.id);
      const additionalIds = additionalPrograms.map(p => p.id);
      if (additionalIds.length > 0) params.set('m', additionalIds.join(','));
      const validIds = getValidProgressIds(PROGRAMS, activeProgram.id, additionalIds);
      const shareIds = new Set<string>([...completed].filter(id => validIds.has(id)));
      if (shareIds.size > 0) params.set('d', encodeCompletedIds(shareIds));
      history.replaceState(null, '', `?${params}`);
    } else {
      history.replaceState(null, '', window.location.pathname);
    }
  }, [activeProgram, additionalPrograms, completed]);

  function addProgram(program: Program): void {
    setAdditionalPrograms(prev =>
      prev.some(p => p.id === program.id) ? prev : [...prev, program],
    );
  }

  function removeProgram(id: string): void {
    setAdditionalPrograms(prev => prev.filter(p => p.id !== id));
  }

  return (
    <div className="h-full">
      {activeProgram ? (
        <ProgramScreen
          program={activeProgram}
          allPrograms={PROGRAMS}
          additionalPrograms={additionalPrograms}
          onAddProgram={addProgram}
          onRemoveProgram={removeProgram}
          completed={completed}
          toggle={toggle}
          clear={clear}
          onBack={() => setActiveProgram(null)}
        />
      ) : (
        <HomeScreen
          programs={PROGRAMS}
          onSelect={setActiveProgram}
          additionalPrograms={additionalPrograms}
          onAddProgram={addProgram}
          onRemoveProgram={removeProgram}
        />
      )}
    </div>
  );
}
