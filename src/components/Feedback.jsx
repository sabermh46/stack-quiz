import { playgroundCodeFor } from '../lib/playground.js';
import { LETTERS } from '../lib/questions.js';
import RichText, { InlineText } from './RichText.jsx';

export default function Feedback({ question, selected, onRunInPlayground }) {
  const playgroundCode = playgroundCodeFor(question);
  const isCorrect = selected === question.answer;
  const correctIndex = question.options.findIndex((o) => o.id === question.answer);
  const correctOption = question.options[correctIndex];
  const wrongOptions = question.options
    .map((option, i) => ({ option, letter: LETTERS[i] }))
    .filter(({ option }) => option.id !== question.answer);

  return (
    <section className="feedback" aria-live="polite">
      <p className={`verdict ${isCorrect ? 'verdict--ok' : 'verdict--bad'}`}>
        <span aria-hidden="true">{isCorrect ? '✓' : '✗'}</span>
        {isCorrect ? 'Correct' : 'Not quite'}
      </p>
      {!isCorrect && (
        <p className="correct-answer">
          Correct answer: <strong>{LETTERS[correctIndex]}.</strong> <InlineText text={correctOption.text} />
        </p>
      )}

      <h3>Why</h3>
      <RichText text={question.explanation} />
      {playgroundCode && onRunInPlayground && (
        <button type="button" className="btn btn--small run-in-pg" onClick={() => onRunInPlayground(playgroundCode)}>
          {question.playground ? 'Run with experiments in playground ▸' : 'Run in playground ▸'}
        </button>
      )}

      <h3>Why the other options are wrong</h3>
      <ul className="why-list">
        {wrongOptions.map(({ option, letter }) => (
          <li key={option.id} className={`why-item ${option.id === selected ? 'is-picked' : ''}`}>
            <span className="option__letter">{letter}</span>
            <div className="why-item__body">
              <p className="why-item__option">
                <InlineText text={option.text} />
                {option.id === selected && <span className="tag">your answer</span>}
              </p>
              <RichText text={option.why} className="why-item__why" />
            </div>
          </li>
        ))}
      </ul>

      {question.references?.length > 0 && (
        <>
          <h3>Learn more</h3>
          <ul className="refs">
            {question.references.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {url.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
