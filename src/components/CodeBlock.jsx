import { useMemo } from 'react';
import { highlight } from '../lib/highlight.js';

const LANG_LABELS = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  json: 'JSON',
  text: 'Output',
};

export default function CodeBlock({ code, lang, label }) {
  const segments = useMemo(() => highlight(code, lang), [code, lang]);
  const caption = label ?? LANG_LABELS[lang] ?? lang;

  return (
    <figure className="code-block">
      {caption && <figcaption>{caption}</figcaption>}
      {/* tabIndex lets keyboard users scroll long lines horizontally */}
      <pre tabIndex={0}>
        <code>
          {segments.map((s, i) =>
            s.cls ? (
              <span key={i} className={`tok-${s.cls}`}>
                {s.text}
              </span>
            ) : (
              s.text
            ),
          )}
        </code>
      </pre>
    </figure>
  );
}
