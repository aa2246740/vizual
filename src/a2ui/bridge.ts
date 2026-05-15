import type {
  A2UIMessage,
  A2UISurfaceState,
  A2UIComponentDef,
  A2UIDynamicValue,
  A2UIAction,
  A2UIError,
  A2UIBridgeOptions,
} from './types'
import type { VizualSpec } from '../core/artifact'

/**
 * A2UI → Vizual bridge.
 *
 * 接收 A2UI v0.10 消息流（createSurface / updateComponents / updateDataModel / updateTheme / errorRecovery），
 * 维护 surface 状态，输出 VizualSpec 供 VizualRenderer 渲染。
 *
 * 支持：
 * - 完整 A2UI 消息生命周期管理
 * - Action 回调（FormBuilder 提交 → onAction）
 * - 运行时主题切换
 * - Error recovery（retry / fallback / reset）
 * - 状态订阅与同步
 */
export class A2UIBridge {
  private surfaces = new Map<string, A2UISurfaceState>()
  private options: A2UIBridgeOptions
  private actionSubscribers = new Set<(action: A2UIAction) => void>()

  constructor(options: A2UIBridgeOptions = {}) {
    this.options = options
  }

  /** 处理一条 A2UI 消息，返回更新后的 VizualSpec（如果有） */
  processMessage(msg: A2UIMessage): VizualSpec | null {
    try {
      if ('createSurface' in msg) {
        return this.handleCreateSurface(msg.createSurface)
      }
      if ('updateComponents' in msg) {
        return this.handleUpdateComponents(msg.updateComponents)
      }
      if ('updateDataModel' in msg) {
        return this.handleUpdateDataModel(msg.updateDataModel)
      }
      if ('deleteSurface' in msg) {
        return this.handleDeleteSurface(msg.deleteSurface.surfaceId)
      }
      if ('updateTheme' in msg) {
        return this.handleUpdateTheme(msg.updateTheme)
      }
      if ('errorRecovery' in msg) {
        return this.handleErrorRecovery(msg.errorRecovery)
      }
      return null
    } catch (e) {
      this.emitError({
        surfaceId: this.guessSurfaceId(msg),
        phase: 'update',
        message: e instanceof Error ? e.message : String(e),
        recoverable: true,
        timestamp: Date.now(),
      })
      return null
    }
  }

  /** 批量处理消息序列（A2UI 标准用法） */
  processMessages(messages: A2UIMessage[]): VizualSpec | null {
    let lastSpec: VizualSpec | null = null
    for (const msg of messages) {
      const spec = this.processMessage(msg)
      if (spec) lastSpec = spec
    }
    return lastSpec
  }

  /** 获取 surface 的当前 VizualSpec */
  getSpec(surfaceId: string): VizualSpec | null {
    const surface = this.surfaces.get(surfaceId)
    if (!surface) return null
    return this.buildSpec(surface)
  }

  /** 获取 surface 的 dataModel */
  getDataModel(surfaceId: string): Record<string, unknown> | null {
    return this.surfaces.get(surfaceId)?.dataModel ?? null
  }

  /** 获取 surface 的 theme 配置 */
  getTheme(surfaceId: string): Record<string, unknown> | null {
    return this.surfaces.get(surfaceId)?.theme ?? null
  }

  /** 获取 surface 的错误状态 */
  getError(surfaceId: string): A2UIError | undefined {
    return this.surfaces.get(surfaceId)?.error
  }

  /** 获取所有 surface ID */
  getSurfaceIds(): string[] {
    return Array.from(this.surfaces.keys())
  }

  /** 判断 surface 是否存在 */
  hasSurface(surfaceId: string): boolean {
    return this.surfaces.has(surfaceId)
  }

  /** 将 Vizual action 事件转为 A2UI action 格式，并触发回调 */
  createActionFromVizual(actionName: string, surfaceId: string, params: Record<string, unknown>): A2UIAction {
    const action: A2UIAction = {
      name: actionName,
      surfaceId,
      sourceComponentId: params._sourceComponentId as string | undefined,
      context: params,
    }
    // 通知所有订阅者
    this.options.onAction?.(action)
    for (const subscriber of this.actionSubscribers) {
      try { subscriber(action) } catch {}
    }
    return action
  }

  /**
   * 注册 action 订阅者。
   * 用于 FormBuilder 提交、Widget 交互等场景。
   * 返回 unsubscribe 函数。
   */
  onAction(handler: (action: A2UIAction) => void): () => void {
    this.actionSubscribers.add(handler)
    return () => this.actionSubscribers.delete(handler)
  }

