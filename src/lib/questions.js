import html from '../data/html.json';
import css from '../data/css.json';
import javascript from '../data/javascript.json';
import react from '../data/react.json';
import typescript from '../data/typescript.json';
import { shuffle } from './shuffle.js';

export const STACKS = [
  { id: 'html', label: 'HTML', questions: html },
  { id: 'css', label: 'CSS', questions: css },
  { id: 'javascript', label: 'JavaScript', questions: javascript },
  { id: 'react', label: 'React', questions: react },
  { id: 'typescript', label: 'TypeScript', questions: typescript },
];

export const MIXED = 'mixed';
export const LETTERS = ['A', 'B', 'C', 'D'];
export const DIFFICULTIES = ['medium', 'hard', 'expert'];

export const STACK_LABELS = Object.fromEntries(STACKS.map((s) => [s.id, s.label]));

export const ALL_QUESTIONS = STACKS.flatMap((s) =>
  s.questions.map((q) => ({ ...q, stack: s.id })),
);

const QUESTION_BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id) {
  return QUESTION_BY_ID.get(id);
}

export function filterQuestions({ stack = MIXED, difficulty = MIXED, ids } = {}) {
  const idSet = ids ? new Set(ids) : null;
  return ALL_QUESTIONS.filter(
    (q) =>
      (stack === MIXED || q.stack === stack) &&
      (difficulty === MIXED || q.difficulty === difficulty) &&
      (!idSet || idSet.has(q.id)),
  );
}

// Picks the questions for one session, shuffling both the question order and
// each question's options. `answer` is an option id, so it survives the shuffle.
export function buildSession({ stack, difficulty, ids, count }) {
  const pool = shuffle(filterQuestions({ stack, difficulty, ids }));
  const picked = count && count < pool.length ? pool.slice(0, count) : pool;
  return picked.map((q) => ({ ...q, options: shuffle(q.options) }));
}
