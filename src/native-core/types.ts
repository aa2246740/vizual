import type {
  A2UIAction,
  A2UIError,
  A2UIMessage,
} from '../a2ui/types'
import type {
  VizualArtifact,
  VizualSpec,
} from '../core/artifact'

export type VizualNativeProtocol = 'native' | 'a2ui' | 'ag-ui' | 'vizual'

export type VizualNativeComponentDef = {
  id: string
  component: string
  children?: string[] | { componentId: string; path: string }
  child?: string
  [key: string]: unknown
}

export type VizualNativeRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type VizualNativeRunState = {
  runId: string
  status: VizualNativeRunStatus
  snapshot?: Record<string, unknown>
  error?: string
  startedAt?: number
  finishedAt?: number
}

export type VizualNativeMessageRole =
  | 'developer'
  | 'system'
  | 'assistant'
  | 'user'
  | 'tool'
  | 'activity'
  | 'reasoning'
  | string

export type VizualNativeMessageState = {
  id: string
  role: VizualNativeMessageRole
  content?: unknown
  name?: string
  activityType?: string
  toolCallId?: string
  status: 'streaming' | 'complete'
  raw?: unknown
  createdAt: number
  updatedAt: number
}

export type VizualNativeFunctionCallState = {
  id: string
  surfaceId?: string
  functionName: string
  arguments?: Record<string, unknown>
  status: 'pending' | 'success' | 'error' | 'cancelled'
  result?: unknown
  error?: string
  createdAt: number
  updatedAt: number
}

export type VizualNativeSurfaceState = {
  surfaceId: string
  catalogId: string
  theme?: Record<string, unknown>
  components: Map<string, VizualNativeComponentDef>
  dataModel: Record<string, unknown>
  spec?: VizualSpec
  error?: A2UIError
}

export type VizualNativeQualitySeverity = 'info' | 'warning' | 'error'

export type VizualNativeQualityFinding = {
  id: string
  surfaceId?: string
  severity: VizualNativeQualitySeverity
  code: string
  message: string
  evidence?: Record<string, unknown>
  timestamp: number
}

export type VizualNativeSurfaceSnapshot = {
  surfaceId: string
  catalogId: string
  spec: VizualSpec
  artifact: VizualArtifact
  dataModel: Record<string, unknown>
  theme?: Record<string, unknown>
  error?: A2UIError
}

export type VizualNativeOperation =
  | { type: 'run.started'; runId?: string; timestamp?: number; raw?: unknown }
  | { type: 'run.finished'; runId?: string; status?: VizualNativeRunStatus; error?: string; timestamp?: number; raw?: unknown }
  | { type: 'run.stateSnapshot'; snapshot: Record<string, unknown>; raw?: unknown }
  | { type: 'run.stateDelta'; delta: unknown; raw?: unknown }
  | { type: 'message.started'; id: string; role?: VizualNativeMessageRole; name?: string; raw?: unknown }
  | { type: 'message.delta'; id?: string; role?: VizualNativeMessageRole; delta?: string; name?: string; raw?: unknown }
  | { type: 'message.finished'; id: string; raw?: unknown }
  | { type: 'messages.snapshot'; messages: VizualNativeMessageState[]; raw?: unknown }
  | { type: 'surface.create'; surfaceId: string; catalogId: string; theme?: Record<string, unknown>; raw?: unknown }
  | { type: 'surface.updateComponents'; surfaceId: string; components: VizualNativeComponentDef[]; raw?: unknown }
  | { type: 'surface.updateData'; surfaceId: string; path?: string; value?: unknown; raw?: unknown }
  | { type: 'surface.appendData'; surfaceId: string; path?: string; value?: unknown; raw?: unknown }
  | { type: 'surface.delete'; surfaceId: string; raw?: unknown }
  | { type: 'surface.reset'; surfaceId: string; raw?: unknown }
  | { type: 'surface.recovery'; surfaceId: string; action: 'retry' | 'fallback' | 'reset'; payload?: unknown; raw?: unknown }
  | { type: 'theme.update'; surfaceId: string; theme: Record<string, unknown>; raw?: unknown }
  | { type: 'function.call'; id?: string; surfaceId?: string; functionName: string; arguments?: Record<string, unknown>; raw?: unknown }
  | { type: 'function.result'; id?: string; actionId?: string; surfaceId?: string; status: 'success' | 'error' | 'cancelled'; result?: unknown; error?: string; raw?: unknown }
  | { type: 'action.emit'; action: A2UIAction; raw?: unknown }
  | { type: 'quality.report'; finding: Omit<VizualNativeQualityFinding, 'id' | 'timestamp'> & { id?: string; timestamp?: number }; raw?: unknown }
  | { type: 'artifact.ingest'; surfaceId: string; spec: VizualSpec; catalogId?: string; raw?: unknown }
  | { type: 'error.report'; error: A2UIError; raw?: unknown }

export type VizualNativeAgUiEvent = {
  type: string
  timestamp?: number
  [key: string]: unknown
}

export type VizualNativeInput =
  | VizualNativeOperation
  | VizualNativeInput[]
  | A2UIMessage
  | A2UIMessage[]
  | VizualNativeAgUiEvent
  | VizualSpec

export type VizualNativeCoreOptions = {
  defaultCatalogId?: string
  onSurfaceChange?: (snapshot: VizualNativeSurfaceSnapshot) => void
  onSpecChange?: (surfaceId: string, spec: VizualSpec) => void
  onArtifactChange?: (surfaceId: string, artifact: VizualArtifact) => void
  onAction?: (action: A2UIAction) => void
  onError?: (error: A2UIError) => void
  onSurfaceDelete?: (surfaceId: string) => void
  onQualityFinding?: (finding: VizualNativeQualityFinding) => void
  onFunctionCall?: (call: VizualNativeFunctionCallState) => void
  onMessage?: (message: VizualNativeMessageState) => void
}
