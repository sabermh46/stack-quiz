// Verifies CSS/HTML behavior in a real browser.
// Loads an HTML file in headless Chrome, evaluates a JS expression, prints the result as JSON.
//
//   node scripts/chrome-eval.mjs page.html "getComputedStyle(document.querySelector('a')).color"
//   node scripts/chrome-eval.mjs page.html "document.querySelector('img').getBoundingClientRect().bottom"
//
// Optional env: CHROME_PATH, VIEWPORT=1000x800
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [file, expression] = process.argv.slice(2);
if (!file || !expression) {
  console.error('usage: node scripts/chrome-eval.mjs <file.html> "<js expression>"');
  process.exit(2);
}

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome/Edge found; set CHROME_PATH.');
  process.exit(2);
}

const [width, height] = (process.env.VIEWPORT ?? '1000x800').split('x').map(Number);
const profile = mkdtempSync(join(tmpdir(), 'chrome-eval-'));
const port = 9400 + Math.floor(Math.random() * 500);
const proc = spawn(
  chrome,
  ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let exitCode = 0;
try {
  let wsUrl;
  for (let i = 0; i < 75 && !wsUrl; i++) {
    await sleep(200);
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      wsUrl = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl;
    } catch {
      // not up yet
    }
  }
  if (!wsUrl) throw new Error('Chrome did not start');

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    pending.get(msg.id)?.(msg);
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const id = ++nextId;
      pending.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(resolve(file)).href });
  await sleep(800);
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  const { result, exceptionDetails } = res.result;
  if (exceptionDetails) {
    console.error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    exitCode = 1;
  } else {
    console.log(JSON.stringify(result.value, null, 2));
  }
  ws.close();
} catch (err) {
  console.error(err.message);
  exitCode = 1;
} finally {
  proc.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // Chrome may still hold files briefly
  }
}
process.exit(exitCode);
