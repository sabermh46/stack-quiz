// Turns a question into playground code. A question's optional `playground`
// field (a richer demo with variations) wins; otherwise its runnable snippets
// are used as-is.
const PANES = { html: 'html', css: 'css', js: 'js' };
export const PLAYGROUND_STACKS = ['html', 'css', 'javascript'];

export function playgroundCodeFor(question) {
  if (!PLAYGROUND_STACKS.includes(question.stack)) return null;
  const jsModule = /\bES module\b/i.test(question.question);

  if (question.playground) {
    return { html: '', css: '', js: '', jsModule, ...question.playground };
  }

  const code = { html: '', css: '', js: '', jsModule };
  for (const snippet of question.snippets ?? []) {
    const pane = PANES[snippet.lang];
    if (pane) code[pane] += (code[pane] ? '\n\n' : '') + snippet.code;
  }
  return code.html || code.css || code.js ? code : null;
}
