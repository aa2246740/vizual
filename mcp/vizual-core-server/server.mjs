#!/usr/bin/env node

const SERVER_NAME = 'vizual-core-mcp'
const SERVER_VERSION = '0.1.0'

let runtimePromise
let inputBuffer = Buffer.alloc(0)
let outputTransport = 'headers'

const UNSUPPLIED_EXTERNAL_BENCHMARK_RE = /(行业警戒线|监管预警线|监管关注线|预警线|红色预警线|红线|风险阈值|风控阈值|行业均值|行业平均|标准线|参考线|warning line|reference line|industry average|benchmark|threshold)/iu

const toolDefinitions = [
  {
    name: 'present_vizual_ui',
    description: 'Present a Vizual native UI surface to the host chat renderer when you decide the answer would be clearer or more actionable as an inline visual or interactive block. Keep ordinary prose in assistant text and put the structured UI payload in this tool call. Do not call for greetings, short text-only answers, ordinary conceptual Q&A, explicit creative requests such as webpages/games/custom HTML/code artifacts, or vague requests without data or a UI need. Arguments must be one JSON object with an input property; never pass an array of arguments. input may be semantic native shorthand such as {type:"kpi",metrics:[...]}, {type:"combo",data:[...],x:"month",series:[...]}, {type:"table",rows:[...]}, or a full Vizual/A2UI/AG-UI operation stream.',
    inputSchema: {
      type: 'object',
      required: ['input'],
      additionalProperties: false,
      properties: {
        input: { anyOf: [{ type: 'object' }, { type: 'array' }] },
        surfaceId: { type: 'string' },
        fallbackText: { type: 'string' },
        display: {
          type: 'object',
          additionalProperties: true,
          properties: {
            mode: { type: 'string' },
            title: { type: 'string' },
            persist: { type: 'boolean' },
          },
        },
        requireRenderable: { type: 'boolean' },
      },
    },
  },
  {
    name: 'vizual_catalog',
    description: 'Return the Vizual native catalog manifest, capability map, supported components, actions, and prompt examples for Agent UI generation. Use this before present_vizual_ui when you are unsure which semantic component fits a user request. The default response is compact; request detail:"full" or includeSchemas:true only when you need full JSON schemas.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        includeExamples: { type: 'boolean' },
        includeCompatibilityComponents: { type: 'boolean' },
        includeSchemas: { type: 'boolean' },
        detail: { enum: ['compact', 'full'] },
      },
    },
  },
  {
    name: 'vizual_normalize',
    description: 'Normalize Vizual native operations, A2UI messages, AG-UI events, or a Vizual spec into Vizual native runtime state.',
    inputSchema: {
      type: 'object',
      required: ['input'],
      additionalProperties: false,
      properties: {
        input: { anyOf: [{ type: 'object' }, { type: 'array' }] },
        surfaceId: { type: 'string' },
        defaultCatalogId: { type: 'string' },
      },
    },
  },
  {
    name: 'vizual_validate',
    description: 'Validate that agent UI input can produce a renderable Vizual surface and report concrete issues.',
    inputSchema: {
      type: 'object',
      required: ['input'],
      additionalProperties: false,
      properties: {
        input: { anyOf: [{ type: 'object' }, { type: 'array' }] },
        surfaceId: { type: 'string' },
        defaultCatalogId: { type: 'string' },
        requireRenderable: { type: 'boolean' },
      },
    },
  },
  {
    name: 'vizual_preview',
    description: 'Preview the renderable Vizual spec/artifact that a host chat renderer should mount.',
    inputSchema: {
      type: 'object',
      required: ['input'],
      additionalProperties: false,
      properties: {
        input: { anyOf: [{ type: 'object' }, { type: 'array' }] },
        surfaceId: { type: 'string' },
        defaultCatalogId: { type: 'string' },
        fallbackText: { type: 'string' },
        requireRenderable: { type: 'boolean' },
      },
    },
  },
]

async function createToolDefinitions() {
  const runtime = await loadRuntime()
  const presentTool = runtime.createVizualAgentToolDefinition({ includeCatalogManifest: false })
  const loosePresentSchema = toolDefinitions.find(tool => tool.name === 'present_vizual_ui')?.inputSchema
  return [
    {
      name: presentTool.name,
      description: `${presentTool.description} Tool arguments must be a single JSON object: { "input": ..., "surfaceId": "...", "display": { ... }, "fallbackText": "..." }. input may be semantic native shorthand such as {type:"kpi",metrics:[...]}, {type:"combo",data:[...],x:"month",series:[...]}, {type:"table",rows:[...]}, or a full Vizual/A2UI/AG-UI operation stream. Never call this tool with an array of separate argument objects.`,
      inputSchema: loosePresentSchema ?? presentTool.inputSchema,
    },
    ...toolDefinitions.filter(tool => tool.name !== 'present_vizual_ui'),
  ]
}

