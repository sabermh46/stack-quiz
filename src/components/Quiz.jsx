import { useEffect, useRef, useState } from 'react';
import { LETTERS, STACK_LABELS } from '../lib/questions.js';
import CodeBlock from './CodeBlock.jsx';
import Feedback from './Feedback.jsx';
import RichText, { InlineText } from './RichText.jsx';

export default function Quiz({ questions, mode, onAnswer, onFinish, onQuit, shortcutsEnabled, onRunInPlayground }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const nextButtonRef = useRef(null);
  const headingRef = useRef(null);

  const question = questions[index];
  const answered = selected !== null;
  const isLast = index === questions.length - 1;
  const score = results.filter((r) => r.correct).length;

  function choose(optionId) {
    if (answered) return;
    const correct = optionId === question.answer;
    setSelected(optionId);
    setResults((r) => [...r, { id: question.id, selected: optionId, correct }]);
    onAnswer(question, correct);
  }

  function next() {
    if (!answered) return;
    if (isLast) {
      onFinish(results);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  // After answering, move focus to "Next" so Enter continues.
  useEffect(() => {
    if (answered) nextButtonRef.current?.focus({ preventScroll: true });
  }, [answered]);

  // On a new question, bring it into view and move focus to it for screen readers.
  useEffect(() => {
    if (index === 0) return;
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  // Keyboard shortcuts: 1–4 or A–D to answer, Enter / → for next.
  // No dependency array on purpose: the handler is re-subscribed after every
  // render, so it always sees the current question instead of a stale closure.
  useEffect(() => {
    function onKeyDown(e) {
      if (!shortcutsEnabled || e.ctrlKey || e.metaKey || e.altKey) return;
      // Never steal keys typed into a text field.
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      const key = e.key.toLowerCase();
      const n = '1234'.includes(key) ? Number(key) - 1 : 'abcd'.indexOf(key);
      if (key.length === 1 && n >= 0 && n < question.options.length) {
        choose(question.options[n].id);
      } else if (key === 'arrowright' || (key === 'enter' && e.target.tagName !== 'BUTTON')) {
        next();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function optionState(option) {
    if (!answered) return '';
    if (option.id === question.answer) return 'is-correct';
    if (option.id === selected) return 'is-wrong';
    return 'is-dim';
  }

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="badge">{STACK_LABELS[question.stack]}</span>
        <span className={`badge badge--${question.difficulty}`}>{question.difficulty}</span>
        <span className="quiz-topic">{question.topic}</span>
        {mode === 'review' && <span className="badge badge--review">Review</span>}
        <span className="quiz-count">
          {index + 1} / {questions.length} · {score} correct
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={results.length}
      >
        <div className="progress__bar" style={{ width: `${(results.length / questions.length) * 100}%` }} />
      </div>

      <article className="question" aria-labelledby="question-heading">
        <h2 id="question-heading" className="visually-hidden" tabIndex={-1} ref={headingRef}>
          Question {index + 1}
        </h2>
        <RichText text={question.question} className="question-text" />
        {question.snippets?.map((s, i) => (
          <CodeBlock key={i} code={s.code} lang={s.lang} label={s.label} />
        ))}

        <ul className="options">
          {question.options.map((option, i) => {
            const state = optionState(option);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className={`option ${state}`}
                  onClick={() => choose(option.id)}
                  disabled={answered}
                  aria-pressed={selected === option.id}
                >
                  <span className="option__letter">{LETTERS[i]}</span>
                  <span className="option__text">
                    <InlineText text={option.text} />
                  </span>
                  {state === 'is-correct' && (
                    <span className="option__mark" aria-label="correct answer">
                      ✓
                    </span>
                  )}
                  {state === 'is-wrong' && (
                    <span className="option__mark" aria-label="your answer, incorrect">
                      ✗
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {answered && <Feedback question={question} selected={selected} onRunInPlayground={onRunInPlayground} />}
      </article>

      <div className="quiz-nav">
        <button type="button" className="btn btn--ghost" onClick={() => onQuit(results)}>
          Quit
        </button>
        {shortcutsEnabled ? (
          <span className="kbd-hint">
            <kbd>1</kbd>–<kbd>4</kbd> answer · <kbd>Enter</kbd> next
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          ref={nextButtonRef}
          className="btn btn--primary"
          onClick={next}
          disabled={!answered}
        >
          {isLast ? 'See results' : 'Next'}
        </button>
      </div>
    </div>
  );
}
