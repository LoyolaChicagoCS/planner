import { useState, useEffect } from 'react';
import { decodeCompletedIds, getValidProgressIds } from '../utils/shareLink';

const STORAGE_KEY = 'advising_progress';

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
export function useProgress(programs) {
  const [completed, setCompleted] = useState(() => {
    // URL params win over localStorage on initial load
    const params = new URLSearchParams(window.location.search);
    const programId = params.get('p');
    const validIds = getValidProgressIds(programs, programId);
    const urlDone = params.get('d');
    if (urlDone) return new Set(decodeCompletedIds(urlDone, validIds));

    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Auto-save every change to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  }, [completed]);

  function toggle(id) {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return { completed, toggle };
}
