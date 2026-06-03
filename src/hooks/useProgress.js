import { useState, useEffect } from 'react';

const STORAGE_KEY = 'advising_progress';
const CONSENT_KEY = 'advising_consent';

/**
 * Manages the student's progress state — which courses/checklist items
 * they've marked complete — with optional localStorage persistence.
 *
 * On first use, the hook is purely in-memory. If the user grants consent,
 * state is written to localStorage and survives page reloads.
 * If consent is revoked, all persisted data is cleared.
 *
 * Returns:
 *   completed     — Set of course/item IDs the student has checked off
 *   toggle(id)    — Mark an item complete or incomplete
 *   hasConsent    — Whether the user has agreed to local storage
 *   grantConsent  — Call when the user accepts the persistence prompt
 *   revokeConsent — Call when the user wants to clear saved data
 *   exportJSON    — Triggers a file download of the current progress
 *   importJSON    — Accepts a JSON string to restore a previous export
 */
export function useProgress() {
  // Consent state is always persisted (it's just a boolean flag, not personal data)
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem(CONSENT_KEY) === 'true';
  });

  // Load initial completed set: from storage if consent exists, otherwise empty
  const [completed, setCompleted] = useState(() => {
    if (localStorage.getItem(CONSENT_KEY) === 'true') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Whenever completed changes, write to storage if the user consented
  useEffect(() => {
    if (hasConsent) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
    }
  }, [completed, hasConsent]);

  /** Toggle a single course or checklist item by its ID */
  function toggle(id) {
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

  /** User accepts the prompt to save progress across sessions */
  function grantConsent() {
    localStorage.setItem(CONSENT_KEY, 'true');
    setHasConsent(true);
  }

  /** User revokes consent — clears all stored data */
  function revokeConsent() {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setHasConsent(false);
  }

  /**
   * Download current progress as a JSON file so the student can save
   * and reload it later (e.g. on a different device).
   */
  function exportJSON() {
    const data = JSON.stringify({ completed: [...completed] }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-advising-progress.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Restore progress from a previously exported JSON string */
  function importJSON(jsonString) {
    try {
      const { completed: ids } = JSON.parse(jsonString);
      setCompleted(new Set(ids));
    } catch {
      console.error('Invalid progress file');
    }
  }

  return { completed, toggle, hasConsent, grantConsent, revokeConsent, exportJSON, importJSON };
}
