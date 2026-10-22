const PROGRESS_KEY = 'outlier-quiz:progress:v1';
const MAX_SESSIONS = 30;

export function emptyProgress() {
  return {
    version: 1,
    // id -> { attempts, correct, lastCorrect, lastAt }
    questions: {},
    // ids of questions answered wrong and not yet fixed in Review mode
    mistakes: [],
    // most recent first
    sessions: [],
  };
}

// localStorage can be missing, full, or blocked (private mode), so every
// access is wrapped and the app falls back to in-memory state.
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore: the value just won't persist
  }
}

export function loadProgress() {
  const stored = readJSON(PROGRESS_KEY, null);
  if (!stored || stored.version !== 1) return emptyProgress();
  return { ...emptyProgress(), ...stored };
}

export function saveProgress(progress) {
  writeJSON(PROGRESS_KEY, progress);
}

export function recordAnswer(progress, question, isCorrect, mode) {
  const { id } = question;
  const prev = progress.questions[id] ?? { attempts: 0, correct: 0 };
  const entry = {
    attempts: prev.attempts + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    lastCorrect: isCorrect,
    lastAt: Date.now(),
  };

  let { mistakes } = progress;
  if (!isCorrect && !mistakes.includes(id)) {
    mistakes = [...mistakes, id];
  } else if (isCorrect && mode === 'review') {
    // A question leaves the mistakes list only when you get it right in Review
    // mode, so a lucky guess during normal practice doesn't hide it.
    mistakes = mistakes.filter((m) => m !== id);
  }

  return { ...progress, questions: { ...progress.questions, [id]: entry }, mistakes };
}

export function recordSession(progress, session) {
  return { ...progress, sessions: [session, ...progress.sessions].slice(0, MAX_SESSIONS) };
}
