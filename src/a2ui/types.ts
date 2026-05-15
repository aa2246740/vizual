/** A2UI message types — subset of A2UI v0.10 protocol used by Vizual bridge */

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

export type A2UIDeleteSurface = {
  surfaceId: string
}

/** 更新 surface 的 theme 配置（运行时主题切换） */
export type A2UIUpdateTheme = {
  surfaceId: string
  theme: Record<string, unknown>
}

/** A2UI 错误恢复消息 — Agent 可以指示前端如何恢复 */
export type A2UIErrorRecovery = {
  surfaceId: string
  action: 'retry' | 'fallback' | 'reset'
  /** retry 时附带的新消息；fallback 时附带兜底 VizualSpec；reset 清空 */
  payload?: unknown
}

export type A2UIMessage =
  | { version: 'v0.10'; createSurface: A2UICreateSurface }
  | { version: 'v0.10'; updateComponents: A2UIUpdateComponents }
  | { version: 'v0.10'; updateDataModel: A2UIUpdateDataModel }
  | { version: 'v0.10'; deleteSurface: A2UIDeleteSurface }
  | { version: 'v0.10'; updateTheme: A2UIUpdateTheme }
  | { version: 'v0.10'; errorRecovery: A2UIErrorRecovery }

export type A2UIAction = {
  name: string
  surfaceId: string
  sourceComponentId?: string
  context?: Record<string, unknown>
}

export type A2UIError = {
  surfaceId: string
  phase: 'create' | 'update' | 'data' | 'theme' | 'render'
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
