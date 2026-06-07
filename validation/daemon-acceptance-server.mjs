import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createReadStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { normalizeArguments as normalizeVizualDirectToolArguments } from './pi-vizual-direct-tool.mjs';

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

const rootDir = path.resolve(args.get('root') || process.cwd());
const port = Number(args.get('port') || 8794);
const daemonUrl = (args.get('daemon') || 'http://127.0.0.1:7456').replace(/\/+$/, '');
const hermesBin = args.get('hermes') || process.env.HERMES_BIN || '/Users/wu/.local/bin/hermes';
const claudeBin = args.get('claude') || process.env.CLAUDE_BIN || '/opt/homebrew/bin/claude';
const codexBin = args.get('codex') || process.env.CODEX_BIN || '/opt/homebrew/bin/codex';
const piBin = args.get('pi') || process.env.PI_BIN || '/opt/homebrew/bin/pi';
const defaultCodexModel = args.get('codex-model') || process.env.VIZUAL_CODEX_MODEL || process.env.CODEX_MODEL || 'gpt-5.3-codex-spark';
const defaultClaudeModel = args.get('claude-model') || process.env.VIZUAL_CLAUDE_MODEL || process.env.CLAUDE_MODEL || 'sonnet';
const defaultPiModel = args.get('pi-model') || process.env.VIZUAL_PI_MODEL || process.env.PI_MODEL || 'xiaomi-token-plan-cn/mimo-v2.5-pro';
const codexTimeoutMs = Number(args.get('codex-timeout-ms') || process.env.VIZUAL_CODEX_TIMEOUT_MS || 180000);
const claudeTimeoutMs = Number(args.get('claude-timeout-ms') || process.env.VIZUAL_CLAUDE_TIMEOUT_MS || 300000);
const piTimeoutMs = Number(args.get('pi-timeout-ms') || process.env.VIZUAL_PI_TIMEOUT_MS || 180000);
const vizualSkillPath = path.join(rootDir, 'skills', 'vizual');
const vizualMcpConfigPath = path.join(rootDir, 'validation', 'artifacts', 'vizual-core-mcp.config.json');
const vizualPiDirectToolPath = path.join(rootDir, 'validation', 'pi-vizual-direct-tool.mjs');
const piMcpAdapterPath = args.get('pi-mcp-adapter')
  || process.env.PI_MCP_ADAPTER_PATH
  || '/Users/wu/.pi/agent/npm/node_modules/pi-mcp-adapter';
const sourcePiAgentDir = process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), '.pi', 'agent');

function normalizeAgentName(value) {
  if (value === 'claude-code') return 'claude-code';
  if (value === 'pi-agent' || value === 'pi') return 'pi-agent';
  return 'codex';
}

function defaultModelForAgent(agentName) {
  if (agentName === 'pi-agent') return defaultPiModel;
  return agentName === 'claude-code' ? defaultClaudeModel : defaultCodexModel;
}

function labelForAgent(agentName) {
  if (agentName === 'pi-agent') return 'Pi Agent';
  return agentName === 'claude-code' ? 'Claude Code' : 'Codex CLI';
}

function timeoutForAgent(agentName) {
  if (agentName === 'pi-agent') return piTimeoutMs;
  return agentName === 'claude-code' ? claudeTimeoutMs : codexTimeoutMs;
}

function normalizePiModel(model) {
  if (!model) return null;
  if (model.includes('/')) return model;
  if (model.startsWith('mimo-')) return `xiaomi-token-plan-cn/${model}`;
  return model;
}

function normalizeRuntimeMode(value) {
  const mode = String(value || '').trim();
  if (mode === 'bare' || mode === 'skill' || mode === 'mcp' || mode === 'guided') return mode;
  return 'guided';
}

function createPromptAudit(agentName, runtimeMode) {
  const mode = normalizeRuntimeMode(runtimeMode);
  if (mode === 'skill') {
    const capabilitySource = agentName === 'pi-agent'
      ? ['skill:skills/vizual', 'tool-extension:validation/pi-vizual-direct-tool.mjs']
      : ['agent-runtime-skill'];
    return {
      runtimeMode: mode,
      promptMode: 'raw-user-message',
      promptInjected: false,
      coldStart: true,
      capabilitySource,
      note: 'The user message is passed to the Agent unchanged; Vizual is discovered through installed skill/tool capability.',
    };
  }

  if (mode === 'mcp') {
    return {
      runtimeMode: mode,
      promptMode: 'raw-user-message',
      promptInjected: false,
      coldStart: true,
      capabilitySource: ['mcp:mcp/vizual-core-server/server.mjs'],
      note: 'The user message is passed to the Agent unchanged; Vizual is discovered through the Vizual MCP server and MCP tool calls.',
    };
  }

  if (mode === 'bare') {
    return {
      runtimeMode: mode,
      promptMode: 'raw-user-message',
      promptInjected: false,
      coldStart: true,
      capabilitySource: [],
      note: 'The user message is passed unchanged with no Vizual skills, tools, extensions, or guided prompt.',
    };
  }

  return {
    runtimeMode: mode,
    promptMode: 'guided-validation-wrapper',
    promptInjected: true,
    coldStart: false,
    capabilitySource: ['validation:buildDeerflowSimPrompt'],
    note: 'Guided mode is only for diagnostics and examples; it is not the cold-start acceptance path.',
  };
}

async function ensureVizualMcpConfig() {
  const config = {
    mcpServers: {
      'vizual-core': {
        command: 'node',
        args: [path.join(rootDir, 'mcp', 'vizual-core-server', 'server.mjs')],
        cwd: rootDir,
      },
    },
  };
  await fs.mkdir(path.dirname(vizualMcpConfigPath), { recursive: true }).catch(() => {});
  await fs.writeFile(vizualMcpConfigPath, JSON.stringify(config, null, 2));
  return vizualMcpConfigPath;
}

function tomlString(value) {
  return JSON.stringify(String(value));
}

function codexMcpConfigArgs(runtimeMode) {
  if (normalizeRuntimeMode(runtimeMode) !== 'mcp') return [];
  const serverPath = path.join(rootDir, 'mcp', 'vizual-core-server', 'server.mjs');
  return [
    '-c',
    'mcp_servers.vizual_core.command="node"',
    '-c',
    `mcp_servers.vizual_core.args=[${tomlString(serverPath)}]`,
    '-c',
    `mcp_servers.vizual_core.cwd=${tomlString(rootDir)}`,
  ];
}

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.mp4', 'video/mp4'],
  ['.svg', 'image/svg+xml; charset=utf-8'],
]);

function isRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,HEAD,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'cache-control': 'no-store',
    ...corsHeaders,
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body, null, 2), { 'content-type': 'application/json; charset=utf-8' });
}

function safeStaticPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const relative = decoded === '/' ? '/validation/vizual-mission-control.html' : decoded;
  const target = path.resolve(rootDir, `.${relative}`);
  if (target !== rootDir && !target.startsWith(rootDir + path.sep)) return null;
  return target;
}

async function proxyDaemon(req, res, url) {
  const targetPath = url.pathname.replace(/^\/od-daemon/, '') || '/';
  const target = `${daemonUrl}${targetPath}${url.search}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (!value || lower === 'host' || lower === 'origin' || lower === 'referer') continue;
    if (lower.startsWith('sec-fetch-')) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  let body;
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
  });
  res.writeHead(upstream.status, {
    'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
    'cache-control': 'no-store',
    ...corsHeaders,
  });
  if (!upstream.body) {
    res.end();
    return;
  }
  const reader = upstream.body.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

async function readJsonBody(req) {
  const raw = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function buildMissionPrompt(agentName) {
  return `你是 ${agentName}，正在参与 Vizual Core 真实验收。请只输出一个 JSON object，不要 markdown，不要代码围栏，不要额外解释。

业务场景：
华东区今日 09:00-16:00 的 AI 内容曝光占比从 10% 升到 68%，流失人数从 20 升到 115，高风险告警从 4 升到 24，收入从 16600 元降到 15120 元。当前还不能证明 AI 内容导致流失，只能判断相关性，需要先止损再验证因果。

输出 schema：
{
  "agent": "${agentName}",
  "diagnosis": "一句中文经营判断，必须同时提到华东、AI、流失、告警",
  "risks": ["2-3条风险"],
  "nextActions": [
    {"label": "动作名称", "owner": "负责人", "priority": "P0/P1/P2"}
  ],
  "visualPlan": ["KPI", "趋势图", "告警表", "交互按钮"]
}

约束：
- nextActions 至少 3 条。
- visualPlan 必须覆盖 KPI、趋势图、告警表、交互按钮。
- 不要虚构外部数据，不要声称已证明因果。`;
}

function compactJsonForPrompt(value, maxLength = 12000) {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n...<truncated>` : text;
}

function normalizePromptHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const role = String(item.role || '').slice(0, 32);
      const content = String(item.content || '').trim().slice(0, 2000);
      if (!role || !content) return null;
      return { role, content };
    })
    .filter(Boolean);
}

