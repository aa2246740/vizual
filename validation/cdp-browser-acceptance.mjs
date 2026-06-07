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
const port = Number(args.get('port') || 9344);
const baseUrl = args.get('base') || 'http://127.0.0.1:8793';
const runId = args.get('run') || new Date().toISOString().replace(/[:.]/g, '-');
const outDir = args.get('out') || '/tmp/vizual-core-validation';
const userDataDir = args.get('profile') || path.join(os.tmpdir(), `vizual-acceptance-chrome-${runId}`);
const headed = args.get('headless') !== 'true';

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
    const message = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(message);
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
  try {
    await page.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: outDir });
  } catch {}
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
    throw new Error(result.exceptionDetails.text || result.exceptionDetails.exception?.description || 'Runtime.evaluate failed');
  }
  return result.result?.value;
}

async function goto(page, url) {
  await page.send('Page.navigate', { url });
  await waitFor(page, `document.readyState === 'complete'`, 30000);
}

async function waitFor(page, predicateExpression, timeoutMs = 60000) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    last = await evaluate(page, `(() => { try { return Boolean(${predicateExpression}); } catch { return false; } })()`);
    if (last) return true;
    await sleep(500);
  }
  return false;
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

async function runColdStart(page) {
  const url = `${baseUrl}/validation/vizual-test.html?cold-start-codex=${encodeURIComponent(runId)}`;
  await goto(page, url);
  await waitFor(page, `window.__codexColdStartRunner && window.__codexColdStartRunner.state.done`, 300000);
  const summary = await evaluate(page, `(() => {
    const s = window.__codexColdStartRunner?.state;
    if (!s) return { runner: false };
    return {
      runner: true,
      ready: s.ready,
      done: s.done,
      autoDrive: s.autoDrive || 'idle',
      pass: s.results.filter(r => r.result === 'PASS').length,
      fail: s.results.filter(r => r.result === 'FAIL').length,
      exports: s.exports.length,
      results: s.results.map(r => ({ id: r.id, result: r.result, api: r.api, evidence: r.evidence })),
      visualAudits: s.visualAudits,
      interactionAudits: s.interactionAudits,
      protocolAudits: s.protocolAudits,
    };
  })()`);
  const report = await evaluate(page, `window.__codexColdStartRunner?.reportMarkdown?.() || ''`);
  const reportPath = path.join(outDir, `cold-start-${runId}.md`);
  await fs.writeFile(reportPath, report, 'utf8');
  const screenshotPath = await screenshot(page, `cold-start-${runId}.png`);
  return { url, reportPath, screenshotPath, summary };
}

async function runAdversarial(page) {
  const url = `${baseUrl}/validation/a2ui-adversarial.html?run=${encodeURIComponent(runId)}`;
  await goto(page, url);
  await waitFor(page, `Array.isArray(window.__a2uiAdversarialResults)`, 60000);
  const summary = await evaluate(page, `(() => {
    const results = window.__a2uiAdversarialResults || [];
    return {
      status: document.getElementById('status')?.textContent || '',
      pass: results.filter(r => r.ok).length,
      fail: results.filter(r => !r.ok).length,
      total: results.length,
      results,
    };
  })()`);
  const screenshotPath = await screenshot(page, `a2ui-adversarial-${runId}.png`);
  await fs.writeFile(path.join(outDir, `a2ui-adversarial-${runId}.json`), JSON.stringify(summary, null, 2), 'utf8');
  return { url, screenshotPath, summary };
}

