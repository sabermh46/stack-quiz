# Skill Drills — tricky-concept quiz app

A local practice app for coding skill screenings (HTML, CSS, JavaScript, React, TypeScript).
The owner previously failed a CSS screening on inline image/text alignment, so the goal is
**mastering tricky concepts**, not trivia. Question accuracy matters more than anything else.

## Stack & commands

- React 19 + Vite 6, plain CSS (no UI or highlighting libraries). Keep it that way: the code
  itself is practice material, so prefer clear, idiomatic code over clever abstractions.
- `npm run dev` — dev server (http://localhost:5173)
- `npm run validate` — checks every question bank against the format below. **Run after every edit to `src/data/`.**
- `npm run build` — production build

## Layout

```
src/
  data/<stack>.json      question banks: html, css, javascript, react, typescript
  lib/questions.js       loads banks, filters, builds shuffled sessions
  lib/storage.js         localStorage progress (per-question stats, mistakes, session history)
  lib/stats.js           per-stack / per-difficulty summaries
  lib/highlight.js       tiny regex-based syntax highlighter (HTML also highlights <script>/<style> contents)
  lib/editing.js         pure editor commands: indent/outdent, Enter auto-indent, closer dedent, comment toggle
  components/CodeEditor  playground editor: transparent <textarea> over a highlighted <pre> (no libraries);
                         edits go through execCommand('insertText') so native undo/redo keeps working
  lib/theme.js           system / light / dark theme
  components/            Header, Home, Quiz, Feedback, Results, Stats, CodeBlock, RichText
  index.css, App.css     tokens (light-dark()) + component styles
scripts/validate-questions.mjs
```

Progress lives in localStorage under `outlier-quiz:progress:v1`. A question enters the mistakes list
when answered wrong and leaves it only when answered correctly **in Review mode**. If you change the
progress shape, bump the version and migrate or reset.

PWA: `vite-plugin-pwa` (config in `vite.config.js`) generates the manifest and a Workbox service
worker that precaches the whole build, so the app works offline. `registerType: 'prompt'` —
`components/UpdatePrompt.jsx` shows "Reload" when a new version is waiting (never auto-reloads mid-quiz).
Icons in `public/` (`pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png`, `apple-touch-icon.png`).
The service worker only runs in `npm run build && npm run preview` (or a deployed build), not in `npm run dev`.

Sharing via ngrok: `server.allowedHosts` / `preview.allowedHosts` in `vite.config.js` allow ngrok domains.
Run `npm run preview` then `ngrok http 4173` (or `npm run dev` + `ngrok http 5173`). The HTTPS ngrok URL
makes the PWA installable on phones.

Dark mode uses `color-scheme` + `light-dark()` tokens in `index.css`; `data-theme` on `<html>`
forces light/dark, otherwise the OS setting wins.

## Question format

Each `src/data/<stack>.json` is a top-level JSON array of questions:

```json
{
  "id": "css-012",
  "difficulty": "hard",
  "topic": "vertical-align: middle",
  "kind": "output",
  "question": "What color is the link? Supports `inline code` and **bold**.",
  "snippets": [
    { "lang": "html", "code": "<a class=\"x\">Hi</a>" },
    { "lang": "css", "code": ".x { color: red; }", "label": "styles.css" }
  ],
  "options": [
    { "id": "a", "text": "Red" },
    { "id": "b", "text": "Blue", "why": "Why this tempting answer is wrong." },
    { "id": "c", "text": "...", "why": "..." },
    { "id": "d", "text": "...", "why": "..." }
  ],
  "answer": "a",
  "explanation": "Why the answer is right. Blank lines = paragraphs, \"- \" lines = bullets, ```lang fences = code blocks.",
  "references": ["https://developer.mozilla.org/..."]
}
```

| Field | Rules |
| --- | --- |
| `id` | `<stack>-NNN`, unique, never reused or renumbered (progress is keyed by id). Next id = highest + 1. |
| `difficulty` | `medium` \| `hard` \| `expert`. Medium = a solid dev usually knows it; hard = common misconception or subtle edge case; expert = spec-level detail. |
| `kind` | `concept` \| `output` ("what does this print/render") \| `debug` ("why is this broken") \| `misconception` |
| `topic` | Short label shown in the quiz header. Reuse existing topic names where they fit. |
| `snippets` | Optional. `lang`: `html`, `css`, `js`, `jsx`, `ts`, `tsx`, `json`, `text`. Optional `label`. |
| `options` | Exactly 4, ids `a`–`d`. The correct option has **no** `why`; every wrong option **must** have a `why`. |
| `answer` | The correct option's id. Spread answers across a–d in the file (options are shuffled at runtime anyway). |
| `explanation` | Explains why the answer is right, including the mechanism and how to fix the issue where relevant. |
| `references` | Optional https links (MDN, specs, react.dev, typescriptlang.org). |
| `playground` | Optional `{ html?, css?, js?, jsModule? }`: a hands-on experiment loaded by "Run in playground" after answering (the question's exact case plus labeled variations showing the fix and the wrong options). Without it, the button loads the question's html/css/js snippets. Every label must be verified in Chrome. Bulk-add via `_staging/playground/*.json` (id → object) and `node scripts/merge-playground.mjs`. |

Text fields support the mini-markup in `RichText.jsx`: `` `code` ``, `**bold**`, blank-line paragraphs,
`- ` bullet lines, and fenced code blocks (in `explanation`/`why`/`question`).

## Question-writing rules

1. **Accuracy first.** Check every answer and explanation against official specs / MDN / react.dev /
   the TypeScript handbook. Run JS/TS code with Node or `tsc` when possible. If a question is ambiguous
   or browser-dependent, rewrite it or drop it.
2. **Exactly one defensible answer.** No distractor should be arguably correct under any reasonable reading.
   State assumptions in the question (e.g. "runs as an ES module", "`strict: true`", "not in StrictMode",
   "default UA styles").
3. **Plausible distractors.** Each wrong option should be a real misconception, and its `why` says
   specifically why it's tempting and why it's wrong.
4. **Options are shuffled.** Never write "All/None of the above", "Both A and B", or refer to options
   by letter anywhere (the validator rejects these).
5. **Original questions only.** Don't copy real screening questions or well-known quiz sites.
6. Focus on tricky concepts: edge cases, misconceptions, "what does this output", debugging scenarios.
   Avoid pure trivia (release dates, obscure API names).
7. Keep code snippets minimal (roughly under 20 lines) and realistic.
8. Target modern evergreen browsers, React 19, TypeScript 5.x, ES2023+.
9. Write explanations in plain, direct language; the reader is studying.

## Coverage the banks must keep

- **CSS**: inline vs inline-block vs block; `vertical-align` and the baseline; line-height inheritance
  (unitless vs `em`/`%`); the gap under images; flexbox alignment (incl. anonymous items, `min-width: auto`);
  grid alignment; specificity incl. `:is()`/`:where()`/`:not()`; stacking contexts and `z-index`;
  positioning (`sticky`, fixed inside `transform`); percentage units (padding %, height %); margin collapsing.
- **React**: rules of hooks; `useEffect` dependencies and cleanup; stale closures; re-render behavior;
  keys; state batching/updaters; controlled vs uncontrolled inputs.
- **JavaScript**: closures; event loop (micro/macrotasks); `this` binding; hoisting/TDZ; equality and
  coercion; async/await ordering.
- **HTML**: parser behavior, forms and buttons, boolean attributes, script loading, semantics/a11y.
- **TypeScript**: narrowing, literal widening, structural typing, conditional/mapped types, `unknown`/`any`/`never`,
  variance and function assignability.

## Verifying answers empirically

Don't trust reasoning alone. Run the code:

- **JavaScript**: `node file.mjs` (use `.mjs` when the question says "ES module").
- **TypeScript**: `npx tsc --noEmit --strict --target es2022 file.ts` (TypeScript is a devDependency).
- **React**: `node scripts/run-jsx.mjs file.jsx` compiles JSX with esbuild and runs it under jsdom.
  Use `act` from `react` and set `globalThis.IS_REACT_ACT_ENVIRONMENT = true` (see the header comment).
- **CSS / HTML**: `node scripts/chrome-eval.mjs page.html "<js expression>"` loads the page in headless
  Chrome/Edge and prints the expression's result, e.g. `getBoundingClientRect()` values or
  `getComputedStyle(...)`. Use it to check layout claims (gaps, alignment, containing blocks, stacking).

Put scratch test files outside `src/` (e.g. a temp dir), never in the repo.

## Adding questions

1. Append to the end of the right `src/data/<stack>.json` with the next free id.
2. Run `npm run validate` and fix every reported problem. `node scripts/validate-questions.mjs <file...>`
   validates individual files (one question object or an array).
3. Spot-check rendering in the app (`npm run dev`): code blocks, inline code, and long option text.

For bulk work, write batches to `src/data/_staging/<stack>/` (git-ignored, not loaded by the app),
have a separate reviewer check them, then move them in with
`node scripts/merge-staging.mjs <files...>` (appends to the bank, sorts by id, deletes the staging
file) and run `npm run validate`. Only merge batches that passed an independent review.