  /**
   * 增量更新 surface 的 dataModel（客户端→Agent 方向）。
   * 用于表单提交、Widget 状态变化等需要将数据回传的场景。
   */
  updateSurfaceDataModel(surfaceId: string, path: string, value: unknown): VizualSpec | null {
    return this.handleUpdateDataModel({ surfaceId, path, value })
  }

  /** 重置 surface 到初始状态（仅保留 surfaceId 和 catalogId） */
  resetSurface(surfaceId: string): VizualSpec | null {
    const surface = this.surfaces.get(surfaceId)
    if (!surface) return null
    surface.components.clear()
    surface.dataModel = {}
    surface.error = undefined
    return this.buildSpec(surface)
  }

  // --- internal ---

  private handleCreateSurface(msg: { surfaceId: string; catalogId: string; theme?: Record<string, unknown> }): VizualSpec {
    const surface: A2UISurfaceState = {
      surfaceId: msg.surfaceId,
      catalogId: msg.catalogId,
      theme: msg.theme,
      components: new Map(),
      dataModel: {},
    }
    this.surfaces.set(msg.surfaceId, surface)
    return this.buildSpec(surface)
  }

  private handleUpdateComponents(msg: { surfaceId: string; components: A2UIComponentDef[] }): VizualSpec | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) {
      this.emitError({ surfaceId: msg.surfaceId, phase: 'update', message: `Surface ${msg.surfaceId} not found`, recoverable: true, timestamp: Date.now() })
      return null
    }

    // A2UI updateComponents 是 additive/merge：同 ID 更新，新 ID 添加
    for (const comp of msg.components) {
      surface.components.set(comp.id, comp)
    }
    // 更新组件后清除之前的错误
    surface.error = undefined

    const spec = this.buildSpec(surface)
    this.options.onChange?.(msg.surfaceId, spec)
    return spec
  }

  private handleUpdateDataModel(msg: { surfaceId: string; path?: string; value?: unknown }): VizualSpec | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) return null

    const path = msg.path ?? '/'
    if (path === '/' || path === '') {
      surface.dataModel = (msg.value as Record<string, unknown>) ?? {}
    } else {
      const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
      let cursor: any = surface.dataModel
      for (let i = 0; i < parts.length - 1; i++) {
        if (cursor[parts[i]] == null || typeof cursor[parts[i]] !== 'object') {
          cursor[parts[i]] = {}
        }
        cursor = cursor[parts[i]]
      }
      if (msg.value !== undefined) {
        cursor[parts[parts.length - 1]] = msg.value
      } else {
        delete cursor[parts[parts.length - 1]]
      }
    }

    const spec = this.buildSpec(surface)
    this.options.onChange?.(msg.surfaceId, spec)
    return spec
  }

  private handleDeleteSurface(surfaceId: string): null {
    const surface = this.surfaces.get(surfaceId)
    this.surfaces.delete(surfaceId)
    if (surface) {
      this.options.onSurfaceDelete?.(surfaceId)
    }
    return null
  }

  private handleUpdateTheme(msg: { surfaceId: string; theme: Record<string, unknown> }): VizualSpec | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) return null

    surface.theme = { ...surface.theme, ...msg.theme }
    const spec = this.buildSpec(surface)
    this.options.onChange?.(msg.surfaceId, spec)
    return spec
  }

  private handleErrorRecovery(msg: { surfaceId: string; action: 'retry' | 'fallback' | 'reset'; payload?: unknown }): VizualSpec | null {
    const surface = this.surfaces.get(msg.surfaceId)
    if (!surface) return null

    switch (msg.action) {
      case 'reset':
        surface.components.clear()
        surface.dataModel = {}
        surface.error = undefined
        return this.buildSpec(surface)

      case 'fallback':
        // payload 应该是兜底的 VizualSpec
        if (msg.payload && typeof msg.payload === 'object') {
          surface.error = undefined
          return msg.payload as VizualSpec
        }
        return this.buildSpec(surface)

      case 'retry':
        // 清除错误状态，重新 buildSpec
        surface.error = undefined
        return this.buildSpec(surface)

      default:
        return null
    }
  }

  private emitError(error: A2UIError) {
    const surface = this.surfaces.get(error.surfaceId)
    if (surface) surface.error = error
    this.options.onError?.(error)
  }

  private guessSurfaceId(msg: A2UIMessage): string {
    for (const key of Object.keys(msg)) {
      if (key === 'version') continue
      const val = (msg as any)[key]
      if (val && typeof val === 'object' && val.surfaceId) return val.surfaceId
    }
    return ''
  }

  /**
   * 从 A2UI surface 状态构建 VizualSpec。
   *
   * 核心转换：A2UI 扁平组件列表 + ID 引用 → Vizual 平铺 elements + 字符串 children
   * json-render 要求 children 为字符串 ID 引用，所有组件平铺在 elements 顶层。
   */
  private buildSpec(surface: A2UISurfaceState): VizualSpec {
    const elements: Record<string, any> = {}

    const rootComp = surface.components.get('root')
    if (!rootComp) {
      return { root: 'root', elements: {}, state: surface.dataModel }
    }

    // 如果 surface 有 theme，注入到 spec state
    const stateWithTheme = surface.theme
      ? { ...surface.dataModel, _a2uiTheme: surface.theme }
      : surface.dataModel

    // 平铺所有组件到 elements，children 保持为字符串 ID 引用
    for (const [id, comp] of surface.components) {
      const props = this.resolveProps(comp, surface.dataModel)
      const element: any = {
        type: comp.component,
        props,
      }

      // children 保持为字符串 ID 数组（json-render 通过 ID 查找 elements）
      if (Array.isArray(comp.children) && comp.children.length > 0) {
        element.children = [...comp.children]
      }

      // Single child
      if (comp.child) {
        element.children = [comp.child]
      }

      // Named slot mapping: resolve props that reference child IDs into children array
      const childSlots = this.resolveNamedSlots(comp, props)
      if (childSlots.length > 0 && !element.children) {
        element.children = childSlots
      }

      elements[id] = element
    }

    return {
      root: 'root',
      elements,
      state: stateWithTheme,
    }
  }

  /**
   * 解析组件 props 中的 DynamicValue 引用。
   *
   * A2UI 的 DynamicValue 可以是：
   * - 字面量（string/number/boolean/array）
   * - { path: "/chartData" } → 从 dataModel 读取
   * - { call: "...", args: {...} } → 函数调用（暂不支持，透传）
   */
  private resolveProps(comp: A2UIComponentDef, dataModel: Record<string, unknown>): Record<string, unknown> {
    const props: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(comp)) {
      if (key === 'id' || key === 'component' || key === 'children' || key === 'child') continue
      props[key] = this.resolveDynamicValue(value, dataModel)
    }
    return props
  }

  private resolveDynamicValue(value: unknown, dataModel: Record<string, unknown>): unknown {
    if (value == null || typeof value !== 'object') return value

    // DynamicString path binding: { path: "/chartData" }
    if ('path' in (value as any) && typeof (value as any).path === 'string') {
      return this.getValueAtPath(dataModel, (value as any).path)
    }

    // FunctionCall: { call: "...", args: {...} } — 透传
    if ('call' in (value as any)) return value

    // Array — 递归解析
    if (Array.isArray(value)) {
      return value.map(v => this.resolveDynamicValue(v, dataModel))
    }

    // 普通对象 — 递归解析
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = this.resolveDynamicValue(v, dataModel)
    }
    return result
  }

  private getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.replace(/^\/+/, '').split('/').filter(Boolean)
    let cursor: any = obj
    for (const part of parts) {
      if (cursor == null || typeof cursor !== 'object') return undefined
      cursor = cursor[part]
    }
    return cursor
  }

  /**
   * 将布局组件的命名插槽（hero/body, left/right）映射为 json-render children 数组。
   * 这些 prop 中的字符串值是子组件 ID 引用，需要转为 children 以便 json-render 渲染。
   */
  private resolveNamedSlots(comp: A2UIComponentDef, resolvedProps: Record<string, unknown>): string[] {
    const children: string[] = []
    const compType = comp.component

    // HeroLayout: hero → children[0], body → children[1]
    if (compType === 'HeroLayout') {
      const hero = resolvedProps.hero
      const body = resolvedProps.body
      if (typeof hero === 'string') { children.push(hero); delete resolvedProps.hero }
      if (typeof body === 'string') { children.push(body); delete resolvedProps.body }
    }

    // SplitLayout: left → children[0], right → children[1]
    if (compType === 'SplitLayout') {
      const left = resolvedProps.left
      const right = resolvedProps.right
      if (typeof left === 'string') { children.push(left); delete resolvedProps.left }
      if (typeof right === 'string') { children.push(right); delete resolvedProps.right }
    }

    return children
  }
}

/**
 * 便捷函数：从 A2UI 消息数组一次性构建 VizualSpec。
 */
export function a2uiToVizualSpec(messages: A2UIMessage[]): VizualSpec | null {
  const bridge = new A2UIBridge()
  return bridge.processMessages(messages)
}
