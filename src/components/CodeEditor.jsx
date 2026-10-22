import { useMemo, useRef, useState } from 'react';
import { closer, indentLines, newline, tab, toggleComment } from '../lib/editing.js';
import { highlight } from '../lib/highlight.js';

// A lightweight code editor: a transparent <textarea> on top of a highlighted <pre>
// with identical font metrics. Typing, selection, IME, clipboard and undo stay native.
// Edits are applied with execCommand('insertText') so they land in the undo stack.
export default function CodeEditor({ value, onChange, lang, onRun, label }) {
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const tabEscapes = useRef(false);
  const [caretLine, setCaretLine] = useState(0);

  const segments = useMemo(() => highlight(value, lang), [value, lang]);
  const lineCount = useMemo(() => value.split('\n').length, [value]);

  function syncCaret() {
    const el = inputRef.current;
    const line = el.value.slice(0, el.selectionStart).split('\n').length - 1;
    setCaretLine(line);

    // The textarea is as tall as its content, so the outer box does the scrolling:
    // keep the caret's line in view.
    const box = scrollRef.current;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const pad = parseFloat(getComputedStyle(el).paddingTop);
    const top = pad + line * lineHeight;
    if (top < box.scrollTop) box.scrollTop = top - pad;
    else if (top + lineHeight > box.scrollTop + box.clientHeight) box.scrollTop = top + lineHeight + pad - box.clientHeight;
  }

  function apply(edit) {
    if (!edit) return false;
    const el = inputRef.current;
    el.setSelectionRange(edit.start, edit.end);
    const ok = edit.text
      ? document.execCommand('insertText', false, edit.text)
      : document.execCommand('delete', false);
    if (!ok) {
      // Fallback without undo support; dispatching input still updates React state.
      el.setRangeText(edit.text, edit.start, edit.end, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    el.setSelectionRange(edit.selStart, edit.selEnd);
    syncCaret();
    return true;
  }

  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    const el = e.currentTarget;
    const state = { value: el.value, selStart: el.selectionStart, selEnd: el.selectionEnd };

    // Escape, then Tab: move focus out of the editor instead of indenting (keyboard users).
    if (e.key === 'Escape') {
      tabEscapes.current = true;
      return;
    }
    const escaping = tabEscapes.current;
    tabEscapes.current = false;

    let edit = null;
    if (mod && e.key === 'Enter') {
      e.preventDefault();
      onRun?.();
      return;
    } else if (mod && e.key === '/') {
      edit = toggleComment(state, lang);
      e.preventDefault();
    } else if (e.key === 'Tab' && !mod && !e.altKey && !escaping) {
      edit = e.shiftKey ? indentLines(state, -1) : tab(state);
      e.preventDefault(); // even when there's nothing to outdent, Tab stays in the editor
    } else if (e.key === 'Enter' && !mod && !e.altKey && !e.shiftKey && !e.nativeEvent.isComposing) {
      edit = newline(state, lang);
    } else if ((e.key === '}' || e.key === ']' || e.key === ')') && !mod) {
      edit = closer(state, e.key);
    }
    if (edit) {
      e.preventDefault();
      apply(edit);
    }
  }

  return (
    <div className="editor" style={{ '--active-line': caretLine }}>
      <div className="editor__scroll" ref={scrollRef}>
        <div className="editor__gutter" aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i} className={i === caretLine ? 'is-active' : undefined}>
              {i + 1}
            </span>
          ))}
        </div>
        <div className="editor__code">
          <div className="editor__active-line" aria-hidden="true" />
          <pre className="editor__highlight" aria-hidden="true">
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
              {/* keeps a trailing empty line as tall as the textarea's */}
              {'\n'}
            </code>
          </pre>
          <textarea
            ref={inputRef}
            className="editor__input"
            aria-label={label}
            title="Tab indents. Press Esc then Tab to move focus out of the editor."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onSelect={syncCaret}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
          />
        </div>
      </div>
    </div>
  );
}
