/** A2UI message types used by the Vizual bridge. */

export type A2UIProtocolVersion = 'v0.9' | 'v0.10'

export type A2UIDynamicValue =
  | string
  | number
  | boolean
  | unknown[]
  | { path: string }
  | { call: string; args?: Record<string, unknown>; returnType?: string }

export type A2UIComponentDef = {
  id: string
  component: string
  children?: string[] | { componentId: string; path: string }
  child?: string
  [key: string]: unknown
}

export type A2UICreateSurface = {
  surfaceId: string
  catalogId: string
  theme?: Record<string, unknown>
  sendDataModel?: boolean
}

export type A2UIUpdateComponents = {
  surfaceId: string
  components: A2UIComponentDef[]
}

export type A2UIUpdateDataModel = {
  surfaceId: string
  path?: string
  value?: unknown
}

export type A2UIAppendDataModel = {
  surfaceId: string
  path?: string
  value?: unknown
}

export type A2UIDeleteSurface = {
  surfaceId: string
}

export type A2UICallFunction = {
  surfaceId?: string
  functionName: string
  arguments?: Record<string, unknown>
}

export type A2UIActionResponse = {
  surfaceId?: string
  actionId?: string
  status: 'success' | 'error' | 'cancelled'
  result?: unknown
  error?: string
}

/** Vizual extension: 更新 surface 的 theme 配置（运行时主题切换） */
export type A2UIUpdateTheme = {
  surfaceId: string
  theme: Record<string, unknown>
}

/** Vizual extension: Agent 可以指示前端如何恢复 */
export type A2UIErrorRecovery = {
  surfaceId: string
  action: 'retry' | 'fallback' | 'reset'
  /** retry 时附带的新消息；fallback 时附带兜底 VizualSpec；reset 清空 */
  payload?: unknown
}

export type A2UIStandardMessage =
  | { version: A2UIProtocolVersion; createSurface: A2UICreateSurface }
  | { version: A2UIProtocolVersion; updateComponents: A2UIUpdateComponents }
  | { version: A2UIProtocolVersion; updateDataModel: A2UIUpdateDataModel }
  | { version: A2UIProtocolVersion; appendDataModel: A2UIAppendDataModel }
  | { version: A2UIProtocolVersion; deleteSurface: A2UIDeleteSurface }
  | { version: 'v0.10'; callFunction: A2UICallFunction; functionCallId?: string }
  | { version: 'v0.10'; actionResponse: A2UIActionResponse; actionId?: string }

export type VizualA2UIExtensionMessage =
  | { version: A2UIProtocolVersion; updateTheme: A2UIUpdateTheme }
  | { version: A2UIProtocolVersion; errorRecovery: A2UIErrorRecovery }

export type A2UIMessage = A2UIStandardMessage | VizualA2UIExtensionMessage

export type A2UIAction = {
  name: string
  surfaceId: string
  sourceComponentId?: string
  context?: Record<string, unknown>
}

export type A2UIError = {
  surfaceId: string
  phase: 'create' | 'update' | 'data' | 'theme' | 'function' | 'action' | 'render'
  message: string
  recoverable: boolean
  timestamp: number
}

export type A2UISurfaceState = {
  surfaceId: string
  catalogId: string
  theme?: Record<string, unknown>
  components: Map<string, A2UIComponentDef>
  dataModel: Record<string, unknown>
  error?: A2UIError
}

/** Bridge 配置 */
export type A2UIBridgeOptions = {
  /** VizualSpec 更新回调 — surface 内容变化时触发 */
  onChange?: (surfaceId: string, spec: import('../core/artifact').VizualSpec) => void
  /** 客户端→Agent action 回调 — FormBuilder 提交、Widget 交互等 */
  onAction?: (action: A2UIAction) => void
  /** 错误回调 — 渲染或协议处理出错时触发 */
  onError?: (error: A2UIError) => void
  /** Surface 被删除回调 */
  onSurfaceDelete?: (surfaceId: string) => void
}
