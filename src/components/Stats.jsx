import { DIFFICULTIES, MIXED, STACKS, STACK_LABELS } from '../lib/questions.js';
import { stackStats } from '../lib/stats.js';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function pct(stats) {
  return stats.accuracy === null ? '—' : `${stats.accuracy}%`;
}

function StackCard({ label, stats }) {
  return (
    <article className="stat-card">
      <header className="stat-card__head">
        <h3>{label}</h3>
        <span className="stat-card__accuracy">{pct(stats)}</span>
      </header>
      <div className="meter" aria-hidden="true">
        <div className="meter__fill" style={{ width: `${(stats.seen / stats.total) * 100 || 0}%` }} />
      </div>
      <dl className="stat-card__grid">
        <div>
          <dt>Seen</dt>
          <dd>
            {stats.seen}/{stats.total}
          </dd>
        </div>
        <div>
          <dt>Last answer right</dt>
          <dd>{stats.mastered}</dd>
        </div>
        <div>
          <dt>To review</dt>
          <dd>{stats.mistakes}</dd>
        </div>
      </dl>
      <ul className="stat-card__difficulties">
        {DIFFICULTIES.map((d) => (
          <li key={d}>
            <span className={`badge badge--${d}`}>{d}</span>
            <span>
              {pct(stats.byDifficulty[d])}
              <small> · {stats.byDifficulty[d].seen}/{stats.byDifficulty[d].total} seen</small>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Stats({ progress, onClearMistakes, onReset, onBack }) {
  function confirmReset() {
    if (window.confirm('Delete all progress, mistakes, and session history?')) onReset();
  }

  return (
    <div className="stats">
      <div className="page-head">
        <h1>Your progress</h1>
        <button type="button" className="btn btn--small" onClick={onBack}>
          Back
        </button>
      </div>
      <p className="hint">Accuracy counts every attempt, including repeats.</p>

      <div className="stat-grid">
        {STACKS.map((s) => (
          <StackCard key={s.id} label={s.label} stats={stackStats(s.questions, progress)} />
        ))}
      </div>

      <section className="sessions">
        <h2>Recent sessions</h2>
        {progress.sessions.length === 0 ? (
          <p className="hint">No sessions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Stack</th>
                  <th scope="col">Difficulty</th>
                  <th scope="col">Mode</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                {progress.sessions.map((s) => (
                  <tr key={s.at}>
                    <td>{dateFormat.format(s.at)}</td>
                    <td>{s.stack === MIXED ? 'Mixed' : STACK_LABELS[s.stack]}</td>
                    <td className="capitalize">{s.difficulty}</td>
                    <td className="capitalize">{s.mode}</td>
                    <td>
                      {s.correct}/{s.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="danger-zone">
        <h2>Reset</h2>
        <div className="start-actions">
          <button
            type="button"
            className="btn"
            onClick={onClearMistakes}
            disabled={progress.mistakes.length === 0}
          >
            Clear mistakes list
          </button>
          <button type="button" className="btn btn--danger" onClick={confirmReset}>
            Reset all progress
          </button>
        </div>
      </section>
    </div>
  );
}
