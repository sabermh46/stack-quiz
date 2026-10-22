// Stored as a plain string (not JSON) so the inline script in index.html can
// apply it before React loads.
const THEME_KEY = 'outlier-quiz:theme';
export const THEMES = ['system', 'light', 'dark'];

export function loadTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return THEMES.includes(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}