function buildDeerflowSimPrompt(userMessage, context = {}) {
  const history = normalizePromptHistory(context.history);
  const previousToolCall = context.previousToolCall && typeof context.previousToolCall === 'object'
    ? context.previousToolCall
    : null;
  const contextBlock = [
    history.length
      ? `最近聊天上下文（按时间顺序，供理解“刚才/继续/更新”等指代）：\n${history.map(item => `${item.role}: ${item.content}`).join('\n\n')}`
      : '',
    previousToolCall
      ? `上一轮 Vizual 工具调用摘要（可复用其中真实数据与 surface 语义，必要时生成新的 surface）：\n${compactJsonForPrompt(previousToolCall)}`
      : '',
  ].filter(Boolean).join('\n\n');

  return `你是一个正常的对话 Agent，具备通用问答、业务分析能力，并且在确实需要结构化 UI 时可以调用 Vizual Core。先回答用户当前问题，再只在必要位置调用 present_vizual_ui。请只输出一个 JSON object，不要 markdown，不要代码围栏，不要额外解释。

${contextBlock ? `${contextBlock}\n\n` : ''}用户最新消息：
${userMessage}

能力边界：
- 你自己判断是否需要 Vizual UI；Host 不会替你给出“本轮需要/不需要 UI”的结论。
- 普通问候、短事实、简单解释、轻量改写、命令说明、用户明确要求纯文本时，保持 toolCall=null。
- 当趋势、对比、分布、关系、状态流转、填写、筛选、决策或假设探索用文字不够直观时，可以调用 present_vizual_ui。
- 用户明确要求网页、landing page、游戏、HTML/CSS/React、SVG 或代码 artifact 时，按用户请求处理，不要强行转成 Vizual Native。
- 交互必须有用：改变本地状态、改善理解，或使用 Host 明确提供的能力；不要为了展示可交互而添加按钮、表单或控件。

输出 schema：
{
  "assistantText": "给用户看的中文结论。保留在聊天主链路里，不要把 UI JSON 写进这段文字。",
  "toolCall": null 或 {
    "name": "present_vizual_ui",
    "arguments": {
      "surfaceId": "stable-kebab-case-id",
      "fallbackText": "不能渲染时的纯文本摘要",
      "display": {"mode": "inline", "title": "短标题", "persist": true},
      "input": [
        {"version":"v0.10","createSurface":{"surfaceId":"同 surfaceId","catalogId":"vizual"}},
        {"version":"v0.10","updateDataModel":{"surfaceId":"同 surfaceId","path":"/","value":{}}},
        {"version":"v0.10","updateComponents":{"surfaceId":"同 surfaceId","components":[]}}
      ]
    }
  }
}

Vizual native 约束：
- 你可以直接使用以下 native component dialect，不需要先“查看 schema”再停下：
  - component 对象可写成 {"id":"root","component":"Column","props":{"children":["chart","notes","table"]}}；children 必须按本轮用户意图增减，不要固定包含 form。
  - 也兼容 Claude/A2UI 风格 {"componentId":"chart","type":"BarChart","props":{...}}
  - BarChart/LineChart 可使用 rows: props.data=[{"label":"门店A","营收环比变化(%)":-8.2}], props.x="label", props.y=["营收环比变化(%)"]
  - 也可使用紧凑图表数据: props.data={"categories":["门店A"],"series":[{"name":"营收环比变化(%)","data":[-8.2]}]}；这是 Vizual 输入归一化格式，不是 ECharts option。
  - DataTable 使用 props.columns 和 props.data；FormBuilder 使用 props.fields 和 props.submitLabel。
- 不能只说“我需要检查 schema / Let me check the schema”。如果使用工具阅读仓库，最终仍必须输出下方 schema 里的 JSON object。
- input 必须是 Vizual native/A2UI 可被 runtime 处理的操作数组。
- updateDataModel.value 必须包含你从用户最新消息和最近聊天上下文中抽取或计算出的真实数据，不要虚构额外月份或渠道。
- 如果用户说“刚才/继续/更新/只看某部分”，必须使用最近聊天上下文或上一轮 Vizual 工具调用里的数据，不要误判为缺少数据。
- 不要为了通过测试而固定输出 KPI+DataTable+FormBuilder。组件必须服从用户意图。
- 只有用户明确要求收集/填写/提交，或本轮来自 Vizual 交互回传时，才输出 FormBuilder/Button；否则禁止附带“下一步行动/整改计划/提交计划”表单。
- 如果用户要求双轴、组合图、多图层、柱状+折线+散点/气泡，请优先使用 ComboChart；series 可以包含 {"type":"bar","y":"hours"}、{"type":"line","y":"crashRate"}、{"type":"scatter","y":"crashRate","size":"churnRate"}。
- 如果输出 KPI 区，必须使用原生 {"component":"KpiDashboard","props":{"metrics":[...]}}。不要用 Row/Card/Text 手写 KPI 卡片来替代。
- 如果需要在 UI 内放解释正文，使用 Markdown 或 RichText；不要把“下一步动作”扩展成表单，除非用户明确要求收集输入。
- root 默认用 Column；需要横向对比时用 Row。不要使用页面级历史布局组件；Native Core 只保留少量历史兼容输入。不要注入全局主题、暗色主题、页面 CSS 或设计门禁。
- 图表必须有非空 data，不能只有空框。
- 单张 LineChart/BarChart 不要把不同量纲的指标放在同一 y 轴上，例如营收、客流、转化率不能直接混画。需要多指标时，只画已标准化指数，或只选择一个关键指标，或使用明确多轴的 ComboChart。
- 图表标题、坐标轴、series 名称里的单位必须和实际绘制数值一致；如果标题写“万元”，必须先把元级原始值除以 10000 再绘制，否则标题/轴名写“元”。不要出现“万元”标题配 198000 这类元级数值。
- 图表如果用于诊断焦点，必须设置 action: "drillDown"，让用户点击数据点后可以回传给 Agent。
- FormBuilder/Button 用于收集用户下一步动作或触发 follow-up，不要要求用户离开聊天。
- FormBuilder.fields 每一项必须给出稳定 name；如果你只有中文 label，也要补一个业务可读 name，例如 targetStore、actionPlan、owner、deadline、expectedOutcome。
- 表单提交必须通过 submitForm 回流；按钮或筛选交互可以使用 applyFilter、drillDown、selectLocation、updatePlan。
- FormBuilder 的可填写字段要像真实产品表单：字段 label 必须清晰且互不重复；不要把同一个风险项/结论文本塞进多个 input 的 defaultValue/value。
- FormBuilder 提交按钮文案优先使用 submitLabel，例如 "提交整改计划"，不要让中文业务表单落成默认英文按钮。
- 除非用户原文已经给出了该字段答案，否则 text/textarea/number/date 字段不要设置 defaultValue；用 placeholder 引导用户填写。
- select/radio 可以提供 options；如果没有明确默认选择，就给 placeholder（如“请选择优先问题”）而不是伪造默认答案。
- 如果用户明确要求创建数据采集表单，或本轮已经进入 Vizual 交互回传，才可以在数据不足时返回 FormBuilder；否则数据不足时只用文字追问。
- 如果用户消息来自 Vizual 交互回传，必须在 assistantText 里解释你如何处理这个交互；必要时用同一个 surfaceId 更新原界面。
- 如果用户消息包含“交互摘要（必须引用，不可忽略）”，assistantText 必须直接回应摘要里的点位/指标/数值；不能在 payload 已有日期、指标或点位时声称缺少这些参数。`;
}

