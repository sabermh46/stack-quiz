// Adds playground experiments to questions.
//
//   node scripts/merge-playground.mjs src/data/_staging/playground/css-1.json [...]
//
// Each file maps question id -> { html?, css?, js?, jsModule? }. The object is stored as
// that question's `playground` field (replacing any existing one), then the staging file
// is deleted. Run `npm run validate` afterwards.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node scripts/merge-playground.mjs <file...>');
  process.exit(2);
}

const banks = new Map();
for (const file of files) {
  for (const [id, playground] of Object.entries(JSON.parse(readFileSync(file, 'utf8')))) {
    const stack = id.slice(0, id.lastIndexOf('-'));
    if (!banks.has(stack)) banks.set(stack, JSON.parse(readFileSync(join(DATA_DIR, `${stack}.json`), 'utf8')));
    const question = banks.get(stack).find((q) => q.id === id);
    if (!question) throw new Error(`${file}: no question ${id}`);
    question.playground = playground;
  }
}

for (const [stack, questions] of banks) {
  writeFileSync(join(DATA_DIR, `${stack}.json`), `${JSON.stringify(questions, null, 2)}\n`);
  console.log(`${stack}.json: ${questions.filter((q) => q.playground).length} questions with experiments`);
}
for (const file of files) rmSync(file);
