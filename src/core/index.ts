import { resolveSchema } from './router'
import { createFallbackContainer } from './fallback'
import { applyTheme, setGlobalTheme, getTheme, getThemeNames, registerTheme, type Theme } from '../themes'
import type { SchemaHandler } from './types'

export { SchemaNotFoundError } from './errors'
export { resolveSchema, registerSchema, getRegisteredSchemaIds } from './router'
export { createFallbackContainer, isFallbackContainer } from './fallback'
export {
  applyArtifactPatch,
  cloneJson,
  createArtifact,
  createExportRecord,
  extractTargetMap,
  getArtifactElement,
  getArtifactTarget,
  isVizualArtifact,
  isVizualSpec,
  markArtifactError,
  markArtifactRendered,
  normalizeArtifact,
  summarizeSpec,
} from './artifact'
export { applyTheme, setGlobalTheme, getTheme, getThemeNames, registerTheme }
export type { SchemaHandler, ParsedSchema } from './types'
export type {
  CreateVizualArtifactInput,
  VizualArtifact,
  VizualArtifactKind,
  VizualArtifactPatch,
  VizualArtifactSource,
  VizualArtifactStatus,
  VizualArtifactTheme,
  VizualArtifactVersion,
  VizualExportFormat,
  VizualExportRecord,
  VizualSpec,
  VizualSpecElement,
  VizualTarget,
  VizualTargetType,
} from './artifact'
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
    
    // If a container was provided and theme was set, apply theme to result
    if (options?.container && options?.theme) {
      applyTheme(result, options.theme)
    }
    
    return result
  } catch {
    return createFallbackContainer(input)
  }
}
