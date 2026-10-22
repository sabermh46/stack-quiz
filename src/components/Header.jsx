import { THEMES } from '../lib/theme.js';

const THEME_LABELS = { system: 'Auto', light: 'Light', dark: 'Dark' };
const THEME_ICONS = { system: '◐', light: '☀', dark: '☾' };

export default function Header({ theme, onThemeChange, onHome, onStats, onNotebook, inQuiz }) {
  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    onThemeChange(next);
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button
          type="button"
          className="brand"
          onClick={onHome}
          disabled={inQuiz}
          title={inQuiz ? 'Use “Quit” to leave the session' : 'Home'}
        >
          <img className="brand__logo" src="/favicon.svg" alt="" width="28" height="28" />
          <span>Skill Drills</span>
        </button>
        <div className="header-actions">
          {!inQuiz && (
            <>
              <button type="button" className="btn btn--ghost btn--small" onClick={onNotebook}>
                Notebook
              </button>
              <button type="button" className="btn btn--ghost btn--small" onClick={onStats}>
                Stats
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={cycleTheme}
            aria-label={`Theme: ${THEME_LABELS[theme]}. Click to change.`}
          >
            <span aria-hidden="true">{THEME_ICONS[theme]}</span>
            {THEME_LABELS[theme]}
          </button>
        </div>
      </div>
    </header>
  );
}
