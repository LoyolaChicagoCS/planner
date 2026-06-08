import { useEffect, useState } from 'react';

const AUTO_HIDE_MS = 12000;
const dismissListeners = new Set<() => void>();
let isDismissed = false;

function dismissAllFooters(): void {
  isDismissed = true;
  for (const listener of dismissListeners) listener();
}

/**
 * Privacy and advising support note — shown on every screen.
 */
export default function Footer() {
  const [visible, setVisible] = useState(!isDismissed);

  useEffect(() => {
    const hideFooter = () => setVisible(false);
    dismissListeners.add(hideFooter);

    const timer = window.setTimeout(dismissAllFooters, AUTO_HIDE_MS);

    return () => {
      window.clearTimeout(timer);
      dismissListeners.delete(hideFooter);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="relative px-10 py-3 border-t border-gray-100 bg-white text-center">
      <p className="text-xs text-gray-400 leading-snug">
        No personal information, IP addresses, or usage data are collected, stored, or transmitted.
        Progress is saved only on your device. Use this checklist to prepare for conversations with your advisor.
      </p>
      <button
        type="button"
        onClick={dismissAllFooters}
        className="absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold text-gray-400 active:bg-gray-100"
        aria-label="Dismiss privacy note"
        title="Dismiss privacy note"
      >
        Dismiss
      </button>
    </div>
  );
}
