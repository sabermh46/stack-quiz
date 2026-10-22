import { useEffect, useRef, useState } from 'react';
import { readJSON, writeJSON } from '../lib/storage.js';
import CodeEditor from './CodeEditor.jsx';

const STORAGE_KEY = 'outlier-quiz:playground';
const OUTSIDE_KEY = 'outlier-quiz:playground-close-outside';
const TABS = ['html', 'css', 'js'];
const DEFAULT_CODE = {
  html: '<p class="row">\n  <img src="https://placehold.co/24" alt=""> Icon and text\n</p>',
  css: '.row {\n  border: 1px solid;\n}\n\nimg {\n  vertical-align: middle;\n}',
  js: "console.log('Hello from the playground', { ok: true });",
};

// Injected before user code: forwards console calls and errors to the parent page.
const CONSOLE_BRIDGE = `<script>
(() => {
  const fmt = (v) => {
    if (v instanceof Error) return v.stack || String(v);
    if (typeof v === 'string') return v;
    // Primitives print like the browser console (JSON would turn NaN into null, -0 into 0).
    if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
    if (typeof v === 'bigint') return v + 'n';
    if (v === undefined || typeof v === 'symbol' || typeof v === 'function') return String(v);
    const keep = (k, x) =>
      typeof x === 'number' && !Number.isFinite(x) ? String(x)
      : typeof x === 'bigint' ? x + 'n'
      : x === undefined ? 'undefined'
      : x;
    try { return JSON.stringify(v, keep, 2) ?? String(v); } catch { return String(v); }
  };
  const send = (type, args) => parent.postMessage({ playground: true, type, text: args.map(fmt).join(' ') }, '*');
  for (const type of ['log', 'info', 'warn', 'error', 'debug']) {
    const original = console[type];
    console[type] = (...args) => { send(type, args); original.apply(console, args); };
  }
  addEventListener('error', (e) => send('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]));
  addEventListener('unhandledrejection', (e) => send('error', ['Uncaught (in promise) ' + fmt(e.reason)]));
})();
<\/script>`;

function firstFilledTab(code) {
  return TABS.find((t) => code?.[t]) ?? 'html';
}

function buildDocument({ html, css, js, jsModule }) {
  const scriptTag = jsModule ? '<script type="module">' : '<script>';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style>${CONSOLE_BRIDGE}</head><body>${html}${scriptTag}${js}<\/script></body></html>`;
}

// `request` = { code, nonce }: code sent from a quiz question to load.
export default function Playground({ onClose, request }) {
  const [code, setCode] = useState(() => request?.code ?? { ...DEFAULT_CODE, ...readJSON(STORAGE_KEY, {}) });
  const [tab, setTab] = useState(() => firstFilledTab(request?.code));
  const [autoRun, setAutoRun] = useState(true);
  const [srcDoc, setSrcDoc] = useState(() => buildDocument(code));
  const [logs, setLogs] = useState([]);
  const frameRef = useRef(null);
  const rootRef = useRef(null);
  const [closeOnOutside, setCloseOnOutside] = useState(() => readJSON(OUTSIDE_KEY, false));

  // "Click outside to minimize": any press outside the window closes it.
  // (Clicks inside the preview iframe never reach this document, so they don't count.)
  useEffect(() => {
    writeJSON(OUTSIDE_KEY, closeOnOutside);
    if (!closeOnOutside) return;
    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [closeOnOutside, onClose]);

  function run() {
    setLogs([]);
    // A new string each time forces the iframe to reload even if the code is unchanged.
    setSrcDoc(buildDocument(code) + `<!-- ${Date.now()} -->`);
  }

  // Load code sent from a question while the playground is already open.
  const lastNonce = useRef(request?.nonce);
  useEffect(() => {
    if (!request || request.nonce === lastNonce.current) return;
    lastNonce.current = request.nonce;
    setCode(request.code);
    setTab(firstFilledTab(request.code));
  }, [request]);

  useEffect(() => {
    writeJSON(STORAGE_KEY, code);
    if (!autoRun) return;
    const id = setTimeout(run, 700);
    return () => clearTimeout(id);
  }, [code, autoRun]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onMessage(e) {
      if (e.source !== frameRef.current?.contentWindow || !e.data?.playground) return;
      setLogs((l) => [...l, { type: e.data.type, text: e.data.text }]);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div className="playground" role="dialog" aria-label="Code playground" ref={rootRef}>
      <div className="pg-toolbar">
        <strong className="pg-title">Playground</strong>
        <div className="pg-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`pg-tab ${tab === t ? 'is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="pg-auto">
          <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} /> Auto-run
        </label>
        <label className="pg-auto">
          <input type="checkbox" checked={closeOnOutside} onChange={(e) => setCloseOnOutside(e.target.checked)} />{' '}
          Click outside to minimize
        </label>
        <button type="button" className="btn btn--small" onClick={() => setCode(DEFAULT_CODE)}>
          Reset
        </button>
        <button type="button" className="btn btn--primary btn--small" onClick={run} title="Ctrl+Enter">
          Run ▸
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={onClose} aria-label="Close playground">
          ✕
        </button>
      </div>

      <div className="pg-grid">
        {/* All three editors stay mounted (inactive ones hidden) so each keeps its own undo history. */}
        <div className="pg-editors">
          {TABS.map((t) => (
            <div key={t} className="pg-pane" hidden={tab !== t}>
              <CodeEditor
                lang={t}
                label={`${t.toUpperCase()} code`}
                value={code[t]}
                onChange={(next) => setCode((c) => ({ ...c, [t]: next }))}
                onRun={run}
              />
            </div>
          ))}
        </div>
        <div className="pg-output">
          <iframe ref={frameRef} className="pg-preview" title="Preview" sandbox="allow-scripts allow-modals allow-forms" srcDoc={srcDoc} />
          <section className="pg-console" aria-label="Console">
            <header className="pg-console__head">
              <span>Console</span>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setLogs([])}>
                Clear
              </button>
            </header>
            <ol className="pg-console__list">
              {logs.map((entry, i) => (
                <li key={i} className={`pg-log pg-log--${entry.type}`}>
                  {entry.text}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
