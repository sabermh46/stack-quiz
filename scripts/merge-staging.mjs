// Moves reviewed staging batches into the question banks.
//
//   node scripts/merge-staging.mjs src/data/_staging/css/batch-01.json [...more files]
//
// Each file holds one question object or an array of them. Questions are added to
// src/data/<stack>.json (stack taken from the id prefix), the bank is re-sorted by id,
// and the merged staging file is deleted. Run `npm run validate` afterwards.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const STACKS = ['html', 'css', 'javascript', 'react', 'typescript'];

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/merge-staging.mjs <staging-file...>');
  process.exit(2);
}

const banks = new Map();
const bank = (stack) => {
  if (!banks.has(stack)) banks.set(stack, JSON.parse(readFileSync(join(DATA_DIR, `${stack}.json`), 'utf8')));
  return banks.get(stack);
};

for (const file of files) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const q of Array.isArray(data) ? data : [data]) {
    const stack = STACKS.find((s) => q.id?.startsWith(`${s}-`));
    if (!stack) throw new Error(`${file}: can't tell the stack of id "${q.id}"`);
    const questions = bank(stack);
    if (questions.some((existing) => existing.id === q.id)) throw new Error(`${file}: ${q.id} already exists in ${stack}.json`);
    questions.push(q);
  }
}

const idNumber = (q) => Number(q.id.split('-').at(-1));
for (const [stack, questions] of banks) {
  questions.sort((a, b) => idNumber(a) - idNumber(b));
  writeFileSync(join(DATA_DIR, `${stack}.json`), `${JSON.stringify(questions, null, 2)}\n`);
  console.log(`${stack}.json: ${questions.length} questions`);
}
for (const file of files) rmSync(file);