async function loadRuntime() {
  if (!runtimePromise) {
    runtimePromise = import(new URL('../../dist/index.mjs', import.meta.url)).catch(error => {
      throw new Error(`Unable to load Vizual runtime from dist/index.mjs. Run "npm run build" in the vizual package first. ${error instanceof Error ? error.message : String(error)}`)
    })
  }
  return runtimePromise
}

function send(message) {
  const json = JSON.stringify(message)
  if (outputTransport === 'jsonl') {
    process.stdout.write(`${json}\n`)
    return
  }
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n${json}`)
}

function sendResult(id, result) {
  if (id == null) return
  send({ jsonrpc: '2.0', id, result })
}

function sendError(id, code, message) {
  if (id == null) return
  send({ jsonrpc: '2.0', id, error: { code, message } })
}

function rpcTextResult(payload, isError = false) {
  return {
    isError,
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  }
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function compactJsonSchema(schema) {
  if (!isRecord(schema)) return {}
  const properties = isRecord(schema.properties) ? Object.keys(schema.properties) : []
  return {
    type: schema.type,
    required: Array.isArray(schema.required) ? schema.required : [],
    properties,
  }
}

function compactCatalogManifest(manifest) {
  const components = Object.fromEntries(
    Object.entries(manifest.components ?? {}).map(([name, definition]) => [
      name,
      {
        component: definition.component ?? name,
        description: definition.description ?? '',
        props: compactJsonSchema(definition.propsSchema),
        children: definition.children,
        emits: definition.emits,
        status: definition.status,
        agentFacing: definition.agentFacing,
        agentGuidance: definition.agentGuidance,
      },
    ]),
  )

  return {
    schema: manifest.schema,
    catalogId: manifest.catalogId,
    catalogVersion: manifest.catalogVersion,
    protocol: manifest.protocol,
    nativeCore: manifest.nativeCore,
    components,
    capabilities: manifest.capabilities,
    functions: manifest.functions,
    examples: manifest.examples,
  }
}

function normalizeToolArguments(rawArgs) {
  if (!Array.isArray(rawArgs)) return rawArgs
  const normalized = {}
  for (const item of rawArgs) {
    if (!isRecord(item)) continue
    if ('input' in item) {
      Object.assign(normalized, item)
      continue
    }
    if ('surfaceId' in item && typeof item.surfaceId === 'string') normalized.surfaceId = item.surfaceId
    if ('fallbackText' in item && typeof item.fallbackText === 'string') normalized.fallbackText = item.fallbackText
    if ('requireRenderable' in item && typeof item.requireRenderable === 'boolean') normalized.requireRenderable = item.requireRenderable
    const displayKeys = ['mode', 'title', 'persist']
    if (displayKeys.some(key => key in item)) {
      normalized.display = {
        ...(isRecord(normalized.display) ? normalized.display : {}),
        ...Object.fromEntries(displayKeys.filter(key => key in item).map(key => [key, item[key]])),
      }
    }
  }
  return normalized
}

function collectStringLeaves(value, out = []) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed) out.push(trimmed)
    return out
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectStringLeaves(item, out))
    return out
  }
  if (isRecord(value)) {
    Object.values(value).forEach(item => collectStringLeaves(item, out))
  }
  return out
}

function strictAgentFactIssues(input, preview) {
  const text = collectStringLeaves(preview?.spec ?? input).join('\n')
  if (!UNSUPPLIED_EXTERNAL_BENCHMARK_RE.test(text)) return []
  return [{
    severity: 'error',
    code: 'vizual.agent.unsupplied_external_benchmark',
    message: 'Vizual UI input contains an external benchmark/threshold/warning-line phrase. Remove it unless the user explicitly supplied that standard; describe risk only relative to the provided rows.',
  }]
}

function pickRuntimeOptions(args) {
  return {
    surfaceId: typeof args.surfaceId === 'string' ? args.surfaceId : undefined,
    defaultCatalogId: typeof args.defaultCatalogId === 'string' ? args.defaultCatalogId : undefined,
    requireRenderable: typeof args.requireRenderable === 'boolean' ? args.requireRenderable : undefined,
    fallbackText: typeof args.fallbackText === 'string' ? args.fallbackText : undefined,
  }
}

async function callTool(name, args) {
  args = normalizeToolArguments(args)
  if (name === 'vizual_catalog') {
    const runtime = await loadRuntime()
    const manifest = runtime.createVizualCatalogManifest({
      includeExamples: Boolean(args?.includeExamples),
      includeCompatibilityComponents: Boolean(args?.includeCompatibilityComponents),
    })
    const wantsFull = args?.includeSchemas === true || args?.detail === 'full'
    return rpcTextResult(wantsFull ? manifest : compactCatalogManifest(manifest))
  }

  if (!args || typeof args !== 'object' || Array.isArray(args) || !('input' in args)) {
    return rpcTextResult({ ok: false, error: 'Tool arguments must include input.' }, true)
  }

  const runtime = await loadRuntime()
  const options = pickRuntimeOptions(args)

  if (name === 'present_vizual_ui') {
    const validation = runtime.validateVizualNativeInput(args.input, options)
    const preview = runtime.previewVizualNativeInput(args.input, options)
    const strictFactIssues = strictAgentFactIssues(args.input, preview)
    const coverage = typeof runtime.assertVizualAgentToolCoverage === 'function'
      ? runtime.assertVizualAgentToolCoverage({ input: args.input, preview })
      : { ok: true, issues: [], componentTypes: preview?.summary?.componentTypes ?? [] }
    const ok = validation.ok && preview.ok && coverage.ok && strictFactIssues.length === 0
    return rpcTextResult({
      ok,
      error: ok ? undefined : 'Vizual UI did not pass native validation. Revise the tool input and call present_vizual_ui again.',
      toolCall: {
        name: 'present_vizual_ui',
        arguments: {
          surfaceId: typeof args.surfaceId === 'string' ? args.surfaceId : preview.surfaceId,
          fallbackText: typeof args.fallbackText === 'string' ? args.fallbackText : preview.fallbackText,
          display: args.display && typeof args.display === 'object' ? args.display : { mode: 'inline', persist: true },
          input: args.input,
        },
      },
      validation: {
        ok: validation.ok,
        surfaceId: validation.surfaceId,
        issues: validation.issues,
      },
      preview: {
        ok: preview.ok,
        surfaceId: preview.surfaceId,
        mimeType: preview.mimeType,
        fallbackText: preview.fallbackText,
        summary: preview.summary,
        issues: preview.issues,
        spec: preview.spec,
      },
      coverage,
      strictFactIssues,
    }, !ok)
  }

  if (name === 'vizual_normalize') {
    return rpcTextResult(runtime.normalizeVizualNativeInput(args.input, options))
  }
  if (name === 'vizual_validate') {
    return rpcTextResult(runtime.validateVizualNativeInput(args.input, options))
  }
  if (name === 'vizual_preview') {
    return rpcTextResult(runtime.previewVizualNativeInput(args.input, options))
  }

  return rpcTextResult({ ok: false, error: `Unknown tool: ${name}` }, true)
}

async function handleMessage(message) {
  if (!message || typeof message !== 'object') return
  const id = message.id

  try {
    if (message.method === 'initialize') {
      sendResult(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      })
      return
    }

    if (typeof message.method === 'string' && message.method.startsWith('notifications/')) {
      return
    }

    if (message.method === 'tools/list') {
      sendResult(id, { tools: await createToolDefinitions() })
      return
    }

    if (message.method === 'tools/call') {
      const params = message.params && typeof message.params === 'object' ? message.params : {}
      const result = await callTool(params.name, params.arguments ?? {})
      sendResult(id, result)
      return
    }

    sendError(id, -32601, `Method not found: ${message.method}`)
  } catch (error) {
    sendError(id, -32000, error instanceof Error ? error.message : String(error))
  }
}

function tryParseJsonLine() {
  const newline = inputBuffer.indexOf(10)
  if (newline < 0 || inputBuffer[0] !== 123) return false
  const line = inputBuffer.subarray(0, newline).toString('utf8').trim()
  if (!line) return false
  try {
    inputBuffer = inputBuffer.subarray(newline + 1)
    outputTransport = 'jsonl'
    void handleMessage(JSON.parse(line))
    return true
  } catch {
    return false
  }
}

function parseBufferedMessages() {
  while (inputBuffer.length) {
    const crlfEnd = inputBuffer.indexOf(Buffer.from('\r\n\r\n'))
    const lfEnd = inputBuffer.indexOf(Buffer.from('\n\n'))
    let headerEnd = -1
    let separatorLength = 0

    if (crlfEnd >= 0 && (lfEnd < 0 || crlfEnd <= lfEnd)) {
      headerEnd = crlfEnd
      separatorLength = 4
    } else if (lfEnd >= 0) {
      headerEnd = lfEnd
      separatorLength = 2
    }

    if (headerEnd < 0) {
      if (tryParseJsonLine()) continue
      return
    }

    const header = inputBuffer.subarray(0, headerEnd).toString('utf8')
    const match = /content-length:\s*(\d+)/i.exec(header)
    if (!match) {
      inputBuffer = inputBuffer.subarray(headerEnd + separatorLength)
      continue
    }

    const contentLength = Number(match[1])
    const bodyStart = headerEnd + separatorLength
    const bodyEnd = bodyStart + contentLength
    if (inputBuffer.length < bodyEnd) return

    const body = inputBuffer.subarray(bodyStart, bodyEnd).toString('utf8')
    inputBuffer = inputBuffer.subarray(bodyEnd)
    void handleMessage(JSON.parse(body))
  }
}

process.stdin.on('data', chunk => {
  inputBuffer = Buffer.concat([inputBuffer, chunk])
  parseBufferedMessages()
})

process.stdin.resume()
