import { resolveSchema } from './router'
import { createFallbackContainer } from './fallback'
import { applyTheme, setGlobalTheme, getTheme, getThemeNames, registerTheme, type Theme } from '../themes'
import type { SchemaHandler } from './types'

export { SchemaNotFoundError } from './errors'
export { resolveSchema, registerSchema, getRegisteredSchemaIds } from './router'
export { createFallbackContainer, isFallbackContainer } from './fallback'
export { applyTheme, setGlobalTheme, getTheme, getThemeNames, registerTheme }
export type { SchemaHandler, ParsedSchema } from './types'
export type { Theme } from '../themes'

export interface RenderOptions {
  theme?: string
  container?: HTMLElement
}

export function render(schemaId: string, input: unknown, options?: RenderOptions): HTMLElement {
  const container = options?.container || document.body
  
  // Apply theme if specified
  if (options?.theme) {
    applyTheme(container, options.theme)
  }
  
  try {
    const handler: SchemaHandler = resolveSchema(schemaId)
    const parsed = handler.parse(input)

    if (parsed.fallback || !parsed.valid) {
      return createFallbackContainer(input)
    }

    const result = handler.render(parsed)
    return result
  } catch {
    return createFallbackContainer(input)
  }
}