async function runA2uiFull(page) {
  const url = `${baseUrl}/validation/a2ui-full-acceptance.html?run=${encodeURIComponent(runId)}`;
  await goto(page, url);
  await waitFor(page, `Number(document.getElementById('total-count')?.textContent || 0) > 0`, 60000);

  const aiReady = await waitFor(page, `(() => {
    const card = document.getElementById('card-AI01-DaemonE2E');
    const button = Array.from(card?.querySelectorAll('button') || []).find(item => /Send to Daemon|Daemon Unavailable|Generating/.test(item.textContent || ''));
    return Boolean(button && (!button.disabled || /Daemon Unavailable/.test(button.textContent || '')));
  })()`, 30000);
  const aiClick = await evaluate(page, `(() => {
    const card = document.getElementById('card-AI01-DaemonE2E');
    const button = Array.from(card?.querySelectorAll('button') || []).find(item => /Send to Daemon|Daemon Unavailable|Generating/.test(item.textContent || ''));
    const status = document.getElementById('status-AI01-DaemonE2E')?.textContent || '';
    const daemonStatus = card?.querySelector('.daemon-status')?.textContent || '';
    if (!button) return { clicked: false, error: 'send-button-not-found', status, daemonStatus };
    if (button.disabled) return { clicked: false, disabled: true, text: button.textContent, status, daemonStatus };
    button.click();
    return { clicked: true, text: button.textContent, status, daemonStatus };
  })()`);
  const completed = await waitFor(page, `Number(document.getElementById('total-count')?.textContent || 0) > 0 && Number(document.getElementById('pass-count')?.textContent || 0) + Number(document.getElementById('fail-count')?.textContent || 0) === Number(document.getElementById('total-count')?.textContent || 0)`, 600000);
  const summary = await evaluate(page, `(() => {
    const firstRender = document.querySelector('.render-area');
    const firstChild = firstRender?.firstElementChild;
    const renderRect = firstRender?.getBoundingClientRect?.();
    const childRect = firstChild?.getBoundingClientRect?.();
    const aiCard = document.getElementById('card-AI01-DaemonE2E');
    const aiRender = document.getElementById('render-AI01-DaemonE2E');
    return {
      pass: Number(document.getElementById('pass-count')?.textContent || 0),
      fail: Number(document.getElementById('fail-count')?.textContent || 0),
      total: Number(document.getElementById('total-count')?.textContent || 0),
      ai: {
        status: document.getElementById('status-AI01-DaemonE2E')?.textContent || '',
        daemonStatus: aiCard?.querySelector('.daemon-status')?.textContent || '',
        textLength: (aiRender?.textContent || '').trim().length,
        canvasCount: aiRender?.querySelectorAll('canvas, svg').length || 0,
        tableRows: aiRender?.querySelectorAll('tbody tr').length || 0,
      },
      firstCardMetrics: renderRect && childRect ? {
        renderHeight: Math.round(renderRect.height),
        contentHeight: Math.round(childRect.height),
        blankBottom: Math.max(0, Math.round(renderRect.bottom - childRect.bottom)),
      } : null,
    };
  })()`);
  if (!aiReady || !aiClick.clicked || !completed || summary.pass + summary.fail !== summary.total || summary.fail > 0) {
    throw new Error(`A2UI full acceptance incomplete: ${JSON.stringify({ aiReady, aiClick, completed, summary })}`);
  }
  const screenshotPath = await screenshot(page, `a2ui-full-acceptance-${runId}.png`);
  return { url, screenshotPath, summary };
}

