import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Home from './components/Home.jsx';
import Quiz from './components/Quiz.jsx';
import Results from './components/Results.jsx';
import Stats from './components/Stats.jsx';
import Playground from './components/Playground.jsx';
import Notebook from './components/Notebook.jsx';
import UpdatePrompt from './components/UpdatePrompt.jsx';
import { buildSession } from './lib/questions.js';
import { emptyProgress, loadProgress, recordAnswer, recordSession, saveProgress } from './lib/storage.js';
import { applyTheme, loadTheme } from './lib/theme.js';

export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [theme, setTheme] = useState(loadTheme);
  const [screen, setScreen] = useState({ name: 'home' });
  const [sessionCount, setSessionCount] = useState(0);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [playgroundRequest, setPlaygroundRequest] = useState(null);

  function runInPlayground(code) {
    setPlaygroundRequest({ code, nonce: Date.now() });
    setPlaygroundOpen(true);
  }

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // config: { stack, difficulty, count, mode: 'practice' | 'review', ids? }
  function startSession(config) {
    const questions = buildSession(config);
    if (questions.length === 0) return;
    setSessionCount((n) => n + 1);
    setScreen({ name: 'quiz', questions, config });
  }

  function handleAnswer(question, isCorrect) {
    setProgress((p) => recordAnswer(p, question, isCorrect, screen.config.mode));
  }

  function saveSession(results) {
    if (results.length === 0) return;
    const { stack, difficulty, mode } = screen.config;
    setProgress((p) =>
      recordSession(p, {
        at: Date.now(),
        stack,
        difficulty,
        mode,
        total: results.length,
        correct: results.filter((r) => r.correct).length,
      }),
    );
  }

  function finishSession(results) {
    saveSession(results);
    setScreen({ name: 'results', questions: screen.questions, results, config: screen.config });
  }

  function quitSession(results) {
    saveSession(results);
    setScreen({ name: 'home' });
  }

  function retryMissed(ids) {
    // Every missed question is in the mistakes list now, so retry in Review
    // mode: getting it right this time removes it from the list.
    startSession({ ...screen.config, ids, count: 0, mode: 'review' });
  }

  return (
    <div className="app">
      <Header
        theme={theme}
        onThemeChange={setTheme}
        onHome={() => setScreen({ name: 'home' })}
        onStats={() => setScreen({ name: 'stats' })}
        onNotebook={() => setScreen({ name: 'notebook' })}
        inQuiz={screen.name === 'quiz'}
      />
      <UpdatePrompt />
      {playgroundOpen ? (
        <Playground request={playgroundRequest} onClose={() => setPlaygroundOpen(false)} />
      ) : (
        <button type="button" className="pg-fab" onClick={() => setPlaygroundOpen(true)}>
          {'</>'} Playground
        </button>
      )}
      <main className={`main ${screen.name === 'notebook' ? 'main--wide' : ''}`}>
        {screen.name === 'notebook' && <Notebook />}
        {screen.name === 'home' && <Home progress={progress} onStart={startSession} />}
        {screen.name === 'quiz' && (
          <Quiz
            key={sessionCount}
            questions={screen.questions}
            mode={screen.config.mode}
            onAnswer={handleAnswer}
            shortcutsEnabled={!playgroundOpen}
            onRunInPlayground={runInPlayground}
            onFinish={finishSession}
            onQuit={quitSession}
          />
        )}
        {screen.name === 'results' && (
          <Results
            questions={screen.questions}
            results={screen.results}
            mode={screen.config.mode}
            onRetry={retryMissed}
            onHome={() => setScreen({ name: 'home' })}
          />
        )}
        {screen.name === 'stats' && (
          <Stats
            progress={progress}
            onClearMistakes={() => setProgress((p) => ({ ...p, mistakes: [] }))}
            onReset={() => setProgress(emptyProgress())}
            onBack={() => setScreen({ name: 'home' })}
          />
        )}
      </main>
    </div>
  );
}
