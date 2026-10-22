// Verifies React behavior by actually running it.
// Compiles a .jsx/.tsx file with esbuild and runs it in Node with a jsdom `window`/`document`.
//
//   node scripts/run-jsx.mjs path/to/test.jsx
//
// Inside the file, import React normally and use `act` so effects and updates flush:
//
//   import { useState, useEffect, act } from 'react';
//   import { createRoot } from 'react-dom/client';
//   globalThis.IS_REACT_ACT_ENVIRONMENT = true;
//   const root = createRoot(document.getElementById('root'));
//   await act(() => root.render(<App />));
//   console.log(document.body.innerHTML);
import { transform } from 'esbuild';
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/run-jsx.mjs <file.jsx|file.tsx>');
  process.exit(2);
}

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'InputEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  if (!(key in globalThis) || key === 'window' || key === 'document') {
    Object.defineProperty(globalThis, key, { value: key === 'window' ? dom.window : dom.window[key], configurable: true, writable: true });
  }
}

const source = readFileSync(file, 'utf8');
const { code } = await transform(source, {
  loader: file.endsWith('.tsx') ? 'tsx' : 'jsx',
  jsx: 'automatic',
  format: 'esm',
});

// Write next to the project so `react` resolves from node_modules.
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(projectRoot, 'node_modules', '.run-jsx-'));
const out = join(tmp, 'entry.mjs');
writeFileSync(out, code);
try {
  await import(pathToFileURL(out).href);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
