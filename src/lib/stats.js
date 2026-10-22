import { DIFFICULTIES } from './questions.js';

function summarize(questions, progress) {
  const mistakeSet = new Set(progress.mistakes);
  let seen = 0;
  let attempts = 0;
  let correct = 0;
  let mastered = 0;
  let mistakes = 0;

  for (const q of questions) {
    if (mistakeSet.has(q.id)) mistakes++;
    const entry = progress.questions[q.id];
    if (!entry) continue;
    seen++;
    attempts += entry.attempts;
    correct += entry.correct;
    if (entry.lastCorrect) mastered++;
  }

  return {
    total: questions.length,
    seen,
    attempts,
    correct,
    mastered,
    mistakes,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
  };
}

export function stackStats(questions, progress) {
  return {
    ...summarize(questions, progress),
    byDifficulty: Object.fromEntries(
      DIFFICULTIES.map((d) => [
        d,
        summarize(
          questions.filter((q) => q.difficulty === d),
          progress,
        ),
      ]),
    ),
  };
}
