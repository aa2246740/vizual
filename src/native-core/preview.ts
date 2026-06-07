import { withDefaultElementProps } from '../core/spec-validation'
import type { VizualArtifact, VizualSpec } from '../core/artifact'
import { validateVizualNativeInput, type VizualValidateOptions, type VizualValidationIssue } from './validate'
import type { VizualNativeInput, VizualNativeSurfaceSnapshot } from './types'

export const VIZUAL_NATIVE_PREVIEW_MIME = 'application/vnd.vizual.preview+json'

export type VizualPreviewOptions = VizualValidateOptions & {
  fallbackText?: string
}

export type VizualPreviewResult = {
  ok: boolean
  mimeType: typeof VIZUAL_NATIVE_PREVIEW_MIME
  surfaceId: string
  fallbackText?: string
  snapshot: VizualNativeSurfaceSnapshot | null
  spec: VizualSpec | null
  artifact: VizualArtifact | null
  issues: VizualValidationIssue[]
  summary: {
    elementCount: number
    componentTypes: string[]
    functionCallCount: number
    messageCount: number
  }
}

export function previewVizualNativeInput(
  input: VizualNativeInput,
  options: VizualPreviewOptions = {},
): VizualPreviewResult {
  const validation = validateVizualNativeInput(input, options)
  const snapshot = validation.normalized.snapshot
  const spec = snapshot ? withDefaultElementProps(snapshot.spec) : null
  const elements = spec?.elements ?? {}
  const componentTypes = Array.from(new Set(
    Object.values(elements)
      .map(element => element?.type)
      .filter((type): type is string => typeof type === 'string' && type.length > 0),
  ))

  return {
    ok: validation.ok,
    mimeType: VIZUAL_NATIVE_PREVIEW_MIME,
    surfaceId: validation.surfaceId,
    fallbackText: options.fallbackText,
    snapshot,
    spec,
    artifact: snapshot?.artifact ?? null,
    issues: validation.issues,
    summary: {
      elementCount: Object.keys(elements).length,
      componentTypes,
      functionCallCount: validation.normalized.functionCalls.length,
      messageCount: validation.normalized.messages.length,
    },
  }
}
