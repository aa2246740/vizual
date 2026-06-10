import {
  VIZUAL_AGENT_TOOL_NAME,
  isVizualAgentEnvelope,
  type VizualAgentDisplayHint,
} from './agent-helper'
import {
  VIZUAL_NATIVE_PREVIEW_MIME,
  previewVizualNativeInput,
  type VizualNativeInput,
  type VizualPreviewResult,
  type VizualValidationIssue,
} from './native-core'

/**
 * The single directive a host should act on for one Vizual tool call. A host
 * must render exactly ONE of: the Vizual surface (`rendered`), the text
 * fallback (`fallback`), or nothing (`suppressed`). This prevents showing a
 * loader + error + fallback bubble all at once for the same turn.
 */
export type VizualPresentationOutcome = 'rendered' | 'fallback' | 'suppressed'

export type VizualChatPresentation = {
  id: string
  toolCallId?: string
  surfaceId?: string
  accepted: boolean
  renderable: boolean
  /** What the host should do for this tool call. See VizualPresentationOutcome. */
  outcome: VizualPresentationOutcome
  input: unknown
  fallbackText?: string
  display?: VizualAgentDisplayHint & Record<string, unknown>
  result?: unknown
  preview?: VizualPreviewResult
  /** Diagnostic issues for the agent-repair loop only — never a user-facing bubble. */
  issues?: unknown[]
}

function resolvePresentationOutcome(
  accepted: boolean,
  renderable: boolean,
  fallbackText: string | undefined,
): VizualPresentationOutcome {
  if (accepted && renderable) return 'rendered'
  if (typeof fallbackText === 'string' && fallbackText.trim().length > 0) return 'fallback'
  return 'suppressed'
}

export type VizualChatAdapterMessage = Record<string, unknown>

type ToolCallLike = {
  id?: string
  name?: string
  args?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function messageKind(message: VizualChatAdapterMessage): string {
  return String(message.role ?? message.type ?? '')
}

function textContent(message: VizualChatAdapterMessage): string {
  const content = message.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(part => isRecord(part) && typeof part.text === 'string' ? part.text : '')
      .join('\n')
      .trim()
  }
  return ''
}

function toolCallId(message: VizualChatAdapterMessage): string | undefined {
  return [
    message.tool_call_id,
    message.toolCallId,
    message.toolCallID,
    message.id,
  ].find((value): value is string => typeof value === 'string' && value.length > 0)
}

function collectToolResults(messages: VizualChatAdapterMessage[]): Map<string, unknown> {
  const results = new Map<string, unknown>()
  for (const message of messages) {
    const kind = messageKind(message)
    if (kind !== 'tool' && kind !== 'tool_result') continue
    const id = toolCallId(message)
    if (!id) continue
    results.set(id, parseMaybeJson(textContent(message) || message.content))
  }
  return results
}

function normalizeToolCall(call: unknown): ToolCallLike | null {
  if (!isRecord(call)) return null
  const fn = isRecord(call.function) ? call.function : undefined
  const name = [
    call.name,
    fn?.name,
    call.toolName,
  ].find((value): value is string => typeof value === 'string' && value.length > 0)
  const args = parseMaybeJson(call.args ?? call.arguments ?? call.input ?? fn?.arguments)
  return {
    id: typeof call.id === 'string' ? call.id : undefined,
    name,
    args,
  }
}

function toolCalls(message: VizualChatAdapterMessage): ToolCallLike[] {
  const raw = [
    message.tool_calls,
    message.toolCalls,
    isRecord(message.additional_kwargs) ? message.additional_kwargs.tool_calls : undefined,
  ].find(Array.isArray)
  return Array.isArray(raw)
    ? raw.map(normalizeToolCall).filter((call): call is ToolCallLike => Boolean(call))
    : []
}

function resultEnvelope(args: Record<string, unknown>, result: unknown): Record<string, unknown> | undefined {
  const resultRecord = isRecord(result) ? result : undefined
  if (isRecord(resultRecord?.envelope)) return resultRecord.envelope
  if (isRecord(args.envelope)) return args.envelope
  return undefined
}

function previewPresentationInput(input: unknown, surfaceId?: string): VizualPreviewResult {
  try {
    return previewVizualNativeInput(input as VizualNativeInput, { surfaceId })
  } catch (error) {
    const issue: VizualValidationIssue = {
      severity: 'error',
      code: 'vizual.preview_failed',
      message: error instanceof Error ? error.message : String(error),
      surfaceId,
      evidence: error,
    }
    return {
      ok: false,
      mimeType: VIZUAL_NATIVE_PREVIEW_MIME,
      surfaceId: surfaceId ?? '',
      snapshot: null,
      spec: null,
      artifact: null,
      issues: [issue],
      summary: {
        elementCount: 0,
        componentTypes: [],
        functionCallCount: 0,
        messageCount: 0,
      },
    }
  }
}

