import type { A2UIError } from '../a2ui/types'
import { VizualNativeCore } from './core'
import type {
  VizualNativeCoreOptions,
  VizualNativeFunctionCallState,
  VizualNativeInput,
  VizualNativeMessageState,
  VizualNativeQualityFinding,
  VizualNativeRunState,
  VizualNativeSurfaceSnapshot,
} from './types'

export type VizualNormalizeOptions = Pick<VizualNativeCoreOptions, 'defaultCatalogId'> & {
  surfaceId?: string
}

export type VizualNormalizedResult = {
  ok: boolean
  surfaceId: string
  snapshot: VizualNativeSurfaceSnapshot | null
  snapshots: VizualNativeSurfaceSnapshot[]
  surfaceIds: string[]
  errors: A2UIError[]
  findings: VizualNativeQualityFinding[]
  functionCalls: VizualNativeFunctionCallState[]
  messages: VizualNativeMessageState[]
  runs: VizualNativeRunState[]
  runState: Record<string, unknown>
  nativeOperationLog: ReturnType<VizualNativeCore['getNativeOperationLog']>
}

export function normalizeVizualNativeInput(
  input: VizualNativeInput,
  options: VizualNormalizeOptions = {},
): VizualNormalizedResult {
  const snapshots: VizualNativeSurfaceSnapshot[] = []
  const errors: A2UIError[] = []
  const findings: VizualNativeQualityFinding[] = []

  const core = new VizualNativeCore({
    defaultCatalogId: options.defaultCatalogId,
    onSurfaceChange: snapshot => snapshots.push(snapshot),
    onError: error => errors.push(error),
    onQualityFinding: finding => findings.push(finding),
  })

  let directSnapshot: VizualNativeSurfaceSnapshot | null = null

  try {
    directSnapshot = core.dispatch(input, options.surfaceId)
  } catch (error) {
    errors.push({
      surfaceId: options.surfaceId ?? '',
      phase: 'render',
      message: error instanceof Error ? error.message : String(error),
      recoverable: false,
      timestamp: Date.now(),
    })
  }

  const surfaceIds = core.getSurfaceIds()
  const snapshot = directSnapshot ?? snapshots[snapshots.length - 1] ?? null
  const hasNativeState =
    Boolean(snapshot)
    || core.getFunctionCalls().length > 0
    || core.getMessages().length > 0
    || core.getRuns().length > 0
    || core.getNativeOperationLog().length > 0
  const surfaceId = snapshot?.surfaceId ?? options.surfaceId ?? surfaceIds[0] ?? ''

  return {
    ok: errors.length === 0 && hasNativeState,
    surfaceId,
    snapshot,
    snapshots,
    surfaceIds,
    errors,
    findings,
    functionCalls: core.getFunctionCalls(),
    messages: core.getMessages(),
    runs: core.getRuns(),
    runState: core.getRunState(),
    nativeOperationLog: core.getNativeOperationLog(),
  }
}
