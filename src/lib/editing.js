// Pure text-editing helpers for the code editor. Each takes the textarea state
// { value, selStart, selEnd } and returns an edit { start, end, text, selStart, selEnd }
// (replace value[start..end] with text, then set the selection), or null for "do nothing".

export const INDENT = '  ';
const OPENERS = { '{': '}', '[': ']', '(': ')' };
const VOID_TAGS = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
const COMMENTS = { js: ['// ', ''], css: ['/* ', ' */'], html: ['<!-- ', ' -->'] };

const lineStart = (v, pos) => v.lastIndexOf('\n', pos - 1) + 1;
const lineEnd = (v, pos) => {
  const i = v.indexOf('\n', pos);
  return i === -1 ? v.length : i;
};
const indentOf = (line) => line.match(/^[ \t]*/)[0];

// Whole lines covered by the selection. A selection ending right after a newline
// doesn't include the next line (same as VS Code).
function selectedLines(v, s, e) {
  const from = lineStart(v, s);
  const to = lineEnd(v, e > s && v[e - 1] === '\n' ? e - 1 : e);
  return { from, to, lines: v.slice(from, to).split('\n') };
}

const caretAt = (start, end, text, caret) => ({ start, end, text, selStart: caret, selEnd: caret });

export function indentLines({ value: v, selStart: s, selEnd: e }, direction) {
  const { from, to, lines } = selectedLines(v, s, e);
  let firstDelta = 0;
  let totalDelta = 0;
  const out = lines.map((line, i) => {
    let next = line;
    if (direction > 0) {
      if (line.trim() || lines.length === 1) next = INDENT + line;
    } else {
      const remove = line.startsWith(INDENT) ? INDENT.length : /^[ \t]/.test(line) ? 1 : 0;
      next = line.slice(remove);
    }
    const delta = next.length - line.length;
    if (i === 0) firstDelta = delta;
    totalDelta += delta;
    return next;
  });
  const text = out.join('\n');
  if (text === v.slice(from, to)) return null;
  return { start: from, end: to, text, selStart: Math.max(from, s + firstDelta), selEnd: Math.max(from, e + totalDelta) };
}

export function tab(state) {
  const { value: v, selStart: s, selEnd: e } = state;
  if (s !== e && v.slice(s, e).includes('\n')) return indentLines(state, 1);
  return caretAt(s, e, INDENT, s + INDENT.length);
}

// Enter: keep the current indentation; indent one more level after an opener
// ({ [ ( or an opening HTML tag), and split "{|}" / "<p>|</p>" onto three lines.
export function newline({ value: v, selStart: s, selEnd: e }, lang) {
  const before = v.slice(lineStart(v, s), s);
  const after = v.slice(e, lineEnd(v, e));
  const indent = indentOf(before);
  const last = before.trimEnd().slice(-1);
  const next = after.trimStart();

  let opens = last in OPENERS;
  let closesRightAway = opens && next[0] === OPENERS[last];
  if (lang === 'html' && !opens) {
    const tag = before.match(/<([a-zA-Z][\w-]*)\b[^<>]*>\s*$/);
    if (tag && !VOID_TAGS.test(tag[1]) && !/\/>\s*$/.test(before)) {
      opens = true;
      closesRightAway = next.startsWith('</');
    }
  }

  if (!opens) return caretAt(s, e, '\n' + indent, s + 1 + indent.length);
  const inner = indent + INDENT;
  if (closesRightAway) {
    const gap = after.length - next.length; // spaces between the caret and the closer
    return caretAt(s, e + gap, `\n${inner}\n${indent}`, s + 1 + inner.length);
  }
  return caretAt(s, e, '\n' + inner, s + 1 + inner.length);
}

// Typing } ] ) on a line that only has indentation removes one indent level first.
export function closer({ value: v, selStart: s, selEnd: e }, char) {
  if (s !== e) return null;
  const before = v.slice(lineStart(v, s), s);
  if (!/^[ \t]+$/.test(before) || before.length < INDENT.length) return null;
  return caretAt(s - INDENT.length, s, char, s - INDENT.length + 1);
}

// Ctrl+/ : comment or uncomment every selected line, with the language's syntax.
export function toggleComment({ value: v, selStart: s, selEnd: e }, lang) {
  const [open, close] = COMMENTS[lang] ?? COMMENTS.js;
  const openMark = open.trim();
  const closeMark = close.trim();
  const { from, to, lines } = selectedLines(v, s, e);
  const filled = lines.filter((l) => l.trim());
  const isCommented = (l) => {
    const t = l.trim();
    return t.startsWith(openMark) && t.endsWith(closeMark) && t.length >= openMark.length + closeMark.length;
  };
  const uncomment = filled.length > 0 && filled.every(isCommented);

  const out = lines.map((line) => {
    if (!line.trim()) return line;
    const indent = indentOf(line);
    let body = line.slice(indent.length).trimEnd();
    if (!uncomment) return indent + open + body + close;
    body = body.slice(openMark.length);
    if (body.startsWith(' ')) body = body.slice(1);
    if (closeMark) {
      body = body.slice(0, body.length - closeMark.length);
      if (body.endsWith(' ')) body = body.slice(0, -1);
    }
    return indent + body;
  });
  const text = out.join('\n');
  if (s === e) {
    const caret = Math.max(from, s + text.length - (to - from));
    return caretAt(from, to, text, caret);
  }
  return { start: from, end: to, text, selStart: from, selEnd: from + text.length };
}
