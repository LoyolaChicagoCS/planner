import { useState, useEffect } from 'react';
import { decodeCompletedIds, getValidProgressIds } from '../utils/shareLink';
import type { Program } from '../types';

const STORAGE_KEY = 'advising_progress';

export interface UseProgressResult {
  completed: Set<string>;
  toggle: (id: string) => void;
  clear: (idsToClear: Iterable<string>) => void;
}

function parseSavedProgress(value: string | null): string[] {
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed)
    ? parsed.filter((id): id is string => typeof id === 'string')
    : [];
}

/**
 * Manages the student's progress — which courses/items they've checked off.
 *
 * Persistence strategy:
 *   1. On load, URL params (?d=...) take priority over localStorage.
 *      This lets a shared link always restore the sender's exact state.
 *   2. Every change is silently auto-saved to localStorage so returning
 *      students pick up where they left off.
 *
 * No personal data, no server calls, no consent flow needed.
 */
export function useProgress(programs: Program[]): UseProgressResult {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    // URL params win over localStorage on initial load
    const params = new URLSearchParams(window.location.search);
    const programId = params.get('p') ?? undefined;
    const validIds = getValidProgressIds(programs, programId);
    const urlDone = params.get('d');
    if (urlDone) return new Set(decodeCompletedIds(urlDone, validIds));

    const saved = localStorage.getItem(STORAGE_KEY);
    return new Set(parseSavedProgress(saved));
  });

  // Auto-save every change to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  }, [completed]);

  function toggle(id: string): void {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function clear(idsToClear: Iterable<string>): void {
    setCompleted(prev => {
      const next = new Set(prev);
      for (const id of idsToClear) next.delete(id);
      return next;
    });
  }

  return { completed, toggle, clear };
}
