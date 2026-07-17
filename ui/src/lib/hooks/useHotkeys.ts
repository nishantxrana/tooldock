import { useEffect } from 'react';

/**
 * Register Ctrl/Cmd+Enter to run the primary action of the active tool.
 * Disabled when `enabled` is false.
 */
export function useCtrlEnter(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handler();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}