async function runFusionRuntimeAGUI(page) {
  const url = `${baseUrl}/validation/daemon-vizual-chat.html?fusion-browser=${encodeURIComponent(runId)}`;
  await goto(page, url);
  await waitFor(page, `window.Vizual && window.Vizual.VizualFusionRuntime && window.Vizual.renderSpec`, 60000);
  const summary = await evaluate(page, `new Promise(resolve => {
    const host = document.createElement('section');
    host.id = 'fusion-browser-acceptance';
    host.style.cssText = [
      'margin:24px',
      'padding:20px',
      'background:#0f172a',
      'border:1px solid #334155',
      'border-radius:10px',
      'color:#e5edf8',
      'font-family:Inter,system-ui,sans-serif'
    ].join(';');
    host.innerHTML = '<h2 style="margin:0 0 12px;font-size:18px">Fusion Runtime AG-UI Browser Acceptance</h2><div id="fusion-render-target" style="background:#111827;border-radius:8px;padding:16px"></div>';
    document.body.appendChild(host);

    const target = document.getElementById('fusion-render-target');
    const runtime = new window.Vizual.VizualFusionRuntime();
    const events = [
      { type: 'RUN_STARTED', runId: 'browser-agui-' + ${JSON.stringify(runId)}, timestamp: Date.now() },
      { type: 'STATE_SNAPSHOT', snapshot: { source: 'cdp-browser', stage: 'initial' } },
      {
        type: 'ACTIVITY_SNAPSHOT',
        messageId: 'browser-agui-activity',
        activityType: 'a2ui-surface',
        replace: true,
        content: {
          a2ui_operations: [
            { version: 'v0.10', createSurface: { surfaceId: 'browser-agui', catalogId: 'vizual', theme: { mode: 'dark' } } },
            {
              version: 'v0.10',
              updateDataModel: {
                surfaceId: 'browser-agui',
                path: '/',
                value: {
                  headline: 'AG-UI 原生事件已融合到 Vizual',
                  metrics: [
                    { label: '营收', value: '1280万', trend: '+8.4%' },
                    { label: '毛利率', value: '42.6%', trend: '+2.1pp' },
                    { label: '留存', value: '68%', trend: '-1.2pp' }
                  ],
                  rows: [
                    { channel: '自然搜索', revenue: 420, cost: 118 },
                    { channel: '付费广告', revenue: 760, cost: 336 },
                    { channel: '私域', revenue: 380, cost: 76 }
                  ],
                  form: {
                    note: '初始备注',
                    selected: 'paid',
                    options: [
                      { label: '自然搜索', value: 'organic' },
                      { label: '付费广告', value: 'paid' },
                      { label: '私域', value: 'owned' }
                    ],
                    flag: true,
                    score: 62
                  }
                }
              }
            },
            {
              version: 'v0.10',
              updateComponents: {
                surfaceId: 'browser-agui',
                components: [
                  { id: 'root', component: 'Column', gap: 16, children: ['title', 'kpis', 'grid', 'controls'] },
                  { id: 'title', component: 'Text', path: '/headline', variant: 'heading', size: 22, weight: 'bold' },
                  { id: 'kpis', component: 'KpiDashboard', metrics: { path: '/metrics' } },
                  { id: 'grid', component: 'Column', gap: 16, children: ['chart', 'table'] },
                  { id: 'chart', component: 'BarChart', title: '渠道营收', x: 'channel', y: 'revenue', data: { path: '/rows' } },
                  { id: 'table', component: 'DataTable', title: '渠道明细', columns: ['channel', 'revenue', 'cost'], data: { path: '/rows' } },
                  { id: 'controls', component: 'Card', padding: 16, children: ['note', 'segment', 'flag', 'score', 'apply'] },
                  { id: 'note', component: 'TextField', label: '备注', path: '/form/note', placeholder: '输入诊断备注' },
                  { id: 'segment', component: 'ChoicePicker', label: '重点渠道', path: '/form/selected', optionsPath: '/form/options' },
                  { id: 'flag', component: 'CheckBox', label: '纳入下月动作', path: '/form/flag' },
                  { id: 'score', component: 'Slider', label: '优先级', min: 0, max: 100, step: 1, path: '/form/score' },
                  { id: 'apply', component: 'Button', label: '应用筛选', variant: 'primary', action: 'applyFilter' }
                ]
              }
            }
          ]
        }
      },
      {
        type: 'ACTIVITY_DELTA',
        messageId: 'browser-agui-activity',
        activityType: 'a2ui-surface',
        patch: [{
          op: 'add',
          path: '/a2ui_operations/-',
          value: { version: 'v0.10', updateDataModel: { surfaceId: 'browser-agui', path: '/rows/1/revenue', value: 820 } }
        }]
      },
      {
        type: 'TOOL_CALL_RESULT',
        toolCallId: 'browser-tool-result',
        content: JSON.stringify({
          a2ui_operations: [
            { version: 'v0.10', updateDataModel: { surfaceId: 'browser-agui', path: '/form/note', value: '工具结果更新备注' } }
          ]
        })
      }
    ];

    const snapshot = runtime.processAGUIEvents(events);
    window.__fusionRuntimeBrowserAcceptance = { runtime, snapshot, events };
    window.Vizual.renderSpec(snapshot.spec, target);

    const setNativeValue = (element, value) => {
      const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      descriptor?.set?.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const setNativeChecked = (element, value) => {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
      descriptor?.set?.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const audit = () => {
      const targetRect = target.getBoundingClientRect();
      const visible = Array.from(target.querySelectorAll('*'))
        .map(element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            text: (element.textContent || '').trim(),
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            display: style.display,
            visibility: style.visibility,
          };
        })
        .filter(item => item.width > 0 && item.height > 0 && item.display !== 'none' && item.visibility !== 'hidden');
      const maxBottom = visible.reduce((value, item) => Math.max(value, item.bottom), targetRect.top);
      const overflows = visible.filter(item => item.left < targetRect.left - 2 || item.right > targetRect.right + 2);
      const text = target.innerText || '';
      return {
        visibleTextLength: text.trim().length,
        hasFallback: Boolean(target.querySelector('[data-fallback="true"]')),
        hasChartCanvas: Boolean(target.querySelector('canvas, svg')),
        hasTable: Boolean(target.querySelector('table')),
        controlCount: target.querySelectorAll('input, select, button').length,
        blankBottom: Math.max(0, Math.round(targetRect.bottom - maxBottom)),
        overflowCount: overflows.length,
        textSample: text.trim().slice(0, 160),
      };
    };

    const driveControls = (attempt = 0) => {
      const before = audit();
      const input = target.querySelector('input[type="text"]');
      const select = target.querySelector('select');
      const checkbox = target.querySelector('input[type="checkbox"]');
      const range = target.querySelector('input[type="range"]');
      const button = target.querySelector('button');
      if (!input || !select || !checkbox || !range || !button) {
        if (attempt > 40) {
          resolve({ ok: false, before, error: 'controls-not-rendered' });
          return;
        }
        setTimeout(() => driveControls(attempt + 1), 50);
        return;
      }
      setNativeValue(input, '真实浏览器输入后的备注');
      setNativeValue(select, 'owned');
      setNativeChecked(checkbox, false);
      setNativeValue(range, '88');
      button.click();
      requestAnimationFrame(() => {
        const after = audit();
        resolve({
          ok: Boolean(snapshot)
            && before.visibleTextLength > 80
            && after.visibleTextLength > 80
            && !after.hasFallback
            && after.controlCount >= 5
            && after.overflowCount === 0
            && after.blankBottom < 24
            && input.value === '真实浏览器输入后的备注'
            && select.value === 'owned'
            && checkbox.checked === false
            && range.value === '88'
            && button.getAttribute('data-clicked') === 'true',
          before,
          after,
          controls: {
            inputValue: input.value,
            selectValue: select.value,
            checkboxChecked: checkbox.checked,
            rangeValue: range.value,
            buttonClicked: button.getAttribute('data-clicked'),
          },
          runtime: {
            surfaceIds: runtime.getSurfaceIds(),
            eventLogLength: runtime.getEventLog().length,
            runState: runtime.getRunState(),
            tableRevenue: snapshot.spec.elements.table.props.data[1].revenue,
            toolNote: runtime.getDataModel('browser-agui').form.note,
            artifactRuntime: runtime.getArtifact('browser-agui').metadata.runtime,
          },
        });
      });
    };
    requestAnimationFrame(() => driveControls());
  })`);
  const screenshotPath = await screenshot(page, `fusion-runtime-agui-${runId}.png`);
  await fs.writeFile(path.join(outDir, `fusion-runtime-agui-${runId}.json`), JSON.stringify(summary, null, 2), 'utf8');
  return { url, screenshotPath, summary };
}

