// A tiny, dependency-free syntax highlighter. Each language is a list of
// [tokenClass, regex] rules, combined into one regex with one capture group
// per rule; the index of the group that matched tells us the token class.
// Rule regexes must only use non-capturing groups (?:...).

const JS_KEYWORDS =
  'const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|async|await|yield|try|catch|finally|throw|import|export|from|default|null|undefined|true|false|void|delete|static|get|set';
const TS_KEYWORDS =
  'type|interface|enum|keyof|as|satisfies|readonly|implements|declare|namespace|infer|is|asserts|unique|abstract|private|protected|public|override|never|unknown|any|string|number|boolean|bigint|symbol|object';

const COMMENT = ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//];
const STRING = ['string', /`(?:\\[\s\S]|[^\\`])*`|'(?:\\.|[^\\'\n])*'|"(?:\\.|[^\\"\n])*"/];
const JS_REST = [
  ['keyword', new RegExp(`\\b(?:${JS_KEYWORDS})\\b`)],
  ['number', /\b\d+(?:\.\d+)?n?\b/],
  ['function', /\b[A-Za-z_$][\w$]*(?=\s*\()/],
];
const JSX_TAG = ['tag', /<\/?[A-Za-z][\w.]*|\/>/];
const TS_TYPE = ['type', new RegExp(`\\b(?:${TS_KEYWORDS})\\b`)];

const RULES = {
  js: [COMMENT, STRING, ...JS_REST],
  jsx: [COMMENT, STRING, JSX_TAG, ...JS_REST],
  ts: [COMMENT, STRING, TS_TYPE, ...JS_REST],
  tsx: [COMMENT, STRING, JSX_TAG, TS_TYPE, ...JS_REST],
  css: [
    ['comment', /\/\*[\s\S]*?\*\//],
    ['string', /'(?:\\.|[^\\'\n])*'|"(?:\\.|[^\\"\n])*"/],
    ['keyword', /@[\w-]+|!important/],
    // a property name: follows `{` or `;` (plus whitespace) and precedes `:`
    ['property', /(?<=[{;]\s*)-{0,2}[a-zA-Z][\w-]*(?=\s*:)/],
    ['number', /-?(?:\d*\.)?\d+(?:px|r?em|vh|vw|vmin|vmax|ch|ex|ms|s|fr|deg|lh|dvh|svh)?%?/],
    ['selector', /[.#][A-Za-z_-][\w-]*|::?[a-z-]+/],
  ],
  html: [
    ['comment', /<!--[\s\S]*?-->/],
    ['tag', /<!doctype html>|<\/?[A-Za-z][\w-]*|\/?>/i],
    ['string', /'[^'\n]*'|"[^"\n]*"/],
    ['property', /\b[\w-]+(?==)/],
  ],
};

const COMPILED = Object.fromEntries(
  Object.entries(RULES).map(([lang, rules]) => [
    lang,
    {
      classes: rules.map(([cls]) => cls),
      regex: new RegExp(rules.map(([, re]) => `(${re.source})`).join('|'), 'g'),
    },
  ]),
);

const ALIASES = { javascript: 'js', typescript: 'ts' };

// Splits code into [{ text, cls? }] segments for rendering. In HTML, the contents
// of <script> and <style> elements are highlighted as JS and CSS.
export function highlight(code, lang) {
  if ((ALIASES[lang] ?? lang) !== 'html') return highlightAs(code, lang);
  const segments = [];
  const embedded = /(<script\b[^>]*>)([\s\S]*?)(?=<\/script>|$)|(<style\b[^>]*>)([\s\S]*?)(?=<\/style>|$)/gi;
  let last = 0;
  for (const m of code.matchAll(embedded)) {
    const openTag = m[1] ?? m[3];
    const body = m[2] ?? m[4];
    segments.push(...highlightAs(code.slice(last, m.index) + openTag, 'html'));
    segments.push(...highlightAs(body, m[1] ? 'js' : 'css'));
    last = m.index + m[0].length;
  }
  segments.push(...highlightAs(code.slice(last), 'html'));
  return segments;
}

function highlightAs(code, lang) {
  if (!code) return [];
  const compiled = COMPILED[ALIASES[lang] ?? lang];
  if (!compiled) return [{ text: code }];

  const segments = [];
  let last = 0;
  for (const match of code.matchAll(compiled.regex)) {
    if (match.index > last) segments.push({ text: code.slice(last, match.index) });
    const group = match.findIndex((g, i) => i > 0 && g !== undefined);
    segments.push({ text: match[0], cls: compiled.classes[group - 1] });
    last = match.index + match[0].length;
  }
  if (last < code.length) segments.push({ text: code.slice(last) });
  return segments;
}
