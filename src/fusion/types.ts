import type { VIZUAL_AG_UI_EVENT_TYPES, VizualNativeAgUiEvent } from '../native-core'

export type AGUIEvent = VizualNativeAgUiEvent
export type AGUIEventType = typeof VIZUAL_AG_UI_EVENT_TYPES[number]

export type {
  VizualNativeCoreOptions as VizualFusionRuntimeOptions,
  VizualNativeInput as VizualFusionInput,
  VizualNativeQualityFinding as VizualFusionQualityFinding,
  VizualNativeQualitySeverity as VizualFusionQualitySeverity,
  VizualNativeSurfaceSnapshot as VizualFusionSurfaceSnapshot,
} from '../native-core'
