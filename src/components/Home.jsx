import { useEffect, useMemo, useState } from 'react';
import { DIFFICULTIES, MIXED, STACKS, ALL_QUESTIONS, filterQuestions } from '../lib/questions.js';
import { readJSON, writeJSON } from '../lib/storage.js';
import { stackStats } from '../lib/stats.js';

const CONFIG_KEY = 'outlier-quiz:last-config';
const DEFAULT_CONFIG = { stack: MIXED, difficulty: MIXED, count: 10 };
const COUNTS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 0, label: 'All' },
];

function loadConfig() {
  const saved = readJSON(CONFIG_KEY, {});
  return { ...DEFAULT_CONFIG, ...saved };
}

function accuracyLabel(stats) {
  return stats.accuracy === null ? 'not started' : `${stats.accuracy}% accuracy`;
}

export default function Home({ progress, onStart }) {
  const [config, setConfig] = useState(loadConfig);
  const { stack, difficulty, count } = config;

  useEffect(() => {
    writeJSON(CONFIG_KEY, config);
  }, [config]);

  const update = (patch) => setConfig((c) => ({ ...c, ...patch }));

  const stackCards = useMemo(
    () => [
      ...STACKS.map((s) => ({ id: s.id, label: s.label, stats: stackStats(s.questions, progress) })),
      { id: MIXED, label: 'Mixed', stats: stackStats(ALL_QUESTIONS, progress) },
    ],
    [progress],
  );

  const available = filterQuestions({ stack, difficulty }).length;
  const mistakeIds = filterQuestions({ stack, difficulty, ids: progress.mistakes }).map((q) => q.id);
  const sessionSize = count && count < available ? count : available;

  return (
    <div className="home">
      <section className="hero">
        <h1>Sharpen the tricky parts</h1>
        <p>
          Edge cases, misconceptions, and “what does this output?” questions across HTML, CSS, JavaScript,
          React, and TypeScript.
        </p>
      </section>

      <form className="panel" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="field">
          <legend>Stack</legend>
          <div className="stack-grid">
            {stackCards.map((card) => (
              <label key={card.id} className="choice-card">
                <input
                  type="radio"
                  name="stack"
                  className="visually-hidden"
                  checked={stack === card.id}
                  onChange={() => update({ stack: card.id })}
                />
                <span className="choice-card__title">{card.label}</span>
                <span className="choice-card__meta">
                  {card.stats.total} questions · {accuracyLabel(card.stats)}
                </span>
                {card.stats.mistakes > 0 && (
                  <span className="choice-card__flag">{card.stats.mistakes} to review</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>Difficulty</legend>
          <div className="segmented">
            {[MIXED, ...DIFFICULTIES].map((d) => (
              <label key={d} className="segment">
                <input
                  type="radio"
                  name="difficulty"
                  className="visually-hidden"
                  checked={difficulty === d}
                  onChange={() => update({ difficulty: d })}
                />
                <span>
                  {d === MIXED ? 'Mixed' : d[0].toUpperCase() + d.slice(1)}
                  <span className="segment__count">{filterQuestions({ stack, difficulty: d }).length}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>Questions per session</legend>
          <div className="segmented">
            {COUNTS.map((c) => (
              <label key={c.value} className="segment">
                <input
                  type="radio"
                  name="count"
                  className="visually-hidden"
                  checked={count === c.value}
                  onChange={() => update({ count: c.value })}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="start-actions">
          <button
            type="button"
            className="btn btn--primary btn--large"
            disabled={available === 0}
            onClick={() => onStart({ stack, difficulty, count, mode: 'practice' })}
          >
            {available === 0 ? 'No questions match' : `Start practice · ${sessionSize}`}
          </button>
          <button
            type="button"
            className="btn btn--large"
            disabled={mistakeIds.length === 0}
            onClick={() => onStart({ stack, difficulty, count: 0, mode: 'review', ids: mistakeIds })}
          >
            Review my mistakes · {mistakeIds.length}
          </button>
        </div>
        <p className="hint">
          Questions and options are shuffled every session. A question leaves your mistakes list once you answer
          it correctly in Review mode.
        </p>
      </form>
    </div>
  );
}