async function runFull31(page) {
  const url = `${baseUrl}/validation/eval-full-31.html?run=${encodeURIComponent(runId)}`;
  await goto(page, url);
  await waitFor(page, `Array.isArray(window.__vizualFull31Results)`, 60000);
  const summary = await evaluate(page, `(() => {
    const results = window.__vizualFull31Results || [];
    return {
      status: document.getElementById('status')?.textContent || '',
      pass: results.filter(r => r.ok).length,
      fail: results.filter(r => !r.ok).length,
      total: results.length,
      results,
    };
  })()`);
  const screenshotPath = await screenshot(page, `eval-full-31-${runId}.png`);
  return { url, screenshotPath, summary };
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
  const results = {
    runId,
    chrome: chromePath,
    headed,
    outDir,
    coldStart: await runColdStart(page),
    fusionRuntimeAGUI: await runFusionRuntimeAGUI(page),
    a2uiFull: await runA2uiFull(page),
    adversarial: await runAdversarial(page),
    full31: await runFull31(page),
  };
  page.close();
  const summaryPath = path.join(outDir, `browser-acceptance-${runId}.json`);
  await fs.writeFile(summaryPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(JSON.stringify({ summaryPath, results }, null, 2));
} finally {
  if (args.get('keep-open') !== 'true') chrome.kill('SIGTERM');
}
