import { useState } from 'react';
import { NOTEBOOK } from '../data/notebook.js';
import { readJSON, writeJSON } from '../lib/storage.js';
import CodeBlock from './CodeBlock.jsx';
import RichText, { InlineText } from './RichText.jsx';

const PAGE_KEY = 'outlier-quiz:notebook-page';
const ALL_PAGES = NOTEBOOK.flatMap((s) => s.pages.map((p) => ({ ...p, stackLabel: s.label })));

function Table({ caption, columns, rows }) {
  return (
    <div className="table-wrap note-table">
      <table>
        {caption && (
          <caption>
            <InlineText text={caption} />
          </caption>
        )}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DEMO_BASE =
  'body{margin:12px;font:15px/1.5 system-ui,sans-serif;color:#1f2328;background:#fff}' +
  '.img{background:#c7d2fe;color:#3730a3;display:grid;place-items:center;font:600 13px system-ui}';

function Demo({ caption, html, css, height = 220 }) {
  const doc = `<!doctype html><style>${DEMO_BASE}${css}</style>${html}`;
  return (
    <figure className="note-demo">
      <figcaption>
        <InlineText text={caption} />
      </figcaption>
      <iframe title={caption} srcDoc={doc} sandbox="" style={{ height }} />
      <details>
        <summary>Show code</summary>
        <CodeBlock code={html} lang="html" />
        <CodeBlock code={css} lang="css" />
      </details>
    </figure>
  );
}

export default function Notebook() {
  const [pageId, setPageId] = useState(() => {
    const saved = readJSON(PAGE_KEY, null);
    return ALL_PAGES.some((p) => p.id === saved) ? saved : ALL_PAGES[0].id;
  });
  const page = ALL_PAGES.find((p) => p.id === pageId);

  function open(id) {
    setPageId(id);
    writeJSON(PAGE_KEY, id);
    window.scrollTo(0, 0);
  }

  return (
    <div className="notebook">
      <nav className="note-nav" aria-label="Notebook pages">
        {NOTEBOOK.map((s) => (
          <div key={s.stack} className="note-nav__group">
            <p className="note-nav__stack">{s.label}</p>
            {s.pages.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`note-nav__link ${p.id === pageId ? 'is-active' : ''}`}
                aria-current={p.id === pageId ? 'page' : undefined}
                onClick={() => open(p.id)}
              >
                {p.title}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <article className="note-page">
        <p className="note-page__stack">{page.stackLabel}</p>
        <h1>{page.title}</h1>
        {page.blocks.map((block, i) =>
          block.type === 'table' ? (
            <Table key={i} {...block} />
          ) : block.type === 'demo' ? (
            <Demo key={i} {...block} />
          ) : (
            <RichText key={i} text={block.text} />
          ),
        )}
      </article>
    </div>
  );
}
