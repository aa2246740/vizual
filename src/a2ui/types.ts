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

export type A2UIMessage =
  | { version: 'v0.10'; createSurface: A2UICreateSurface }
  | { version: 'v0.10'; updateComponents: A2UIUpdateComponents }
  | { version: 'v0.10'; updateDataModel: A2UIUpdateDataModel }
  | { version: 'v0.10'; deleteSurface: A2UIDeleteSurface }

export type A2UIAction = {
  name: string
  surfaceId: string
  sourceComponentId?: string
  context?: Record<string, unknown>
}

export type A2UISurfaceState = {
  surfaceId: string
  catalogId: string
  theme?: Record<string, unknown>
  components: Map<string, A2UIComponentDef>
  dataModel: Record<string, unknown>
}
