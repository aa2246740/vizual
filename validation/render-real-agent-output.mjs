import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const value = process.argv[i + 1];
  if (value && !value.startsWith('--')) {
    args.set(key, value);
    i += 1;
  } else {
    args.set(key, 'true');
  }
}

const chromePath = args.get('chrome') || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const baseUrl = args.get('base') || 'http://127.0.0.1:8793';
const inputFile = args.get('input') || '/tmp/vizual-real-agent-smoke-output.json';
const outDir = args.get('out') || '/tmp/vizual-core-validation';
const runId = args.get('run') || new Date().toISOString().replace(/[:.]/g, '-');
const port = Number(args.get('port') || 9365);
const userDataDir = path.join(os.tmpdir(), `vizual-real-agent-render-${runId}`);

await fs.mkdir(outDir, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  return response.json();
}

class CdpPage {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.opened = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', event => {
      const payload = JSON.parse(event.data);
      if (!payload.id) return;
      const pending = this.pending.get(payload.id);
      if (!pending) return;
      this.pending.delete(payload.id);
      if (payload.error) pending.reject(new Error(`${payload.error.message}: ${payload.error.data || ''}`));
      else pending.resolve(payload.result || {});
    });
  }

  async send(method, params = {}) {
    await this.opened;
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || result.exceptionDetails.exception?.description || 'Runtime.evaluate failed');
    }
    return result.result?.value;
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

async function waitFor(predicate, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return true;
    await sleep(250);
  }
  return false;
}

async function newPage() {
  await waitFor(async () => {
    try {
      await fetchJson(`http://127.0.0.1:${port}/json/version`);
      return true;
    } catch {
      return false;
    }
  }, 15000);
  let target;
  try {
    target = await fetchJson(`http://127.0.0.1:${port}/json/new?about%3Ablank`, { method: 'PUT' });
  } catch {
    target = await fetchJson(`http://127.0.0.1:${port}/json/new?about%3Ablank`);
  }
  const page = new CdpPage(target.webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  return page;
}

async function capture(page, fileName) {
  const result = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
  });
  const file = path.join(outDir, fileName);
  await fs.writeFile(file, Buffer.from(result.data, 'base64'));
  return file;
}

const chrome = spawn(chromePath, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--window-size=1440,1000',
  'about:blank',
], { stdio: 'ignore' });

try {
  const page = await newPage();
  await page.send('Page.navigate', { url: `${baseUrl}/validation/vizual-test.html?real-agent-render=${encodeURIComponent(runId)}` });
  await waitFor(() => page.evaluate(`document.readyState === 'complete' && !!window.Vizual?.renderSpec && typeof window.renderVizInMsg === 'function'`), 30000);

  const output = JSON.parse(await fs.readFile(inputFile, 'utf8'));
  const artifact = await page.evaluate(`(() => {
    const output = ${JSON.stringify(output)};
    const id = window.createAiMsg();
    window.streamText(id, output.answerText || 'Agent output');
    window.finishText(id);
    return window.renderVizInMsg(id, output.spec, { bubbleWidth: output.bubbleWidth || 'full' });
  })()`);
  await sleep(1600);

  const audit = await page.evaluate(`(() => {
    const container = document.querySelector('[data-viz-container="true"]');
    if (!container) return { ok: false, errors: ['container missing'] };
    const rect = container.getBoundingClientRect();
    const visible = Array.from(container.querySelectorAll('canvas, svg, table, h1, h2, h3, p, [data-section-id], .rk-card, button, input, select'))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 8 && r.height > 8;
      });
    const contentBottom = visible.reduce((max, el) => Math.max(max, el.getBoundingClientRect().bottom), rect.top);
    const overflows = Array.from(container.querySelectorAll('*')).filter(el => {
      if (!(el instanceof HTMLElement)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 12) return false;
      return el.scrollWidth > el.clientWidth + 8 && getComputedStyle(el).overflowX !== 'auto';
    });
    const overflowDetails = overflows.slice(0, 8).map(el => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === 'string' ? el.className : '',
        text: (el.textContent || '').trim().slice(0, 120),
        width: Math.round(r.width),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        overflowX: style.overflowX,
      };
    });
    const errors = Array.from(container.querySelectorAll('.viz-error,.interactive-error')).map(el => el.textContent.trim()).filter(Boolean);
    const textClone = container.cloneNode(true);
    textClone.querySelectorAll?.('script,style,noscript').forEach(el => el.remove());
    const visibleText = (textClone.textContent || '').trim();
    const metrics = {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      canvasCount: container.querySelectorAll('canvas').length,
      tableRows: container.querySelectorAll('tbody tr, table tr').length,
      overflowCount: overflows.length,
      overflowDetails,
      errorCount: errors.length,
      blankBottomRatio: rect.height ? Math.round((Math.max(0, rect.bottom - contentBottom) / rect.height) * 100) / 100 : 1,
      textLength: visibleText.length,
    };
    return {
      ok: errors.length === 0 && !visibleText.includes('[object Object]') && !visibleText.includes('\\\\n') && !visibleText.includes('\\\\r') && !visibleText.includes('\\\\t') && metrics.textLength > 80 && metrics.width > 300 && metrics.height > 180 && metrics.overflowCount === 0 && metrics.blankBottomRatio < 0.55,
      metrics,
      errors: [
        ...errors,
        ...(visibleText.includes('[object Object]') ? ['object string leaked into visible UI'] : []),
        ...((visibleText.includes('\\\\n') || visibleText.includes('\\\\r') || visibleText.includes('\\\\t')) ? ['escaped control sequence leaked into visible UI'] : []),
      ],
      text: visibleText.slice(0, 1000),
    };
  })()`);
  const screenshotPath = await capture(page, `real-agent-render-${runId}.png`);
  const result = {
    runId,
    inputFile,
    url: `${baseUrl}/validation/vizual-test.html?real-agent-render=${runId}`,
    screenshotPath,
    artifactId: artifact?.id || null,
    audit,
  };
  const outFile = path.join(outDir, `real-agent-render-${runId}.json`);
  await fs.writeFile(outFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({ outFile, result }, null, 2));
  page.close();
} finally {
  if (args.get('keep-open') !== 'true') chrome.kill('SIGTERM');
}
