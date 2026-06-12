#!/usr/bin/env node

import { createVizualAgentToolResult } from '../dist/index.mjs'

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => {
      input += chunk
    })
    process.stdin.on('end', () => resolve(input))
    process.stdin.on('error', reject)
  })
}

function errorResult(message) {
  return {
    schema: 'vizual.agent.tool_result.v1',
    ok: false,
    toolName: 'present_vizual_ui',
    fallbackText: '',
    display: { mode: 'inline', persist: true },
    issues: [{
      severity: 'error',
      code: 'vizual.agent_tool_result_cli',
      message,
      fix: 'Call vizual-agent-tool-result with JSON stdin: {"input":{...},"surfaceId":"optional","fallbackText":"optional","display":{"mode":"inline","persist":true}}.',
    }],
    fixes: [{
      code: 'vizual.agent_tool_result_cli',
      fix: 'Call vizual-agent-tool-result with JSON stdin: {"input":{...},"surfaceId":"optional","fallbackText":"optional","display":{"mode":"inline","persist":true}}.',
    }],
    repairs: [],
    renderEvidence: {
      elementCount: 0,
      componentTypes: [],
      functionCallCount: 0,
      messageCount: 0,
    },
    envelope: undefined,
  }
}

try {
  const raw = await readStdin()
  const args = JSON.parse(raw)
  if (!isRecord(args) || !('input' in args)) {
    console.log(JSON.stringify(errorResult('Tool arguments must be a JSON object with an input property.')))
    process.exit(0)
  }
  const result = createVizualAgentToolResult(args.input, {
    surfaceId: typeof args.surfaceId === 'string' ? args.surfaceId : undefined,
    fallbackText: typeof args.fallbackText === 'string' ? args.fallbackText : undefined,
    display: isRecord(args.display) ? args.display : { mode: 'inline', persist: true },
  })
  console.log(JSON.stringify(result))
} catch (error) {
  console.log(JSON.stringify(errorResult(error instanceof Error ? error.message : String(error))))
}
