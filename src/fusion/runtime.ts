import type { A2UIMessage } from '../a2ui/types'
import {
  VizualNativeCore,
  a2uiMessagesToVizualSnapshot as nativeA2uiMessagesToVizualSnapshot,
} from '../native-core'
import type {
  VIZUAL_AG_UI_EVENT_TYPES,
  VizualNativeAgUiEvent,
  VizualNativeCoreOptions,
  VizualNativeInput,
  VizualNativeQualityFinding,
  VizualNativeQualitySeverity,
  VizualNativeSurfaceSnapshot,
} from '../native-core'

/**
 * Compatibility name for older callers.
 *
 * Product semantics now live in VizualNativeCore. This class intentionally
 * contains no bridge/reducer logic.
 */
export class VizualFusionRuntime extends VizualNativeCore {
  constructor(options: VizualNativeCoreOptions = {}) {
    super(options)
  }
}

export function a2uiMessagesToVizualSnapshot(messages: A2UIMessage[]): VizualNativeSurfaceSnapshot | null {
  return nativeA2uiMessagesToVizualSnapshot(messages)
}

export type AGUIEvent = VizualNativeAgUiEvent
export type AGUIEventType = typeof VIZUAL_AG_UI_EVENT_TYPES[number]
export type VizualFusionInput = VizualNativeInput
export type VizualFusionQualityFinding = VizualNativeQualityFinding
export type VizualFusionQualitySeverity = VizualNativeQualitySeverity
export type VizualFusionRuntimeOptions = VizualNativeCoreOptions
export type VizualFusionSurfaceSnapshot = VizualNativeSurfaceSnapshot
