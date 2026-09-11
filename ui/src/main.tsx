import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { applyTheme, getStoredTheme } from '@/lib/utils/theme';
import { loadLockedPat } from '@/lib/utils/patVault';
import { useSessionStore } from '@/store/sessionStore';
import './index.css';

(async () => {
  // Apply saved theme before React mounts to prevent flash of wrong theme.
  applyTheme(getStoredTheme());

  // Check for an encrypted PAT in IndexedDB before React mounts so the store
  // is pre-populated and the user sees themselves as connected on first render.
  try {
    const vault = await loadLockedPat();
    if (vault) {
      useSessionStore.getState().connect(vault.pat, vault.organization);
      useSessionStore.getState().setPatPersisted(true, vault.lockedAt);
    }
  } catch {
    // IDB unavailable (private browsing, browser restriction) - silently skip.
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
