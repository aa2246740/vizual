import type { ParsedSchema } from '../../core/types'

export interface JsonViewerConfig {
  maxDepth: number
  collapsedByDefault: boolean
  showLineNumbers: boolean
  syntaxTheme: 'dark' | 'light'
}

export interface JsonViewerParsed extends ParsedSchema {
  data: Record<string, unknown>
  config: JsonViewerConfig
}

const defaultConfig: JsonViewerConfig = {
  maxDepth: 5,
  collapsedByDefault: false,
  showLineNumbers: true,
  syntaxTheme: 'dark',
}

export function parseJsonViewerSchema(input: unknown): JsonViewerParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, data: null, fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (obj.data === undefined || obj.data === null) {
    return { valid: false, data: null, fallback: true, originalInput: input }
  }

  if (typeof obj.data !== 'object' || Array.isArray(obj.data)) {
    return { valid: false, data: null, fallback: true, originalInput: input }
  }

  const rawConfig = (obj.config as Partial<JsonViewerConfig>) || {}
  const config: JsonViewerConfig = {
    maxDepth: typeof rawConfig.maxDepth === 'number' ? rawConfig.maxDepth : defaultConfig.maxDepth,
    collapsedByDefault: typeof rawConfig.collapsedByDefault === 'boolean' ? rawConfig.collapsedByDefault : defaultConfig.collapsedByDefault,
    showLineNumbers: typeof rawConfig.showLineNumbers === 'boolean' ? rawConfig.showLineNumbers : defaultConfig.showLineNumbers,
    syntaxTheme: rawConfig.syntaxTheme === 'light' ? 'light' : defaultConfig.syntaxTheme,
  }

  return {
    valid: true,
    data: obj.data as Record<string, unknown>,
    config,
  }
}
