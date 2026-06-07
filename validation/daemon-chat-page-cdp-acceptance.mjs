import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) {
    args.set(key, next);
    i += 1;
  } else {
    args.set(key, 'true');
  }
}

const chromePath = args.get('chrome') || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = Number(args.get('port') || 9388);
const baseUrl = args.get('base') || 'http://127.0.0.1:8794';
const runId = args.get('run') || new Date().toISOString().replace(/[:.]/g, '-');
const outDir = args.get('out') || '/tmp/vizual-core-validation';
const userDataDir = args.get('profile') || path.join(os.tmpdir(), `vizual-daemon-chat-cdp-${runId}`);
const headed = args.get('headless') !== 'true';
const prompt = args.get('prompt') || [
  '请做一个小型增长 dashboard：',
  '数据为 D1 新增120 收入12000 流失20，D2 新增150 收入13800 流失22，D3 新增180 收入15500 流失26，D4 新增210 收入17300 流失31。',
  '需要 KPI、趋势图、明细表和一句风险判断；不要用已移除组件，明细表保留全部逐日数据。',
].join('');

await fs.mkdir(outDir, { recursive: true });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${await response.text()}`);
  return response.json();
}

async function waitForChrome() {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      return await fetchJson(endpoint);
    } catch {
      await sleep(200);
    }
  }
  throw new Error(`Chrome CDP endpoint did not become ready at ${endpoint}`);
}

class CdpClient {
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

  close() {
    try { this.ws.close(); } catch {}
  }
}

async function createTarget(url = 'about:blank') {
  const encoded = encodeURIComponent(url);
  try {
    return await fetchJson(`http://127.0.0.1:${port}/json/new?${encoded}`, { method: 'PUT' });
  } catch {
    return fetchJson(`http://127.0.0.1:${port}/json/new?${encoded}`);
  }
}

async function makePage() {
  const target = await createTarget('about:blank');
  const page = new CdpClient(target.webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('DOM.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return page;
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed');
  }
  return result.result?.value;
}

async function waitFor(page, predicateExpression, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await evaluate(page, `(() => { try { return Boolean(${predicateExpression}); } catch { return false; } })()`);
    if (ok) return true;
    await sleep(500);
  }
  return false;
}

async function click(page, box, note) {
  if (!box) throw new Error(`${note} target missing`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await sleep(120);
}

async function screenshot(page, fileName) {
  const result = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    fromSurface: true,
  });
  const file = path.join(outDir, fileName);
  await fs.writeFile(file, Buffer.from(result.data, 'base64'));
  return file;
}

async function getBox(page, selector) {
  return evaluate(page, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  })()`);
}

async function readResult(page) {
  return evaluate(page, `(() => {
    const status = document.getElementById('statusText')?.textContent || '';
    const containers = Array.from(document.querySelectorAll('[data-viz-container="true"]'));
    const container = containers[containers.length - 1] || null;
    const last = window.__daemonVizualLast || null;
    const rect = container?.getBoundingClientRect?.();
    const overflowNodes = container ? Array.from(container.querySelectorAll('*')).filter(el => {
      if (!(el instanceof HTMLElement)) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 12) return false;
      return el.scrollWidth > el.clientWidth + 8 && getComputedStyle(el).overflowX !== 'auto';
    }) : [];
    const visibleErrors = container ? Array.from(container.querySelectorAll('.viz-error,.interactive-error'))
      .map(el => el.textContent || '')
      .filter(Boolean) : [];
    const text = container ? (container.innerText || '').trim() : '';
    const metrics = container ? {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      canvasCount: container.querySelectorAll('canvas').length,
      tableRows: container.querySelectorAll('tbody tr, table tr').length,
      formInputCount: container.querySelectorAll('input, textarea, select').length,
      fallbackCount: container.querySelectorAll('[data-fallback="true"]').length,
      overflowCount: overflowNodes.length,
      errorCount: visibleErrors.length,
      textLength: text.length,
    } : {};
    const audit = last?.audit || null;
    const ok = status.includes('run succeeded')
      && Boolean(last)
      && Boolean(container)
      && metrics.fallbackCount === 0
      && metrics.overflowCount === 0
      && metrics.errorCount === 0
      && metrics.canvasCount >= 1
      && metrics.tableRows >= 4
      && text.includes('流失');
    return {
      ok,
      status,
      hasLast: Boolean(last),
      audit,
      metrics,
      errors: visibleErrors,
      textSample: text.slice(0, 700),
    };
  })()`);
}

const chromeArgs = [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-popup-blocking',
  '--window-size=1440,1000',
  'about:blank',
];
if (!headed) chromeArgs.unshift('--headless=new');

const chrome = spawn(chromePath, chromeArgs, { stdio: 'ignore' });

try {
  await waitForChrome();
  const page = await makePage();
  const url = `${baseUrl}/validation/daemon-vizual-chat.html?daemon-chat-cdp=${encodeURIComponent(runId)}`;
  await page.send('Page.navigate', { url });
  await waitFor(page, `document.readyState === 'complete'`, 30000);
  const ready = await waitFor(page, `document.getElementById('statusText')?.textContent.includes('ready')`, 30000);
  if (!ready) throw new Error('daemon chat page did not report ready');

  await click(page, await getBox(page, '#input'), 'chat input');
  await page.send('Input.insertText', { text: prompt });
  await click(page, await getBox(page, '#sendBtn'), 'send button');

  const finished = await waitFor(page, `window.__daemonVizualLast && document.getElementById('statusText')?.textContent.includes('run succeeded')`, 240000);
  const result = await readResult(page);
  const screenshotPath = await screenshot(page, `daemon-chat-page-${runId}.png`);
  page.close();

  const summary = {
    runId,
    url,
    headed,
    prompt,
    finished,
    screenshotPath,
    result,
  };
  const summaryPath = path.join(outDir, `daemon-chat-page-${runId}.json`);
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log(JSON.stringify({ summaryPath, screenshotPath, summary }, null, 2));
  if (!result.ok) process.exitCode = 1;
} finally {
  if (args.get('keep-open') !== 'true') chrome.kill('SIGTERM');
}