function collectPresentationIssues(resultRecord: Record<string, unknown>, preview: VizualPreviewResult): unknown[] | undefined {
  const issues = [
    ...(Array.isArray(resultRecord.issues) ? resultRecord.issues : []),
    ...preview.issues,
  ]
  return issues.length ? issues : undefined
}

export function extractVizualPresentations(
  messages: Array<VizualChatAdapterMessage | unknown>,
): VizualChatPresentation[] {
  const normalizedMessages = messages.filter(isRecord)
  const toolResults = collectToolResults(normalizedMessages)
  const presentations: VizualChatPresentation[] = []

  for (const message of normalizedMessages) {
    const kind = messageKind(message)
    if (kind !== 'assistant' && kind !== 'ai') continue

    for (const call of toolCalls(message)) {
      if (call.name !== VIZUAL_AGENT_TOOL_NAME) continue
      const args = isRecord(call.args) ? call.args : {}
      const result = call.id ? toolResults.get(call.id) : undefined
      const resultRecord = isRecord(result) ? result : {}
      const envelope = resultEnvelope(args, result)
      const input = envelope?.input ?? args.input
      if (input === undefined) continue
      const display = parseMaybeJson(envelope?.display ?? args.display)
      const surfaceId = [
        envelope?.surfaceId,
        args.surfaceId,
        resultRecord.surfaceId,
      ].find((value): value is string => typeof value === 'string' && value.length > 0)
      const preview = previewPresentationInput(input, surfaceId)
      const resultAccepted = resultRecord.ok === true || (result === undefined && isVizualAgentEnvelope(envelope))
      const renderable = preview.ok && Boolean(preview.spec)
      const accepted = resultAccepted && renderable
      const fallbackText = [
        envelope?.fallbackText,
        args.fallbackText,
        resultRecord.fallbackText,
      ].find((value): value is string => typeof value === 'string')

      presentations.push({
        id: call.id ? `tool:${call.id}` : surfaceId ? `surface:${surfaceId}` : `vizual:${presentations.length}`,
        toolCallId: call.id,
        surfaceId,
        accepted,
        renderable,
        outcome: resolvePresentationOutcome(accepted, renderable, fallbackText),
        input,
        fallbackText,
        display: isRecord(display) ? display as VizualChatPresentation['display'] : undefined,
        result,
        preview,
        issues: collectPresentationIssues(resultRecord, preview),
      })
    }
  }

  return presentations
}

export function selectRenderableVizualPresentations(
  presentations: VizualChatPresentation[],
): VizualChatPresentation[] {
  return presentations.filter(presentation => presentation.accepted && presentation.renderable)
}

export function selectVisibleVizualPresentations(
  presentations: VizualChatPresentation[],
): VizualChatPresentation[] {
  return selectRenderableVizualPresentations(presentations)
}

/**
 * Fallback texts for presentations that did NOT render, so the host can show a
 * single text bubble instead of a broken/empty Vizual card. Returns one entry
 * per `outcome: 'fallback'` presentation; `suppressed` ones yield nothing.
 */
export function selectVizualFallbackTexts(
  presentations: VizualChatPresentation[],
): string[] {
  return presentations
    .filter(presentation => presentation.outcome === 'fallback')
    .map(presentation => presentation.fallbackText)
    .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
}

export function buildVizualActionMessage(options: {
  presentation: Pick<VizualChatPresentation, 'surfaceId' | 'toolCallId'>
  action: string
  params?: Record<string, unknown>
  currentState?: Record<string, unknown>
}): string {
  return [
    'The user triggered an action in a Vizual inline UI. Treat it as the latest user input.',
    '',
    `surfaceId: ${options.presentation.surfaceId ?? '(unknown)'}`,
    `action: ${options.action}`,
    '',
    'Payload:',
    '```json',
    JSON.stringify({
      source: 'vizual',
      surfaceId: options.presentation.surfaceId,
      toolCallId: options.presentation.toolCallId,
      action: options.action,
      params: options.params ?? {},
      currentState: options.currentState ?? {},
    }, null, 2),
    '```',
  ].join('\n')
}

export function isInternalVizualActionMessage(message: unknown): boolean {
  if (!isRecord(message)) return false
  const kind = messageKind(message)
  if (kind !== 'user' && kind !== 'human') return false
  const text = textContent(message)
  return text.startsWith('The user triggered an action in a Vizual inline UI.')
    && text.includes('surfaceId:')
    && text.includes('action:')
}