function runCommand(command, commandArgs, { cwd = rootDir, timeoutMs = 120000, env = {} } = {}) {
  const startedAt = Date.now();
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const child = spawn(command, commandArgs, {
      cwd,
      env: { ...process.env, NO_COLOR: '1', CLICOLOR: '0', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(JSON.stringify({ event: 'command.spawned', command, pid: child.pid, at: new Date().toISOString() }));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2500).unref();
    }, timeoutMs);
    const append = (target, chunk) => {
      const next = target + chunk.toString('utf8');
      return next.length > 2000000 ? next.slice(-2000000) : next;
    };
    child.stdout.on('data', chunk => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on('data', chunk => {
      stderr = append(stderr, chunk);
    });
    child.on('error', error => {
      clearTimeout(timer);
      console.log(JSON.stringify({ event: 'command.error', command, pid: child.pid, error: error.message, at: new Date().toISOString() }));
      resolve({
        ok: false,
        code: null,
        timedOut,
        stdout,
        stderr: stderr || error.message,
        durationMs: Date.now() - startedAt,
      });
    });
    child.on('close', code => {
      clearTimeout(timer);
      console.log(JSON.stringify({ event: 'command.close', command, pid: child.pid, code, timedOut, at: new Date().toISOString() }));
      resolve({
        ok: code === 0 && !timedOut,
        code,
        timedOut,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

async function runCodexPrompt(prompt, { model = defaultCodexModel, timeoutMs = 180000, runtimeMode = 'guided' } = {}) {
  if (normalizeRuntimeMode(runtimeMode) === 'mcp') {
    return runCodexPromptStreaming(prompt, { model, timeoutMs, runtimeMode });
  }
  const outputPath = path.join(os.tmpdir(), `vizual-codex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.json`);
  const shellCommand = [
    JSON.stringify(codexBin),
    'exec',
    '--skip-git-repo-check',
    '--ephemeral',
    '--ignore-rules',
    '--dangerously-bypass-approvals-and-sandbox',
    '--model',
    JSON.stringify(model),
    '-o',
    JSON.stringify(outputPath),
    JSON.stringify(prompt),
  ].join(' ');
  const result = await runCommand('/bin/zsh', ['-lc', shellCommand], { timeoutMs });
  const output = await fs.readFile(outputPath, 'utf8').catch(() => '');
  await fs.unlink(outputPath).catch(() => {});
  return {
    ...result,
    stdout: output.trim() || result.stdout,
    inputPromptMode: normalizeRuntimeMode(runtimeMode) === 'guided' ? 'guided-validation-wrapper' : 'raw-user-message',
  };
}

async function runPiPrompt(prompt, { model = defaultPiModel, timeoutMs = 180000, runtimeMode = 'guided' } = {}) {
  const resolvedModel = normalizePiModel(model);
  const mode = normalizeRuntimeMode(runtimeMode);
  const commandArgs = ['-p', '--no-session', '--mode', 'json', '--no-context-files', '--thinking', 'off'];
  let tempHome = null;
  if (mode === 'skill') {
    commandArgs.push(
      '--no-builtin-tools',
      '--no-extensions',
      '--extension',
      vizualPiDirectToolPath,
      '--skill',
      vizualSkillPath,
    );
  } else if (mode === 'bare') {
    commandArgs.push('--no-tools', '--no-extensions', '--no-skills');
  } else {
    commandArgs.push('--no-tools', '--no-extensions', '--no-skills');
  }
  if (resolvedModel) commandArgs.push('--model', resolvedModel);
  commandArgs.push(prompt);
  try {
    const result = await runCommand(piBin, commandArgs, { timeoutMs });
    return {
      ...result,
      argvAudit: commandArgs.slice(0, -1),
      inputPromptMode: mode === 'guided' ? 'guided-validation-wrapper' : 'raw-user-message',
    };
  } finally {
    if (tempHome) await fs.rm(tempHome, { recursive: true, force: true }).catch(() => {});
  }
}

async function runClaudeMcpPrompt(prompt, { model = defaultClaudeModel, timeoutMs = 300000 } = {}) {
  const mcpConfig = JSON.stringify({
    mcpServers: {
      'vizual-core': {
        command: 'node',
        args: [path.join(rootDir, 'mcp', 'vizual-core-server', 'server.mjs')],
      },
    },
  });
  const allowedTools = [
    'mcp__vizual-core__present_vizual_ui',
    'mcp__vizual-core__vizual_catalog',
    'mcp__vizual-core__vizual_validate',
    'mcp__vizual-core__vizual_preview',
  ].join(',');
  const commandArgs = [
    '-p',
    prompt,
    '--verbose',
    '--output-format',
    'stream-json',
    '--no-session-persistence',
    '--permission-mode',
    'bypassPermissions',
    '--dangerously-skip-permissions',
    '--tools',
    '',
    '--allowedTools',
    allowedTools,
    '--disable-slash-commands',
    '--strict-mcp-config',
    '--mcp-config',
    mcpConfig,
    '--model',
    model,
  ];
  const result = await runCommand(claudeBin, commandArgs, { timeoutMs });
  return {
    ...result,
    argvAudit: commandArgs.map(arg => (arg === mcpConfig ? '<vizual-mcp-config>' : arg)),
    inputPromptMode: 'raw-user-message',
  };
}

async function runCodexPromptStreaming(prompt, {
  model = defaultCodexModel,
  timeoutMs = 180000,
  runtimeMode = 'guided',
  onJsonEvent = () => {},
  onRawLine = () => {},
} = {}) {
  const outputPath = path.join(os.tmpdir(), `vizual-codex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.json`);
  const commandArgs = [
    'exec',
    '--skip-git-repo-check',
    '--ephemeral',
    '--ignore-rules',
    '--dangerously-bypass-approvals-and-sandbox',
    '--json',
    '--model',
    model,
    ...codexMcpConfigArgs(runtimeMode),
    '-o',
    outputPath,
    prompt,
  ];
  const startedAt = Date.now();
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    const jsonEvents = [];
    let stdoutLineBuffer = '';
    let stderrLineBuffer = '';
    let timedOut = false;
    const child = spawn(codexBin, commandArgs, {
      cwd: rootDir,
      env: { ...process.env, NO_COLOR: '1', CLICOLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(JSON.stringify({ event: 'codex-stream.spawned', command: codexBin, pid: child.pid, model, at: new Date().toISOString() }));
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 2500).unref();
    }, timeoutMs);
    const emitStdoutLine = (line) => {
      if (!line.trim()) return;
      onRawLine(line);
      stdout = (stdout + line + '\n').slice(-200000);
      const parsed = parseJsonCandidate(line);
      if (parsed) {
        jsonEvents.push(parsed);
        onJsonEvent(parsed);
      }
    };
    child.stdout.on('data', chunk => {
      stdoutLineBuffer += chunk.toString('utf8');
      const lines = stdoutLineBuffer.split(/\r?\n/);
      stdoutLineBuffer = lines.pop() ?? '';
      for (const line of lines) emitStdoutLine(line);
    });
    child.stderr.on('data', chunk => {
      stderrLineBuffer += chunk.toString('utf8');
      const lines = stderrLineBuffer.split(/\r?\n/);
      stderrLineBuffer = lines.pop() ?? '';
      stderr = (stderr + chunk.toString('utf8')).slice(-200000);
      for (const line of lines) {
        if (line.trim()) onJsonEvent({ type: 'codex.stderr', message: line });
      }
    });
    child.on('error', async error => {
      clearTimeout(timer);
      const output = await fs.readFile(outputPath, 'utf8').catch(() => '');
      await fs.unlink(outputPath).catch(() => {});
      resolve({
        ok: false,
        code: null,
        timedOut,
        stdout: output.trim() || stdout,
        stdoutJsonl: stdout,
        jsonEvents,
        stderr: stderr || error.message,
        durationMs: Date.now() - startedAt,
        inputPromptMode: normalizeRuntimeMode(runtimeMode) === 'guided' ? 'guided-validation-wrapper' : 'raw-user-message',
        argvAudit: commandArgs.slice(0, -1),
      });
    });
    child.on('close', async code => {
      clearTimeout(timer);
      emitStdoutLine(stdoutLineBuffer);
      if (stderrLineBuffer.trim()) onJsonEvent({ type: 'codex.stderr', message: stderrLineBuffer.trim() });
      const output = await fs.readFile(outputPath, 'utf8').catch(() => '');
      await fs.unlink(outputPath).catch(() => {});
      console.log(JSON.stringify({ event: 'codex-stream.close', pid: child.pid, code, timedOut, durationMs: Date.now() - startedAt, at: new Date().toISOString() }));
      resolve({
        ok: code === 0 && !timedOut,
        code,
        timedOut,
        stdout: output.trim() || stdout,
        stdoutJsonl: stdout,
        jsonEvents,
        stderr,
        durationMs: Date.now() - startedAt,
        inputPromptMode: normalizeRuntimeMode(runtimeMode) === 'guided' ? 'guided-validation-wrapper' : 'raw-user-message',
        argvAudit: commandArgs.slice(0, -1),
      });
    });
  });
}

function parseJsonCandidate(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string') return parseJsonCandidate(parsed);
    return parsed;
  } catch {}
  try {
    const parsed = JSON.parse(escapeJsonStringControlChars(trimmed));
    if (typeof parsed === 'string') return parseJsonCandidate(parsed);
    return parsed;
  } catch {}

  if (/^[\[{]\s*\\+"/.test(trimmed)) {
    try {
      return JSON.parse(trimmed.replace(/\\"/g, '"'));
    } catch {}
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1]);
      if (typeof parsed === 'string') return parseJsonCandidate(parsed);
      return parsed;
    } catch {}
    try {
      const parsed = JSON.parse(escapeJsonStringControlChars(fenced[1]));
      if (typeof parsed === 'string') return parseJsonCandidate(parsed);
      return parsed;
    } catch {}
    if (/^[\[{]\s*\\+"/.test(fenced[1].trim())) {
      try {
        return JSON.parse(fenced[1].trim().replace(/\\"/g, '"'));
      } catch {}
    }
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      const candidate = trimmed.slice(start, end + 1);
      const parsed = JSON.parse(candidate);
      if (typeof parsed === 'string') return parseJsonCandidate(parsed);
      return parsed;
    } catch {}
    const candidate = trimmed.slice(start, end + 1);
    try {
      const parsed = JSON.parse(escapeJsonStringControlChars(candidate));
      if (typeof parsed === 'string') return parseJsonCandidate(parsed);
      return parsed;
    } catch {}
    if (/^[\[{]\s*\\+"/.test(candidate)) {
      try {
        return JSON.parse(candidate.replace(/\\"/g, '"'));
      } catch {}
    }
  }
  return null;
}

function textFromMcpToolResult(result) {
  const content = Array.isArray(result?.content) ? result.content : [];
  const textPart = content.find(part => part && part.type === 'text' && typeof part.text === 'string');
  return textPart?.text || '';
}

function extractCodexMcpEnvelope(commandResult) {
  const events = Array.isArray(commandResult?.jsonEvents) ? commandResult.jsonEvents : [];
  if (!events.length) return null;

  const assistantTexts = [];
  let presentToolPayload = null;
  let presentToolError = null;
  const mcpToolCalls = [];

  for (const event of events) {
    const item = event?.item;
    if (!item || typeof item !== 'object') continue;
    if (item.type === 'agent_message' && typeof item.text === 'string' && item.text.trim()) {
      assistantTexts.push(item.text.trim());
      continue;
    }
    if (item.type !== 'mcp_tool_call') continue;
    mcpToolCalls.push({
      server: item.server,
      tool: item.tool,
      arguments: item.arguments,
      status: item.status,
      error: item.error,
    });
    if (item.tool !== 'present_vizual_ui') continue;
    const resultText = textFromMcpToolResult(item.result);
    const parsedResult = parseJsonCandidate(resultText);
    if (parsedResult && typeof parsedResult === 'object') {
      presentToolPayload = parsedResult;
    } else if (resultText) {
      presentToolError = `present_vizual_ui result JSON parse failed: ${resultText.slice(0, 240)}`;
    }
    if (item.error) presentToolError = String(item.error);
  }

  if (!assistantTexts.length && !presentToolPayload && !mcpToolCalls.length) return null;
  const finalAssistantText = [...assistantTexts].reverse().find(text => !/^\s*(我先|Let me|I'll)\b/iu.test(text)) ?? assistantTexts.at(-1) ?? '';
  const toolCall = presentToolPayload?.toolCall && typeof presentToolPayload.toolCall === 'object'
    ? presentToolPayload.toolCall
    : null;

  return {
    assistantText: finalAssistantText,
    toolCall,
    runtimeAudit: {
      inputMode: 'native',
      conversion: 'codex-mcp-tool-call',
      mcpToolCalls,
      presentToolOk: presentToolPayload?.ok,
      presentToolError,
    },
  };
}

function escapeJsonStringControlChars(value) {
  let result = '';
  let inString = false;
  let escaped = false;
  for (const ch of value) {
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === '\n') {
        result += '\\n';
        continue;
      }
      if (ch === '\r') {
        result += '\\r';
        continue;
      }
      if (ch === '\t') {
        result += '\\t';
        continue;
      }
    }
    result += ch;
  }
  return result;
}

function parseAgentJson(raw) {
  const candidates = [];
  const wrapper = parseJsonCandidate(raw);
  if (wrapper && typeof wrapper === 'object') {
    for (const key of ['result', 'text', 'message', 'content', 'output']) {
      if (typeof wrapper[key] === 'string') candidates.push(wrapper[key]);
    }
    if (Array.isArray(wrapper.content)) {
      candidates.push(wrapper.content.map(item => item?.text || item?.content || '').join('\n'));
    }
  }
  candidates.push(raw);
  for (const candidate of candidates) {
    const parsed = parseJsonCandidate(candidate);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.diagnosis === 'string' || Array.isArray(parsed.nextActions) || Array.isArray(parsed.actions)) {
        return parsed;
      }
    }
  }
  if (wrapper && typeof wrapper === 'object') return wrapper;
  return null;
}

function normalizeActions(value) {
  const raw = Array.isArray(value) ? value : [];
  return raw
    .map((item, index) => {
      if (typeof item === 'string') return { label: item, owner: '待分配', priority: index === 0 ? 'P0' : 'P1' };
      if (!item || typeof item !== 'object') return null;
      return {
        label: String(item.label || item.name || item.action || '').trim(),
        owner: String(item.owner || item.team || item.assignee || '待分配').trim(),
        priority: String(item.priority || item.level || (index === 0 ? 'P0' : 'P1')).trim(),
      };
    })
    .filter(item => item?.label);
}

function normalizeAgent(name, commandResult) {
  const raw = commandResult.stdout || '';
  const parsed = parseAgentJson(raw);
  const diagnosis = String(parsed?.diagnosis || parsed?.answer || parsed?.conclusion || '').trim();
  const risks = Array.isArray(parsed?.risks) ? parsed.risks.map(item => String(item).trim()).filter(Boolean) : [];
  const nextActions = normalizeActions(parsed?.nextActions || parsed?.actions || parsed?.recommendations);
  const visualPlan = Array.isArray(parsed?.visualPlan) ? parsed.visualPlan.map(item => String(item).trim()).filter(Boolean) : [];
  const searchable = `${diagnosis}\n${risks.join('\n')}\n${nextActions.map(item => item.label).join('\n')}\n${visualPlan.join('\n')}`;
  const missingTerms = [
    ['华东', /华东/],
    ['AI', /AI|人工智能/i],
    ['流失', /流失/],
    ['告警', /告警/],
  ].filter(([, pattern]) => !pattern.test(searchable)).map(([label]) => label);
  const missingPlan = [
    ['KPI', /KPI|指标/i],
    ['趋势图', /趋势|折线|图/i],
    ['告警表', /告警表|表格|明细/i],
    ['交互按钮', /交互|按钮|操作/i],
  ].filter(([, pattern]) => !pattern.test(visualPlan.join('\n'))).map(([label]) => label);
  const errors = [];
  if (!commandResult.ok) errors.push(commandResult.timedOut ? 'agent timeout' : `exit ${commandResult.code}`);
  if (!parsed) errors.push('JSON parse failed');
  if (diagnosis.length < 12) errors.push('diagnosis too short');
  if (nextActions.length < 3) errors.push('nextActions < 3');
  if (missingTerms.length) errors.push(`missing terms: ${missingTerms.join(',')}`);
  if (missingPlan.length) errors.push(`visualPlan incomplete: ${missingPlan.join(',')}`);
  return {
    ok: errors.length === 0,
    name,
    durationMs: commandResult.durationMs,
    exitCode: commandResult.code,
    stderr: commandResult.stderr,
    raw,
    parsed: parsed ? { agent: parsed.agent || name, diagnosis, risks, nextActions, visualPlan } : null,
    errors,
  };
}

async function persistLatestDeerflowResponse(responseBody, name = 'latest-real-codex-response.json') {
  const target = path.join(rootDir, 'validation', 'artifacts', name);
  await fs.mkdir(path.dirname(target), { recursive: true }).catch(() => {});
  const persisted = { ...responseBody };
  delete persisted.rawFull;
  await fs.writeFile(target, JSON.stringify(persisted, null, 2)).catch(() => {});
}

async function persistLatestAgentStdout(raw, name) {
  const target = path.join(rootDir, 'validation', 'artifacts', name);
  await fs.mkdir(path.dirname(target), { recursive: true }).catch(() => {});
  await fs.writeFile(target, String(raw || '')).catch(() => {});
}

async function persistAgentDeerflowResponse(responseBody, agentName) {
  await persistLatestDeerflowResponse(responseBody, 'latest-real-agent-response.json');
  const artifactName = agentName === 'claude-code'
    ? 'latest-real-claude-code-response.json'
    : agentName === 'pi-agent'
      ? 'latest-real-pi-agent-response.json'
      : 'latest-real-codex-response.json';
  await persistLatestDeerflowResponse(responseBody, artifactName);
  await persistLatestAgentStdout(responseBody.rawFull || responseBody.raw || '', `latest-real-${agentName}-stdout.txt`);
}

function textFromAssistantMessage(message) {
  if (!message || typeof message !== 'object' || message.role !== 'assistant') return '';
  if (typeof message.text === 'string') return message.text.trim();
  if (typeof message.content === 'string') return message.content.trim();
  if (!Array.isArray(message.content)) return '';
  return message.content
    .map(item => {
      if (typeof item === 'string') return item;
      if (item?.type === 'text' && typeof item.text === 'string') return item.text;
      if (typeof item?.content === 'string') return item.content;
      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();
}

function objectFromMaybeJson(value) {
  if (!value) return null;
  if (typeof value === 'string') return parseJsonCandidate(value);
  return typeof value === 'object' ? value : null;
}

function presentVizualToolCall(args = {}) {
  if (!args || typeof args !== 'object' || !args.input) return null;
  const surfaceId = typeof args.surfaceId === 'string'
    ? args.surfaceId
    : inferSurfaceIdFromVizualInput(args.input) || `cold-start-${Date.now().toString(36)}`;
  const fallbackText = typeof args.fallbackText === 'string' && args.fallbackText.trim()
    ? args.fallbackText.trim()
    : '已生成可视化。';
  return {
    name: 'present_vizual_ui',
    arguments: {
      surfaceId,
      fallbackText,
      display: args.display && typeof args.display === 'object' ? args.display : { mode: 'inline', persist: true },
      input: args.input,
      ...(args.runtimeAudit && typeof args.runtimeAudit === 'object' ? { runtimeAudit: args.runtimeAudit } : {}),
    },
  };
}

function stableToolCallSignature(call) {
  try {
    const args = call?.arguments || call?.args || {};
    const input = directVizualSpecFromToolCall(call);
    if (!input) return null;
    return JSON.stringify({
      name: call?.name || call?.toolName || '',
      input,
    });
  } catch {
    return null;
  }
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(value => typeof value === 'string' && value.trim())));
}

function safeElementId(value, fallback) {
  return String(value || fallback || 'element')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || String(fallback || 'element');
}

function directVizualSpecFromToolCall(call) {
  const args = call?.arguments || call?.args || {};
  const normalized = normalizeVizualDirectToolArguments({
    input: args.input,
    ...(args.runtimeAudit && typeof args.runtimeAudit === 'object' ? { runtimeAudit: args.runtimeAudit } : {}),
  });
  const input = normalized?.input || args.input;
  if (isRecord(input) && typeof input.root === 'string' && isRecord(input.elements)) return input;
  if (isRecord(input?.spec) && typeof input.spec.root === 'string' && isRecord(input.spec.elements)) return input.spec;
  return null;
}

function completeVizualToolCall(call) {
  const spec = directVizualSpecFromToolCall(call);
  if (!spec) return null;
  const args = call?.arguments || call?.args || {};
  const normalized = normalizeVizualDirectToolArguments({
    input: args.input,
    ...(isRecord(args.runtimeAudit) ? { runtimeAudit: args.runtimeAudit } : {}),
  });
  return {
    name: call?.name || call?.toolName || 'present_vizual_ui',
    arguments: {
      ...args,
      input: spec,
      ...(isRecord(args.runtimeAudit)
        ? { runtimeAudit: args.runtimeAudit }
        : isRecord(normalized?.runtimeAudit)
          ? { runtimeAudit: normalized.runtimeAudit }
          : {}),
    },
  };
}

function remapChildren(value, idMap) {
  if (!Array.isArray(value)) return value;
  return value.map(child => typeof child === 'string' ? idMap.get(child) || child : child);
}

function composeVizualToolCalls(toolCalls) {
  const calls = Array.isArray(toolCalls) ? toolCalls.filter(Boolean) : [];
  if (calls.length <= 1) return calls[0] || null;

  const elements = {
    root: {
      component: 'Column',
      props: { gap: 16 },
      children: [],
    },
  };
  const rootChildren = elements.root.children;
  const state = {};

  calls.forEach((call, index) => {
    const spec = directVizualSpecFromToolCall(call);
    if (!spec?.root || !isRecord(spec.elements)) return;
    const args = call.arguments || {};
    const prefix = safeElementId(args.surfaceId || args.display?.title || spec.root || `surface-${index + 1}`, `surface-${index + 1}`);
    const idMap = new Map();
    for (const elementId of Object.keys(spec.elements)) {
      idMap.set(elementId, safeElementId(`${prefix}-${elementId}`, `${prefix}-${index + 1}`));
    }
    for (const [elementId, element] of Object.entries(spec.elements)) {
      const nextId = idMap.get(elementId);
      if (!nextId || !isRecord(element)) continue;
      const next = cloneJson(element);
      next.children = remapChildren(next.children, idMap);
      if (isRecord(next.props)) {
        next.props.children = remapChildren(next.props.children, idMap);
      }
      elements[nextId] = next;
    }
    const rootId = idMap.get(spec.root);
    if (rootId) rootChildren.push(rootId);
    if (isRecord(spec.state)) Object.assign(state, cloneJson(spec.state));
  });

  if (!rootChildren.length) return calls.at(-1) || null;

  return {
    name: 'present_vizual_ui',
    arguments: {
      surfaceId: calls[0]?.arguments?.surfaceId || `multi-${Date.now().toString(36)}`,
      fallbackText: calls[0]?.arguments?.fallbackText || '已生成多段 Vizual 可视化。',
      display: { mode: 'inline', title: 'Vizual outputs', persist: true },
      input: {
        root: 'root',
        elements,
        ...(Object.keys(state).length ? { state } : {}),
      },
      runtimeAudit: {
        inputMode: 'native-normalized',
        conversion: `multi-tool-call-compose:${calls.length}`,
      },
    },
  };
}

function normalizeVizualToolCall(call) {
  if (!call || typeof call !== 'object') return null;
  const name = String(call.name || call.toolName || '');
  const args = objectFromMaybeJson(call.arguments || call.args) || {};
  if (/present[_-]vizual[_-]ui/i.test(name)) return presentVizualToolCall(args);

  if (name === 'mcp') {
    const toolName = String(args.tool || args.name || '');
    const innerArgs = objectFromMaybeJson(args.args || args.arguments) || {};
    if (/present[_-]vizual[_-]ui/i.test(toolName)) return presentVizualToolCall(innerArgs);
    if (/vizual[_-]preview/i.test(toolName) && innerArgs.input) return presentVizualToolCall(innerArgs);
  }

  if (call.type === 'toolCall' && /present[_-]vizual[_-]ui/i.test(name)) {
    return presentVizualToolCall(args);
  }
  return null;
}

function vizualToolCallFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const direct = payload.toolCall || payload.tool_call;
  const normalizedDirect = normalizeVizualToolCall(direct);
  if (normalizedDirect) return normalizedDirect;
  if (payload.name || payload.toolName) {
    const normalizedSelf = normalizeVizualToolCall(payload);
    if (normalizedSelf) return normalizedSelf;
  }
  return null;
}

function collectVizualToolCallsFromMessage(message) {
  const calls = [];
  if (!message || typeof message !== 'object' || !Array.isArray(message.content)) return calls;
  for (const item of message.content) {
    const normalized = normalizeVizualToolCall(item);
    if (normalized) calls.push(normalized);
  }
  return calls;
}

function collectToolResultTexts(event) {
  const texts = [];
  const collect = item => {
    if (typeof item === 'string') texts.push(item);
    else if (Array.isArray(item)) {
      for (const child of item) collect(child);
    }
    else if (item?.type === 'text' && typeof item.text === 'string') texts.push(item.text);
    else if (item?.type === 'tool_result') collect(item.content);
    else if (typeof item?.text === 'string') texts.push(item.text);
    else if (typeof item?.content === 'string') texts.push(item.content);
    else if (Array.isArray(item?.content)) collect(item.content);
  };
  if (event?.role === 'toolResult' && Array.isArray(event.content)) {
    for (const item of event.content) collect(item);
  }
  if (Array.isArray(event?.content) && event?.role !== 'assistant') {
    for (const item of event.content) collect(item);
  }
  return texts;
}

function parseAgentEventTranscript(raw) {
  let assistantText = '';
  const textDeltas = [];
  let toolCall = null;
  const toolCalls = [];
  const seenToolCalls = new Set();

  const rememberToolCall = call => {
    if (!call) return;
    const materializedCall = completeVizualToolCall(call);
    if (!materializedCall) return;
    toolCall = materializedCall;
    const signature = stableToolCallSignature(materializedCall);
    if (!signature) return;
    if (seenToolCalls.has(signature)) return;
    seenToolCalls.add(signature);
    toolCalls.push(materializedCall);
  };

  const inspectEvent = event => {
    if (!event || typeof event !== 'object') return;
    const messages = [];
    if (event.message) messages.push(event.message);
    if (event.assistantMessageEvent?.partial) messages.push(event.assistantMessageEvent.partial);
    if (event.assistantMessageEvent?.message) messages.push(event.assistantMessageEvent.message);
    if (Array.isArray(event.messages)) messages.push(...event.messages);

    for (const message of messages) {
      const text = textFromAssistantMessage(message);
      if (text) assistantText = text;
      for (const call of collectVizualToolCallsFromMessage(message)) rememberToolCall(call);
      for (const resultText of collectToolResultTexts(message)) {
        const payload = parseJsonCandidate(resultText);
        const resultCall = vizualToolCallFromPayload(payload);
        if (resultCall) rememberToolCall(resultCall);
      }
    }

    const update = event.assistantMessageEvent;
    if (update?.type === 'text_delta' && typeof update.delta === 'string') textDeltas.push(update.delta);
    if (update?.type === 'text_end' && typeof update.content === 'string') assistantText = update.content.trim();

    const directCall = vizualToolCallFromPayload(event);
    if (directCall) rememberToolCall(directCall);
    for (const text of collectToolResultTexts(event)) {
      const payload = parseJsonCandidate(text);
      const resultCall = vizualToolCallFromPayload(payload);
      if (resultCall) rememberToolCall(resultCall);
    }
  };

  for (const line of String(raw || '').split(/\r?\n/)) {
    const event = parseJsonCandidate(line);
    inspectEvent(event);
  }
  const wrapper = parseJsonCandidate(raw);
  inspectEvent(wrapper);

  if (!assistantText && textDeltas.length) assistantText = textDeltas.join('').trim();
  if (!assistantText && toolCall?.arguments?.fallbackText) assistantText = toolCall.arguments.fallbackText;
  if (!assistantText && !toolCall) return null;
  return { assistantText, toolCall: composeVizualToolCalls(toolCalls) || toolCall, toolCalls };
}

function parseDeerflowAgentJson(raw) {
  const transcript = parseAgentEventTranscript(raw);
  if (transcript?.toolCall) return transcript;
  const candidates = [];
  const collectMessageText = message => {
    if (!message || typeof message !== 'object' || message.role !== 'assistant') return;
    if (typeof message.text === 'string') candidates.push(message.text);
    if (typeof message.content === 'string') candidates.push(message.content);
    if (Array.isArray(message.content)) {
      const text = message.content
        .map(item => {
          if (typeof item === 'string') return item;
          if (item?.type === 'text' && typeof item.text === 'string') return item.text;
          if (typeof item?.content === 'string') return item.content;
          return '';
        })
        .filter(Boolean)
        .join('\n');
      if (text) candidates.push(text);
    }
  };
  const wrapper = parseJsonCandidate(raw);
  if (wrapper && typeof wrapper === 'object') {
    if (wrapper.type === 'item.completed' && wrapper.item?.type === 'agent_message' && typeof wrapper.item.text === 'string') {
      candidates.push(wrapper.item.text);
    }
    collectMessageText(wrapper.message);
    if (Array.isArray(wrapper.messages)) {
      for (const message of wrapper.messages) collectMessageText(message);
    }
    if (typeof wrapper.result === 'string') candidates.push(wrapper.result);
    for (const key of ['text', 'message', 'content', 'output']) {
      if (typeof wrapper[key] === 'string') candidates.push(wrapper[key]);
    }
    if (Array.isArray(wrapper.content)) {
      candidates.push(wrapper.content.map(item => item?.text || item?.content || '').join('\n'));
    }
  }
  for (const line of String(raw || '').split(/\r?\n/)) {
    const event = parseJsonCandidate(line);
    if (event && typeof event === 'object') {
      if (event.type === 'item.completed' && event.item?.type === 'agent_message' && typeof event.item.text === 'string') {
        candidates.push(event.item.text);
      }
      if (event.type === 'agent_message' && typeof event.text === 'string') {
        candidates.push(event.text);
      }
      collectMessageText(event.message);
      collectMessageText(event.assistantMessageEvent?.partial);
      collectMessageText(event.assistantMessageEvent?.message);
      if (typeof event.assistantMessageEvent?.delta === 'string') {
        candidates.push(event.assistantMessageEvent.delta);
      }
      if (Array.isArray(event.messages)) {
        for (const message of event.messages) collectMessageText(message);
      }
    }
  }
  candidates.push(raw);

  for (const candidate of candidates) {
    const parsed = parseJsonCandidate(candidate) || parseAgentJsonWithRecoveredToolCall(candidate);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.assistantText === 'string' || parsed.toolCall || parsed.tool_call) {
        if (!parsed.toolCall && parsed.tool_call) parsed.toolCall = parsed.tool_call;
        return parsed;
      }
    }
    const vizualOutput = parseVizualOutputCandidate(candidate);
    if (vizualOutput) return vizualOutput;
  }
  return transcript || null;
}

function parseVizualOutputCandidate(candidate) {
  const parsed = parseJsonCandidate(candidate);
  if (!parsed) return null;
  if (!looksLikeVizualInput(parsed)) return null;
  const surfaceId = inferSurfaceIdFromVizualInput(parsed) || `cold-start-${Date.now().toString(36)}`;
  const assistantText = extractPlainTextBeforeJson(candidate) || '已生成可视化。';
  return {
    assistantText,
    toolCall: {
      name: 'present_vizual_ui',
      arguments: {
        surfaceId,
        fallbackText: assistantText,
        display: { mode: 'inline', title: 'Vizual', persist: true },
        input: parsed,
      },
    },
  };
}

function looksLikeVizualInput(value) {
  if (Array.isArray(value)) {
    return value.some(item => {
      if (!isRecord(item)) return false;
      return Boolean(
        item.createSurface || item.updateComponents || item.updateDataModel || item.updateData ||
        item.appendDataModel || item.deleteSurface ||
        (typeof item.type === 'string' && item.type.startsWith('surface.')) ||
        (typeof item.version === 'string' && (item.createSurface || item.updateComponents || item.updateDataModel))
      );
    });
  }
  if (!isRecord(value)) return false;
  if (typeof value.root === 'string' && isRecord(value.elements)) return true;
  if (value.spec && isRecord(value.spec) && typeof value.spec.root === 'string' && isRecord(value.spec.elements)) return true;
  return Boolean(value.createSurface || value.updateComponents || value.updateDataModel);
}

function inferSurfaceIdFromVizualInput(value) {
  const messages = Array.isArray(value) ? value : [value];
  for (const message of messages) {
    if (!isRecord(message)) continue;
    if (typeof message.surfaceId === 'string') return message.surfaceId;
    for (const key of ['createSurface', 'updateComponents', 'updateDataModel', 'updateData', 'appendDataModel']) {
      const payload = message[key];
      if (isRecord(payload) && typeof payload.surfaceId === 'string') return payload.surfaceId;
    }
  }
  return '';
}

function extractPlainTextBeforeJson(value) {
  if (typeof value !== 'string') return '';
  const fenced = value.match(/([\s\S]*?)```(?:json)?\s*[\[{]/i);
  if (fenced && fenced[1].trim()) return fenced[1].trim().slice(0, 500);
  const objectIndex = value.search(/[\[{]/);
  if (objectIndex > 0) return value.slice(0, objectIndex).trim().slice(0, 500);
  return '';
}

function parseAgentJsonWithRecoveredToolCall(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : trimmed;
  const toolKeyMatch = /"toolCall"\s*:/.exec(source) || /"tool_call"\s*:/.exec(source);
  if (!toolKeyMatch) return null;
  const objectStart = source.indexOf('{', toolKeyMatch.index + toolKeyMatch[0].length);
  if (objectStart < 0) return null;
  const toolObjectText = extractBalancedJsonObject(source, objectStart);
  if (!toolObjectText) return null;
  const toolCall = parseJsonCandidate(toolObjectText);
  if (!toolCall || typeof toolCall !== 'object') return null;
  const assistantText = extractAssistantTextBeforeToolCall(source) || '';
  return { assistantText, toolCall };
}

function extractBalancedJsonObject(source, startIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = startIndex; index < source.length; index += 1) {
    const ch = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(startIndex, index + 1);
    }
  }
  return null;
}

function extractAssistantTextBeforeToolCall(source) {
  const match = source.match(/"assistantText"\s*:\s*"([\s\S]*?)"\s*,\s*"tool_?Call"\s*:/);
  if (!match) return '';
  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function assertRenderedSurfaceContract(preview) {
  const errors = [];
  const spec = preview?.spec;
  const elements = spec?.elements && typeof spec.elements === 'object' ? spec.elements : {};
  const componentTypes = Object.values(elements)
    .map(element => element?.type || element?.component)
    .filter(type => typeof type === 'string');
  const hasAny = candidates => componentTypes.some(type => candidates.includes(type));
  const chartTypes = [
    'AreaChart', 'BarChart', 'BubbleChart', 'CalendarChart', 'ComboChart',
    'DumbbellChart', 'FunnelChart', 'HeatmapChart', 'HistogramChart',
    'LineChart', 'PieChart', 'RadarChart', 'SankeyChart', 'ScatterChart',
    'SparklineChart', 'WaterfallChart', 'XmrChart',
  ];
  if (!componentTypes.length) errors.push('render contract failed: no Vizual components rendered');

  const tableEntries = Object.entries(elements).filter(([, element]) => (element?.type || element?.component) === 'DataTable');
  for (const [id, element] of tableEntries) {
    if (countReadableTableCells(element?.props || {}) === 0) errors.push(`table ${id} has no readable cells`);
  }

  const chartEntries = Object.entries(elements).filter(([, element]) => (
    chartTypes.includes(element?.type || element?.component)
  ));
  if (!chartEntries.length) return errors;
  for (const [id, element] of chartEntries) {
    if (countChartDataPoints(element?.props || {}) === 0) errors.push(`chart ${id} data missing`);
    const props = element?.props || {};
    const yItems = Array.isArray(props.yFields) ? props.yFields : Array.isArray(props.y) ? props.y : [];
    const units = new Set(yItems.map(item => inferChartUnit(typeof item === 'string' ? item : `${item?.key || item?.field || ''} ${item?.label || item?.name || ''}`)).filter(Boolean));
    const isNormalized = isNormalizedChartProps(props, yItems);
    if ((element?.type === 'LineChart' || element?.type === 'BarChart') && units.size > 1 && !isNormalized) {
      errors.push(`chart ${id} mixes incompatible units: ${Array.from(units).join('/')}`);
    }
    const unitMismatch = detectChartUnitMismatch(props);
    if (unitMismatch) errors.push(`chart ${id} ${unitMismatch}`);
  }
  return errors;
}

function isNormalizedChartProps(props, yItems = []) {
  const seriesNames = isRecord(props?.seriesNames) ? Object.values(props.seriesNames) : [];
  const text = [
    props?.title,
    props?.description,
    props?.yAxisLabel,
    ...yItems.map(item => (typeof item === 'string' ? item : `${item?.key || item?.field || ''} ${item?.label || item?.name || ''}`)),
    ...seriesNames,
  ].join(' ');
  return props?.normalized === true || /标准化|指数|index|normalized/i.test(text);
}

function countChartDataPoints(props) {
  const directData = Array.isArray(props.data) ? props.data.length : 0;
  const embeddedSeries = isRecord(props.data) && Array.isArray(props.data.series) ? props.data.series : [];
  const series = Array.isArray(props.series) ? props.series : embeddedSeries;
  const seriesData = series.length
    ? series.reduce((sum, item) => sum + (Array.isArray(item?.data) ? item.data.length : 0), 0)
    : 0;
  const xAxis = Array.isArray(props.xAxis) ? props.xAxis[0] : props.xAxis;
  const categoryData = Array.isArray(props.categories)
    ? props.categories.length
    : isRecord(props.data) && Array.isArray(props.data.categories)
      ? props.data.categories.length
    : Array.isArray(xAxis?.data)
      ? xAxis.data.length
      : 0;
  return Math.max(directData, seriesData, categoryData && seriesData ? seriesData : 0);
}

function countReadableTableCells(props) {
  const rows = Array.isArray(props?.data) ? props.data.filter(isRecord) : [];
  if (!rows.length) return 0;
  const columnKeys = Array.isArray(props?.columns)
    ? props.columns.map((column, index) => {
      if (typeof column === 'string') return column;
      if (!isRecord(column)) return `col_${index + 1}`;
      return String(column.key ?? column.field ?? column.accessor ?? column.dataIndex ?? column.id ?? column.name ?? column.label ?? column.title ?? column.header ?? `col_${index + 1}`);
    })
    : [];
  const keys = columnKeys.length ? columnKeys : Object.keys(rows[0] || {});
  let count = 0;
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') count += 1;
    }
  }
  return count;
}

function detectChartUnitMismatch(props) {
  const labelText = collectChartLabelText(props);
  const values = collectChartNumericValues(props);
  if (!values.length) return '';
  const maxAbs = Math.max(...values.map(value => Math.abs(value)));
  if (/万元/.test(labelText) && maxAbs >= 10000) {
    return `unit mismatch: label says 万元 but plotted values look like raw yuan (max=${maxAbs})`;
  }
  return '';
}

function collectChartLabelText(props) {
  const seriesNames = [];
  if (isRecord(props?.seriesNames)) seriesNames.push(...Object.values(props.seriesNames));
  const series = Array.isArray(props?.series)
    ? props.series
    : isRecord(props?.data) && Array.isArray(props.data.series)
      ? props.data.series
      : [];
  for (const item of series) {
    if (item?.name !== undefined) seriesNames.push(item.name);
  }
  return [
    props?.title,
    props?.description,
    props?.xAxisLabel,
    props?.yAxisLabel,
    props?.unit,
    props?.valueUnit,
    ...seriesNames,
  ].filter(value => value !== undefined && value !== null).join(' ');
}

function collectChartNumericValues(props) {
  const values = [];
  const pushNumber = value => {
    if (typeof value === 'number' && Number.isFinite(value)) values.push(value);
  };
  const pushArray = array => {
    if (!Array.isArray(array)) return;
    for (const item of array) {
      if (Array.isArray(item)) {
        pushArray(item);
      } else if (isRecord(item)) {
        for (const value of Object.values(item)) pushNumber(value);
      } else {
        pushNumber(item);
      }
    }
  };
  pushArray(props?.data);
  pushArray(props?.series);
  if (isRecord(props?.data)) {
    pushArray(props.data.series);
    for (const seriesItem of Array.isArray(props.data.series) ? props.data.series : []) {
      pushArray(seriesItem?.data);
    }
  }
  return values;
}

function inferChartUnit(text) {
  const value = String(text || '').toLowerCase();
  if (/营收|收入|revenue|金额|元/.test(value)) return 'currency';
  if (/转化|conversion|率|pct|percent|%/.test(value)) return 'percent';
  if (/客流|人数|人\b|traffic|user|visit/.test(value)) return 'count';
  if (/差评|投诉|complaint|告警|alert|门店|store/.test(value)) return 'count';
  return '';
}

function parseInteractionPayload(userMessage) {
  if (!/交互数据|action:\s*\w+/i.test(userMessage)) return null;
  const fenced = userMessage.match(/```json\s*([\s\S]*?)```/i);
  const parsed = fenced ? parseJsonCandidate(fenced[1]) : null;
  if (parsed && typeof parsed === 'object') return parsed;
  const action = userMessage.match(/action:\s*([^\s]+)/i)?.[1];
  return action ? { action } : null;
}

function containsMetricText(text, metric) {
  const key = String(metric || '').toLowerCase();
  if (!key) return true;
  const aliases = {
    conversion: ['conversion', '转化率', '转化'],
    revenue: ['revenue', '营收', '收入'],
    traffic: ['traffic', '客流'],
  }[key] || [String(metric)];
  return aliases.some(alias => text.includes(alias));
}

function containsAnyText(text, values) {
  const source = String(text || '').toLowerCase();
  return values.some(value => source.includes(String(value).toLowerCase()));
}

function compactComparableText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s\u00a0\u3000·`"'“”‘’（）()【】\[\]{}<>《》，,。.:：;；!?！？\-—_]/g, '');
}

function containsLooseText(text, value) {
  const needle = String(value ?? '');
  if (!needle) return true;
  const source = String(text || '');
  return source.includes(needle) || compactComparableText(source).includes(compactComparableText(needle));
}

function acknowledgesActionPlan(assistantText, actionPlan) {
  const plan = String(actionPlan || '').toLowerCase();
  const text = String(assistantText || '').toLowerCase();
  if (!plan.trim()) return true;
  const directFragments = plan
    .split(/[，。；;,.]/)
    .map(fragment => fragment.trim())
    .filter(Boolean);
  if (directFragments.some(fragment => text.includes(fragment.slice(0, 16)))) return true;

  const checks = [];
  if (/store\s*b|\bb\b|b店|门店b/i.test(plan)) checks.push(['store b', 'b 店', 'b店', '门店 b', '门店b']);
  if (/restock|补货|库存|stock/i.test(plan)) checks.push(['restock', '补货', '库存', 'stock']);
  if (/48\s*h|48\s*hour|48小时|48 小时/i.test(plan)) checks.push(['48h', '48 h', '48小时', '48 小时', '48 hour']);
  if (/bad\s*comment|bad\s*review|差评|评论|review/i.test(plan)) checks.push(['bad comment', 'bad review', '差评', '评论', 'review']);
  if (/ops|owner|负责人|运营/i.test(plan)) checks.push(['ops', 'owner', '负责人', '运营']);
  if (!checks.length) return false;
  const matched = checks.filter(group => containsAnyText(text, group)).length;
  return matched >= Math.min(3, checks.length);
}

function assertInteractionResponseCoverage(userMessage, assistantText) {
  const payload = parseInteractionPayload(userMessage);
  if (!payload) return [];
  const errors = [];
  const action = payload.action;
  const text = String(assistantText || '');
  if (action && !text.includes(action) && !/交互|点击|提交|回传|收到/.test(text)) {
    errors.push(`interaction response does not acknowledge ${action}`);
  }

  if (action === 'drillDown') {
    const point = payload.params?.point || payload.params?.selectedPoint || payload.params?.data?.point || {};
    const pointName = point.name ?? point.label;
    const seriesName = point.seriesName || point.series || point.metric;
    const pointValue = point.value ?? point.data ?? point.y;
    if (pointName !== undefined && !containsLooseText(text, pointName)) {
      errors.push(`drillDown response missing point ${pointName}`);
    }
    if (seriesName !== undefined && !containsMetricText(text, seriesName)) {
      errors.push(`drillDown response missing metric ${seriesName}`);
    }
    if (pointValue !== undefined && !containsLooseText(text, pointValue)) {
      errors.push(`drillDown response missing value ${pointValue}`);
    }
    if ((pointName !== undefined || seriesName !== undefined || pointValue !== undefined)
      && /没有具体.*(日期|指标|点位|参数)|缺少.*(日期|指标|点位)/.test(text)) {
      errors.push('drillDown response incorrectly claims provided point parameters are missing');
    }
  }
  if (action === 'submitForm') {
    const data = isRecord(payload.params?.data) ? payload.params.data : payload.params ?? {};
    const requiredEchoes = [
      data.targetStore ?? data.store,
      data.priorityIssue,
      data.targetConversion ?? data.targetConversionLift,
      data.targetOosRate ?? data.targetStockout,
    ].filter(value => value !== undefined && value !== null && String(value).trim());
    for (const value of requiredEchoes) {
      if (!text.includes(String(value))) errors.push(`submitForm response missing submitted value ${value}`);
    }
    if (data.actionPlan && !acknowledgesActionPlan(text, data.actionPlan)) {
      errors.push('submitForm response missing submitted actionPlan');
    }
  }
  return errors;
}

function statefulVizualInputForPreview(input, previousToolCall) {
  if (!Array.isArray(input)) return input;
  const current = input;
  const previousInput = Array.isArray(previousToolCall?.arguments?.input) ? previousToolCall.arguments.input : [];
  if (!current.length || !previousInput.length) return current;
  const currentSurface = firstStringFromVizualInput(current);
  const previousSurface = firstStringFromVizualInput(previousInput);
  if (currentSurface && previousSurface && currentSurface !== previousSurface) return current;
  return [...previousInput, ...current];
}

function firstStringFromVizualInput(input) {
  for (const message of Array.isArray(input) ? input : []) {
    if (!isRecord(message)) continue;
    for (const key of ['createSurface', 'updateDataModel', 'updateComponents', 'appendDataModel', 'deleteSurface']) {
      const value = message[key];
      if (isRecord(value) && typeof value.surfaceId === 'string') return value.surfaceId;
    }
    if (typeof message.surfaceId === 'string') return message.surfaceId;
    if (typeof message.surface_id === 'string') return message.surface_id;
  }
  return '';
}

async function loadVizualRuntime() {
  return import(pathToFileUrl(path.join(rootDir, 'dist/index.mjs')).href);
}

function pathToFileUrl(filePath) {
  const resolved = path.resolve(filePath).replace(/\\/g, '/');
  return new URL(`file://${resolved.startsWith('/') ? '' : '/'}${resolved}`);
}

async function buildDeerflowResponse({ body, userMessage, agentName, commandResult }) {
  const runtimeMode = normalizeRuntimeMode(body.runtimeMode);
  const promptAudit = createPromptAudit(agentName, runtimeMode);
  const parsed = parseDeerflowAgentJson(commandResult.stdout);
  const mcpEnvelope = parsed && typeof parsed === 'object' ? null : extractCodexMcpEnvelope(commandResult);
  const rawStdout = String(commandResult.stdout || '').trim();
  const plainTextWrapper = !parsed && !mcpEnvelope && rawStdout
    ? { assistantText: rawStdout, toolCall: null, runtimeAudit: { outputMode: 'plain-text' } }
    : null;
  const wrapper = parsed && typeof parsed === 'object' ? parsed : mcpEnvelope || plainTextWrapper;
  const text = String(wrapper?.assistantText || wrapper?.text || wrapper?.answer || '').trim();
  let toolCall = wrapper?.toolCall && typeof wrapper.toolCall === 'object' ? wrapper.toolCall : null;
  const toolCalls = Array.isArray(wrapper?.toolCalls) ? wrapper.toolCalls : (toolCall ? [toolCall] : []);
  const warnings = [];
  if (plainTextWrapper) warnings.push('agent returned plain text instead of JSON wrapper');
  if (toolCalls.length > 1) warnings.push(`multiple Vizual tool calls composed (${toolCalls.length})`);
  const toolName = toolCall?.name || toolCall?.toolName;
  let toolArgs = toolCall?.arguments || toolCall?.args || null;
  let input = toolArgs?.input;
  let runtimeAudit = toolArgs?.runtimeAudit && typeof toolArgs.runtimeAudit === 'object'
    ? toolArgs.runtimeAudit
    : wrapper?.runtimeAudit && typeof wrapper.runtimeAudit === 'object'
      ? wrapper.runtimeAudit
      : null;
  if (toolArgs && input) {
    const normalized = normalizeVizualDirectToolArguments(toolArgs);
    const normalizedAudit = normalized?.runtimeAudit && typeof normalized.runtimeAudit === 'object'
      ? normalized.runtimeAudit
      : null;
    const shouldUseNormalized = normalizedAudit
      && (
        !runtimeAudit
        || runtimeAudit.inputMode === 'unknown'
        || normalizedAudit.inputMode !== 'unknown'
      );
    if (shouldUseNormalized) {
      toolArgs = {
        ...toolArgs,
        input: normalized.input,
        runtimeAudit: normalizedAudit,
      };
      input = toolArgs.input;
      runtimeAudit = normalizedAudit;
      toolCall = {
        ...toolCall,
        arguments: toolArgs,
      };
    }
  }
  const nativeAcceptedModes = new Set(['native', 'native-normalized']);
  if (runtimeAudit?.inputMode && !nativeAcceptedModes.has(runtimeAudit.inputMode)) {
    warnings.push(`non-native input ${runtimeAudit.inputMode}${runtimeAudit.conversion ? ` (${runtimeAudit.conversion})` : ''}`);
  } else if (runtimeAudit?.inputMode === 'native-normalized') {
    warnings.push(`native input normalized${runtimeAudit.conversion ? ` (${runtimeAudit.conversion})` : ''}`);
  }
  const catalogGaps = Array.isArray(runtimeAudit?.catalogGaps) ? runtimeAudit.catalogGaps : [];
  for (const gap of catalogGaps) {
    const code = gap?.code || 'vizual.catalog_gap';
    const message = gap?.message || 'Vizual payload required compatibility absorption.';
    warnings.push(`${code}: ${message}`);
  }
  const errors = [];

  if (!commandResult.ok) errors.push(commandResult.timedOut ? 'agent timeout' : `agent exit ${commandResult.code}`);
  if (!wrapper) errors.push(agentName === 'codex' && runtimeMode === 'mcp' ? 'codex MCP event parse failed' : 'agent JSON parse failed');
  if (runtimeAudit?.presentToolError) errors.push(String(runtimeAudit.presentToolError));
  if (!text) errors.push('assistantText missing');
  errors.push(...assertInteractionResponseCoverage(userMessage, text));
  if (toolCall && toolName !== 'present_vizual_ui') errors.push('toolCall.name must be present_vizual_ui');
  if (toolCall && !input) errors.push('toolCall.arguments.input missing');
  if (
    toolCall
    && normalizeRuntimeMode(body.runtimeMode) === 'skill'
    && runtimeAudit?.inputMode
    && !nativeAcceptedModes.has(runtimeAudit.inputMode)
  ) {
    errors.push(`native acceptance failed: ${runtimeAudit.inputMode}${runtimeAudit.conversion ? ` (${runtimeAudit.conversion})` : ''}`);
  }

  let preview = null;
  let validation = null;
  let coverage = null;
  if (input) {
    try {
      const runtime = await loadVizualRuntime();
      const previewInput = statefulVizualInputForPreview(input, body.previousToolCall);
      validation = runtime.validateVizualNativeInput(previewInput, {
        surfaceId: typeof toolArgs.surfaceId === 'string' ? toolArgs.surfaceId : undefined,
      });
      preview = runtime.previewVizualNativeInput(previewInput, {
        surfaceId: typeof toolArgs.surfaceId === 'string' ? toolArgs.surfaceId : undefined,
        fallbackText: typeof toolArgs.fallbackText === 'string' ? toolArgs.fallbackText : undefined,
      });
      if (!validation.ok) errors.push(...validation.issues.map(issue => `${issue.code}: ${issue.message}`));
      if (!preview.ok) errors.push('preview failed');
      coverage = typeof runtime.assertVizualAgentToolCoverage === 'function'
        ? runtime.assertVizualAgentToolCoverage({ userMessage, input: previewInput, preview, assistantText: text })
        : null;
      if (coverage) {
        const coverageErrors = coverage.issues.filter(issue => issue.severity === 'error');
        const coverageWarnings = coverage.issues.filter(issue => issue.severity !== 'error');
        const coverageGuidance = Array.isArray(coverage.qaGuidance) ? coverage.qaGuidance : [];
        errors.push(...coverageErrors.map(issue => `${issue.code}: ${issue.message}`));
        warnings.push(...coverageWarnings.map(issue => `${issue.code}: ${issue.message}`));
        warnings.push(...coverageGuidance.map(issue => `${issue.code}: ${issue.message}`));
      } else {
        errors.push(...assertRenderedSurfaceContract(preview));
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const uniqueErrors = uniqueStrings(errors);
  const uniqueWarnings = uniqueStrings(warnings);

  return {
    ok: uniqueErrors.length === 0,
    runId: `deerflow-sim-${Date.now().toString(36)}`,
    agent: agentName,
    command: {
      ok: commandResult.ok,
      exitCode: commandResult.code,
      durationMs: commandResult.durationMs,
      model: body.model || defaultModelForAgent(agentName),
      stderr: String(commandResult.stderr || '').slice(0, 8000),
      inputPromptMode: commandResult.inputPromptMode || promptAudit.promptMode,
      argvAudit: commandResult.argvAudit || null,
    },
    decision: {
      runtimeMode,
      promptMode: promptAudit.promptMode,
      promptInjected: promptAudit.promptInjected,
      boundary: 'agent-autonomous',
    },
    promptAudit,
    nativeInput: runtimeAudit ? {
      mode: runtimeAudit.inputMode || 'unknown',
      conversion: runtimeAudit.conversion || null,
    } : null,
    assistantText: text,
    toolCall,
    toolCalls,
    preview: preview ? {
      ok: preview.ok,
      mimeType: preview.mimeType,
      surfaceId: preview.surfaceId,
      fallbackText: preview.fallbackText,
      spec: preview.spec,
      artifact: preview.artifact,
      issues: preview.issues,
      summary: preview.summary,
    } : null,
    validation: validation ? {
      ok: validation.ok,
      surfaceId: validation.surfaceId,
      issues: validation.issues,
    } : null,
    coverage,
    raw: String(commandResult.stdout || '').slice(-100000),
    rawFull: String(commandResult.stdout || ''),
    warnings: uniqueWarnings,
    errors: uniqueErrors,
  };
}

async function handleDeerflowSim(req, res) {
  console.log(JSON.stringify({ event: 'deerflow-sim.request', method: req.method, at: new Date().toISOString() }));
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'POST required' });
    return;
  }

  const body = await readJsonBody(req).catch(() => ({}));
  const userMessage = String(body.message || '').trim();
  console.log(JSON.stringify({ event: 'deerflow-sim.body', length: userMessage.length, at: new Date().toISOString() }));
  if (!userMessage) {
    sendJson(res, 400, { ok: false, error: 'message required' });
    return;
  }

  const agentName = normalizeAgentName(body.agent);
  const context = {
    history: body.history,
    previousToolCall: body.previousToolCall,
  };
  const runtimeMode = normalizeRuntimeMode(body.runtimeMode);

  const prompt = runtimeMode === 'guided'
    ? buildDeerflowSimPrompt(userMessage, { ...context, agentName })
    : userMessage;
  console.log(JSON.stringify({ event: 'deerflow-sim.agent.start', agent: agentName, at: new Date().toISOString() }));
  const commandResult = agentName === 'codex'
    ? await runCodexPrompt(prompt, { model: body.model || defaultModelForAgent(agentName), timeoutMs: timeoutForAgent(agentName), runtimeMode })
    : agentName === 'pi-agent'
      ? await runPiPrompt(prompt, { model: body.model || defaultModelForAgent(agentName), timeoutMs: timeoutForAgent(agentName), runtimeMode })
    : runtimeMode === 'mcp'
      ? await runClaudeMcpPrompt(prompt, { model: body.model || defaultModelForAgent(agentName), timeoutMs: timeoutForAgent(agentName) })
    : await runCommand(claudeBin, [
      '-p',
      prompt,
      '--output-format',
      'json',
      '--no-session-persistence',
      '--permission-mode',
      'bypassPermissions',
      '--dangerously-skip-permissions',
      '--tools',
      'Read,Grep,Glob',
      '--disable-slash-commands',
      '--strict-mcp-config',
      '--mcp-config',
      '{"mcpServers":{}}',
      '--model',
      body.model || defaultModelForAgent(agentName),
    ], { timeoutMs: timeoutForAgent(agentName) });
  console.log(JSON.stringify({ event: 'deerflow-sim.agent.done', agent: agentName, ok: commandResult.ok, durationMs: commandResult.durationMs, at: new Date().toISOString() }));

  const responseBody = await buildDeerflowResponse({ body, userMessage, agentName, commandResult });
  await persistAgentDeerflowResponse(responseBody, agentName);
  delete responseBody.rawFull;
  console.log(JSON.stringify({ event: 'deerflow-sim.response', ok: responseBody.ok, errors: responseBody.errors, at: new Date().toISOString() }));
  sendJson(res, 200, responseBody);
}

async function handleDeerflowSimStream(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'POST required' });
    return;
  }

  const body = await readJsonBody(req).catch(() => ({}));
  const userMessage = String(body.message || '').trim();
  if (!userMessage) {
    sendJson(res, 400, { ok: false, error: 'message required' });
    return;
  }
  const agentName = normalizeAgentName(body.agent);
  const agentLabel = labelForAgent(agentName);
  const model = body.model || defaultModelForAgent(agentName);
  const context = {
    history: body.history,
    previousToolCall: body.previousToolCall,
  };
  const runtimeMode = normalizeRuntimeMode(body.runtimeMode);

  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store',
    connection: 'keep-alive',
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const runId = `deerflow-stream-${Date.now().toString(36)}`;
  sendEvent('run', { type: 'RUN_STARTED', runId, timestamp: Date.now() });
  sendEvent('state', { type: 'STATE_SNAPSHOT', snapshot: { phase: `${agentName}-cold-start`, agent: agentName, model, runtimeMode, boundary: 'agent-autonomous' } });
  sendEvent('message', { type: 'TEXT_MESSAGE_START', messageId: `${runId}-status`, role: 'assistant' });
  sendEvent('message', { type: 'TEXT_MESSAGE_CONTENT', messageId: `${runId}-status`, delta: `正在冷启动 ${agentLabel}，并让 Agent 自己决定是否调用 Vizual。` });
  sendEvent('message', { type: 'TEXT_MESSAGE_END', messageId: `${runId}-status` });

  try {
    let response;
    if (agentName === 'codex') {
      const prompt = runtimeMode === 'guided' ? buildDeerflowSimPrompt(userMessage, context) : userMessage;
      const commandResult = await runCodexPromptStreaming(prompt, {
        model,
        timeoutMs: timeoutForAgent(agentName),
        runtimeMode,
        onJsonEvent(event) {
          sendEvent('codex', { type: 'CODEX_JSON_EVENT', runId, event });
        },
      });
      response = await buildDeerflowResponse({ body, userMessage, agentName, commandResult });
      await persistAgentDeerflowResponse(response, agentName);
    } else {
      response = await fetch(`http://127.0.0.1:${port}/deerflow-sim/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then(upstream => upstream.json());
    }

    sendEvent('message', { type: 'TEXT_MESSAGE_START', messageId: `${runId}-assistant`, role: 'assistant' });
    const text = String(response.assistantText || '');
    const midpoint = Math.max(1, Math.floor(text.length / 2));
    sendEvent('message', { type: 'TEXT_MESSAGE_CONTENT', messageId: `${runId}-assistant`, delta: text.slice(0, midpoint) });
    sendEvent('message', { type: 'TEXT_MESSAGE_CHUNK', messageId: `${runId}-assistant`, delta: text.slice(midpoint) });
    sendEvent('message', { type: 'TEXT_MESSAGE_END', messageId: `${runId}-assistant` });

    if (response.toolCall?.arguments?.input) {
      const toolCallId = `${runId}-tool`;
      const argsText = JSON.stringify({ a2uiMessages: response.toolCall.arguments.input });
      sendEvent('tool', { type: 'TOOL_CALL_START', toolCallId, toolCallName: response.toolCall.name || 'present_vizual_ui' });
      const first = Math.max(1, Math.floor(argsText.length * 0.25));
      const second = Math.max(first + 1, Math.floor(argsText.length * 0.6));
      sendEvent('tool', { type: 'TOOL_CALL_ARGS', toolCallId, delta: argsText.slice(0, first) });
      sendEvent('tool', { type: 'TOOL_CALL_CHUNK', toolCallId, delta: argsText.slice(first, second) });
      sendEvent('tool', { type: 'TOOL_CALL_CHUNK', toolCallId, delta: argsText.slice(second) });
      sendEvent('tool', { type: 'TOOL_CALL_END', toolCallId });
      sendEvent('tool', { type: 'TOOL_CALL_RESULT', toolCallId, content: JSON.stringify({ ok: response.ok, surfaceId: response.preview?.surfaceId }) });
      const operations = response.toolCall.arguments.input;
      const activityMessageId = `${runId}-activity`;
      sendEvent('activity', {
        type: 'ACTIVITY_SNAPSHOT',
        messageId: activityMessageId,
        activityType: 'a2ui-surface',
        content: { a2ui_operations: operations },
      });
      const dataModelIndex = operations.findIndex(item => item && typeof item === 'object' && item.updateDataModel);
      if (dataModelIndex >= 0) {
        sendEvent('activity', {
          type: 'ACTIVITY_DELTA',
          messageId: activityMessageId,
          activityType: 'a2ui-surface',
          patch: [{ op: 'add', path: `/a2ui_operations/${dataModelIndex}/updateDataModel/value/__streamVerified`, value: true }],
        });
      }
    }

    sendEvent('response', { response });
    sendEvent('state', { type: 'STATE_DELTA', delta: [{ op: 'replace', path: '/phase', value: response.ok ? 'vizual-rendered' : 'agent-failed' }, { op: 'replace', path: '/durationMs', value: response.command?.durationMs || 0 }] });
    sendEvent('run', {
      type: response.ok ? 'RUN_FINISHED' : 'RUN_ERROR',
      runId,
      status: response.ok ? 'completed' : 'failed',
      error: response.ok ? undefined : (response.errors || []).join('; '),
      timestamp: Date.now(),
    });
  } catch (error) {
    sendEvent('run', {
      type: 'RUN_ERROR',
      runId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
    });
  } finally {
    res.end();
  }
}

async function handleMissionControl(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'POST required' });
    return;
  }
  await readJsonBody(req).catch(() => ({}));
  const startedAt = Date.now();
  const hermesPrompt = buildMissionPrompt('hermes');
  const claudePrompt = buildMissionPrompt('claude-code');
  const [hermesResult, claudeResult] = await Promise.all([
    runCommand(hermesBin, ['--ignore-rules', '-z', hermesPrompt], { timeoutMs: 120000 }),
    runCommand(claudeBin, [
      '-p',
      claudePrompt,
      '--output-format',
      'json',
      '--no-session-persistence',
      '--permission-mode',
      'bypassPermissions',
      '--dangerously-skip-permissions',
      '--tools',
      '',
      '--disable-slash-commands',
      '--strict-mcp-config',
      '--mcp-config',
      '{"mcpServers":{}}',
      '--model',
      'sonnet',
    ], { timeoutMs: 120000 }),
  ]);
  const agents = {
    hermes: normalizeAgent('hermes', hermesResult),
    claudeCode: normalizeAgent('claude-code', claudeResult),
  };
  sendJson(res, 200, {
    ok: agents.hermes.ok && agents.claudeCode.ok,
    runId: `mission-${Date.now().toString(36)}`,
    durationMs: Date.now() - startedAt,
    agents,
  });
}

export const __daemonAcceptanceInternals = {
  parseAgentEventTranscript,
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      send(res, 204, '', { 'content-type': 'text/plain; charset=utf-8' });
      return;
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`);
    if (url.pathname === '/mission-control/run') {
      await handleMissionControl(req, res);
      return;
    }
    if (url.pathname === '/deerflow-sim/run') {
      await handleDeerflowSim(req, res);
      return;
    }
    if (url.pathname === '/deerflow-sim/stream') {
      await handleDeerflowSimStream(req, res);
      return;
    }
    if (url.pathname.startsWith('/od-daemon/')) {
      await proxyDaemon(req, res, url);
      return;
    }

    const target = safeStaticPath(url.pathname);
    if (!target) return send(res, 403, 'Forbidden', { 'content-type': 'text/plain; charset=utf-8' });
    const stat = await fs.stat(target).catch(() => null);
    if (!stat?.isFile()) return send(res, 404, 'Not found', { 'content-type': 'text/plain; charset=utf-8' });
    const type = contentTypes.get(path.extname(target)) || 'application/octet-stream';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', ...corsHeaders });
    createReadStream(target).pipe(res);
  } catch (error) {
    if (res.headersSent) {
      res.destroy(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    send(res, 500, error instanceof Error ? error.stack || error.message : String(error), { 'content-type': 'text/plain; charset=utf-8' });
  }
});

if (process.argv[1] && import.meta.url === pathToFileUrl(process.argv[1]).href) {
  server.listen(port, '127.0.0.1', () => {
    console.log(JSON.stringify({
      ok: true,
      url: `http://127.0.0.1:${port}/validation/vizual-mission-control.html`,
      daemonUrl,
      rootDir,
    }, null, 2));
  });
}
