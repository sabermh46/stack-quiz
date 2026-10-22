import RichText, { InlineText } from './RichText.jsx';
import { STACK_LABELS } from '../lib/questions.js';

export default function Results({ questions, results, mode, onRetry, onHome }) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const correct = results.filter((r) => r.correct).length;
  const percent = Math.round((correct / results.length) * 100);
  const missed = results.filter((r) => !r.correct);

  return (
    <div className="results">
      <section className="panel results__summary">
        <p className="results__label">{mode === 'review' ? 'Review session' : 'Session complete'}</p>
        <p className="results__score">
          {correct} <span>/ {results.length}</span>
        </p>
        <div className="meter" aria-hidden="true">
          <div className="meter__fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="results__percent">{percent}% correct</p>
        <div className="start-actions">
          {missed.length > 0 && (
            <button
              type="button"
              className="btn btn--primary btn--large"
              onClick={() => onRetry(missed.map((m) => m.id))}
            >
              Retry missed · {missed.length}
            </button>
          )}
          <button type="button" className="btn btn--large" onClick={onHome}>
            New session
          </button>
        </div>
      </section>

      {missed.length > 0 && (
        <section className="missed">
          <h2>What you missed</h2>
          {missed.map((r) => {
            const q = byId.get(r.id);
            const picked = q.options.find((o) => o.id === r.selected);
            const answer = q.options.find((o) => o.id === q.answer);
            return (
              <details key={r.id} className="missed-item">
                <summary>
                  <span className="badge">{STACK_LABELS[q.stack]}</span>
                  <span className="missed-item__topic">{q.topic}</span>
                </summary>
                <RichText text={q.question} />
                <p className="missed-item__answer is-wrong">
                  Your answer: <InlineText text={picked.text} />
                </p>
                <p className="missed-item__answer is-correct">
                  Correct: <InlineText text={answer.text} />
                </p>
                <RichText text={q.explanation} />
              </details>
            );
          })}
        </section>
      )}
    </div>
  );
}
