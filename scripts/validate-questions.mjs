// Validates every question bank in src/data against the format in CLAUDE.md.
// Usage: npm run validate
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const STACKS = ['html', 'css', 'javascript', 'react', 'typescript'];
const DIFFICULTIES = ['medium', 'hard', 'expert'];
const KINDS = ['concept', 'output', 'debug', 'misconception'];
const LANGS = ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'text'];
const OPTION_IDS = ['a', 'b', 'c', 'd'];
const KEYS = ['id', 'difficulty', 'topic', 'kind', 'question', 'snippets', 'options', 'answer', 'explanation', 'references', 'playground'];
const PLAYGROUND_KEYS = ['html', 'css', 'js', 'jsModule'];

// Options are shuffled, so nothing may depend on option position or letter.
const POSITIONAL_OPTION = /\b(all|none|both|neither) of the above\b|\b(both|either|neither) [A-D] (and|or|nor) [A-D]\b/i;
const LETTER_REFERENCE = /\b(option|answer|choice)s? \(?[A-D]\)?(?![\w-])/;

const errors = [];
const seenIds = new Set();
const seenQuestions = new Map();
const isText = (v) => typeof v === 'string' && v.trim().length > 0;

function check(stack, q, index) {
  const where = `${stack}.json [${index}] ${q?.id ?? '(no id)'}`;
  const fail = (msg) => errors.push(`${where}: ${msg}`);

  if (!q || typeof q !== 'object') return fail('not an object');
  for (const key of Object.keys(q)) if (!KEYS.includes(key)) fail(`unknown key "${key}"`);

  if (!new RegExp(`^${stack}-\\d{3}$`).test(q.id ?? '')) fail(`id must look like "${stack}-001"`);
  if (seenIds.has(q.id)) fail('duplicate id');
  seenIds.add(q.id);

  if (!DIFFICULTIES.includes(q.difficulty)) fail(`difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  if (!KINDS.includes(q.kind)) fail(`kind must be one of ${KINDS.join(', ')}`);
  for (const key of ['topic', 'question', 'explanation']) if (!isText(q[key])) fail(`"${key}" must be a non-empty string`);

  if (isText(q.question)) {
    const normalized = q.question.toLowerCase().replace(/\W+/g, ' ').trim();
    const sameText = seenQuestions.get(normalized);
    const sameCode = sameText && JSON.stringify(sameText.snippets) === JSON.stringify(q.snippets);
    if (sameCode) fail(`same question and snippets as ${sameText.id}`);
    else seenQuestions.set(normalized, q);
  }

  if (q.snippets !== undefined) {
    if (!Array.isArray(q.snippets) || q.snippets.length === 0) fail('"snippets" must be a non-empty array when present');
    else
      q.snippets.forEach((s, i) => {
        if (!LANGS.includes(s?.lang)) fail(`snippets[${i}].lang must be one of ${LANGS.join(', ')}`);
        if (!isText(s?.code)) fail(`snippets[${i}].code must be a non-empty string`);
        if (s?.label !== undefined && !isText(s.label)) fail(`snippets[${i}].label must be a non-empty string`);
      });
  }

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    fail('must have exactly 4 options');
  } else {
    const ids = q.options.map((o) => o?.id);
    if ([...ids].sort().join() !== OPTION_IDS.join()) fail('option ids must be exactly a, b, c, d');
    const texts = new Set();
    q.options.forEach((o) => {
      if (!isText(o?.text)) return fail(`option ${o?.id}: missing text`);
      if (texts.has(o.text)) fail(`option ${o.id}: duplicate text`);
      texts.add(o.text);
      if (POSITIONAL_OPTION.test(o.text)) fail(`option ${o.id}: positional wording ("all of the above", "both A and B")`);
      if (o.id === q.answer) {
        if (o.why !== undefined) fail(`option ${o.id} is the answer, so it must not have "why"`);
      } else if (!isText(o.why)) {
        fail(`option ${o.id}: wrong options need a non-empty "why"`);
      } else if (LETTER_REFERENCE.test(o.why)) {
        fail(`option ${o.id}: "why" refers to an option by letter (options are shuffled)`);
      }
      for (const key of Object.keys(o)) if (!['id', 'text', 'why'].includes(key)) fail(`option ${o.id}: unknown key "${key}"`);
    });
  }

  if (!OPTION_IDS.includes(q.answer)) fail('"answer" must be one of a, b, c, d');
  if (isText(q.explanation) && LETTER_REFERENCE.test(q.explanation)) {
    fail('explanation refers to an option by letter (options are shuffled)');
  }

  if (q.playground !== undefined) {
    const pg = q.playground;
    if (!pg || typeof pg !== 'object' || Array.isArray(pg)) {
      fail('"playground" must be an object');
    } else {
      for (const key of Object.keys(pg)) if (!PLAYGROUND_KEYS.includes(key)) fail(`playground: unknown key "${key}"`);
      for (const key of ['html', 'css', 'js']) {
        if (pg[key] !== undefined && typeof pg[key] !== 'string') fail(`playground.${key} must be a string`);
      }
      if (pg.jsModule !== undefined && typeof pg.jsModule !== 'boolean') fail('playground.jsModule must be a boolean');
      if (!isText(pg.html) && !isText(pg.css) && !isText(pg.js)) fail('playground needs html, css or js code');
    }
  }

  if (q.references !== undefined) {
    if (!Array.isArray(q.references)) fail('"references" must be an array');
    else q.references.forEach((r) => typeof r === 'string' && r.startsWith('https://') || fail(`bad reference URL: ${r}`));
  }
}

// With file arguments, validate just those files (each holding one question
// object or an array of them); the stack comes from each id's prefix.
const files = process.argv.slice(2);
if (files.length) {
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(file, 'utf8'));
    } catch (err) {
      errors.push(`${file}: ${err.message}`);
      continue;
    }
    for (const [i, q] of (Array.isArray(data) ? data : [data]).entries()) {
      const stack = STACKS.find((s) => q?.id?.startsWith(`${s}-`)) ?? '(unknown stack)';
      check(stack, q, i);
    }
  }
  if (errors.length) {
    console.error(`${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`${files.length} file(s) valid.`);
  process.exit(0);
}

const summary = [];
for (const stack of STACKS) {
  let questions;
  try {
    questions = JSON.parse(readFileSync(join(DATA_DIR, `${stack}.json`), 'utf8'));
  } catch (err) {
    errors.push(`${stack}.json: ${err.message}`);
    continue;
  }
  if (!Array.isArray(questions)) {
    errors.push(`${stack}.json: top level must be an array`);
    continue;
  }
  questions.forEach((q, i) => check(stack, q, i));

  const count = (key, values) => values.map((v) => `${v} ${questions.filter((q) => q[key] === v).length}`).join(', ');
  summary.push(
    `${stack.padEnd(11)} ${String(questions.length).padStart(3)} questions | ${count('difficulty', DIFFICULTIES)} | answers ${count('answer', OPTION_IDS)}`,
  );
}

console.log(summary.join('\n'));
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('\nAll question banks are valid.');
