export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'tooldock-theme';

/**
 * UI preference only (not a credential), so unlike the PAT/session it's fine
 * to persist. Defaults to light on first visit.
 */
export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

/** Apply the theme class to <html> and persist the choice. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
