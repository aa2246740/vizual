import type { VizualNativeCore } from './core'
import type {
  VizualNativeInput,
  VizualNativeSurfaceSnapshot,
} from './types'

export type VizualNativeStreamFormat = 'auto' | 'jsonl' | 'sse'

export type VizualNativeStreamRecord = {
  format: Exclude<VizualNativeStreamFormat, 'auto'>
  event?: string
  data: unknown
  raw: string
}

export type VizualNativeStreamReaderOptions = {
  format?: VizualNativeStreamFormat
  defaultMessageId?: string
  surfaceId?: string
  onRecord?: (record: VizualNativeStreamRecord) => void
  onInput?: (input: VizualNativeInput, record: VizualNativeStreamRecord) => void
  onSnapshot?: (snapshot: VizualNativeSurfaceSnapshot, record: VizualNativeStreamRecord) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseJsonMaybe(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed || trimmed === '[DONE]') return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function looksLikeUnparsedJson(record: VizualNativeStreamRecord): boolean {
  return typeof record.data === 'string'
    && record.data.trim() === record.raw.trim()
    && /^[\[{]/.test(record.raw.trim())
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function normalizeStreamPayload(data: unknown, defaultMessageId: string): VizualNativeInput | null {
  const parsed = parseJsonMaybe(data)
  if (parsed == null) return null

  if (typeof parsed === 'string') {
    return {
      type: 'TEXT_MESSAGE_CHUNK',
      messageId: defaultMessageId,
      role: 'assistant',
      delta: parsed,
    }
  }

  if (!isRecord(parsed)) return parsed as VizualNativeInput

  if (isRecord(parsed.data)) return normalizeStreamPayload(parsed.data, defaultMessageId)
  if (typeof parsed.data === 'string' && Object.keys(parsed).length <= 3) {
    const nested = normalizeStreamPayload(parsed.data, defaultMessageId)
    if (nested) return nested
  }

  const choice = Array.isArray(parsed.choices) && isRecord(parsed.choices[0])
    ? parsed.choices[0] as Record<string, unknown>
    : null
  const delta = choice && isRecord(choice.delta) ? choice.delta : null
  const content = stringValue(delta?.content)
  if (content) {
    return {
      type: 'TEXT_MESSAGE_CHUNK',
      messageId: defaultMessageId,
      role: 'assistant',
      delta: content,
      raw: parsed,
    }
  }

  const responseType = stringValue(parsed.type)
  if (responseType === 'response.output_text.delta') {
    return {
      type: 'TEXT_MESSAGE_CHUNK',
      messageId: defaultMessageId,
      role: 'assistant',
      delta: stringValue(parsed.delta) ?? '',
      raw: parsed,
    }
  }

  if (responseType === 'response.output_text.done' || responseType === 'message_stop') {
    return { type: 'TEXT_MESSAGE_END', messageId: defaultMessageId, raw: parsed }
  }

  return parsed as VizualNativeInput
}

export class VizualNativeStreamReader {
  private core: VizualNativeCore
  private options: VizualNativeStreamReaderOptions
  private jsonlBuffer = ''
  private sseBuffer = ''
  private messageId: string

  constructor(core: VizualNativeCore, options: VizualNativeStreamReaderOptions = {}) {
    this.core = core
    this.options = options
    this.messageId = options.defaultMessageId ?? 'stream-message'
  }

  write(chunk: string | Uint8Array): VizualNativeSurfaceSnapshot[] {
    const text = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk)
    if (!text) return []
    const format = this.resolveFormat(text)
    return format === 'sse' ? this.writeSse(text) : this.writeJsonl(text)
  }

  end(): VizualNativeSurfaceSnapshot[] {
    const snapshots: VizualNativeSurfaceSnapshot[] = []
    if (this.sseBuffer.trim()) {
      snapshots.push(...this.processSseBlock(this.sseBuffer))
      this.sseBuffer = ''
    }
    if (this.jsonlBuffer.trim()) {
      const record: VizualNativeStreamRecord = {
        format: 'jsonl',
        raw: this.jsonlBuffer,
        data: parseJsonMaybe(this.jsonlBuffer),
      }
      snapshots.push(...this.dispatchRecord(record))
      this.jsonlBuffer = ''
    }
    return snapshots
  }

  reset() {
    this.jsonlBuffer = ''
    this.sseBuffer = ''
  }

  private resolveFormat(chunk: string): Exclude<VizualNativeStreamFormat, 'auto'> {
    if (this.options.format === 'jsonl' || this.options.format === 'sse') return this.options.format
    if (/^\s*(event|data|id|retry):/m.test(this.sseBuffer + chunk)) return 'sse'
    return 'jsonl'
  }

  private writeJsonl(text: string): VizualNativeSurfaceSnapshot[] {
    this.jsonlBuffer += text
    const lines = this.jsonlBuffer.split(/\r?\n/)
    this.jsonlBuffer = lines.pop() ?? ''
    const snapshots: VizualNativeSurfaceSnapshot[] = []
    for (const line of lines) {
      if (!line.trim()) continue
      const record: VizualNativeStreamRecord = {
        format: 'jsonl',
        raw: line,
        data: parseJsonMaybe(line),
      }
      snapshots.push(...this.dispatchRecord(record))
    }
    return snapshots
  }

  private writeSse(text: string): VizualNativeSurfaceSnapshot[] {
    this.sseBuffer += text
    const blocks = this.sseBuffer.split(/\r?\n\r?\n/)
    this.sseBuffer = blocks.pop() ?? ''
    return blocks.flatMap(block => this.processSseBlock(block))
  }

  private processSseBlock(block: string): VizualNativeSurfaceSnapshot[] {
    const lines = block.split(/\r?\n/)
    let event: string | undefined
    const dataLines: string[] = []
    for (const line of lines) {
      if (!line || line.startsWith(':')) continue
      const index = line.indexOf(':')
      const field = index >= 0 ? line.slice(0, index) : line
      const value = index >= 0 ? line.slice(index + 1).replace(/^ /, '') : ''
      if (field === 'event') event = value
      if (field === 'data') dataLines.push(value)
    }
    if (!dataLines.length) return []
    const raw = dataLines.join('\n')
    const record: VizualNativeStreamRecord = {
      format: 'sse',
      event,
      raw,
      data: parseJsonMaybe(raw),
    }
    return this.dispatchRecord(record)
  }

  private dispatchRecord(record: VizualNativeStreamRecord): VizualNativeSurfaceSnapshot[] {
    this.options.onRecord?.(record)
    if (looksLikeUnparsedJson(record)) return []
    const input = normalizeStreamPayload(record.data, this.messageId)
    if (!input) return []
    this.options.onInput?.(input, record)
    const snapshot = this.core.dispatch(input, this.options.surfaceId ?? 'surface-1')
    if (!snapshot) return []
    this.options.onSnapshot?.(snapshot, record)
    return [snapshot]
  }
}

export function createVizualNativeStreamReader(
  core: VizualNativeCore,
  options?: VizualNativeStreamReaderOptions,
): VizualNativeStreamReader {
  return new VizualNativeStreamReader(core, options)
}
