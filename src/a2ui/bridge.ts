import type {
  A2UIAction,
  A2UIBridgeOptions,
  A2UIError,
  A2UIMessage,
} from './types'
import type { VizualArtifact, VizualSpec } from '../core/artifact'
import { VizualFusionRuntime } from '../fusion'

/**
 * Compatibility entrypoint for existing A2UI consumers.
 *
 * The protocol state, AG-UI ingestion, Vizual artifacts, and action routing live
 * in VizualFusionRuntime. This class intentionally stays thin so A2UI does not
 * drift into a second implementation.
 */
export class A2UIBridge {
  private runtime: VizualFusionRuntime

  constructor(options: A2UIBridgeOptions = {}) {
    this.runtime = new VizualFusionRuntime({
      onSpecChange: options.onChange,
      onAction: options.onAction,
      onError: options.onError,
      onSurfaceDelete: options.onSurfaceDelete,
    })
  }

  /** 处理一条 A2UI 消息，返回更新后的 VizualSpec（如果有） */
  processMessage(message: A2UIMessage): VizualSpec | null {
    return this.runtime.processA2UIMessage(message)?.spec ?? null
  }

  /** 批量处理消息序列（A2UI 标准用法） */
  processMessages(messages: A2UIMessage[]): VizualSpec | null {
    return this.runtime.processA2UIMessages(messages)?.spec ?? null
  }

  /** 获取 surface 的当前 VizualSpec */
  getSpec(surfaceId: string): VizualSpec | null {
    return this.runtime.getSpec(surfaceId)
  }

  /** 获取 surface 的当前 VizualArtifact */
  getArtifact(surfaceId: string): VizualArtifact | null {
    return this.runtime.getArtifact(surfaceId)
  }

  /** 获取 surface 的 dataModel */
  getDataModel(surfaceId: string): Record<string, unknown> | null {
    return this.runtime.getDataModel(surfaceId)
  }

  /** 获取 surface 的 theme 配置 */
  getTheme(surfaceId: string): Record<string, unknown> | null {
    return this.runtime.getTheme(surfaceId)
  }

  /** 获取 surface 的错误状态 */
  getError(surfaceId: string): A2UIError | undefined {
    return this.runtime.getError(surfaceId)
  }

  /** 获取所有 surface ID */
  getSurfaceIds(): string[] {
    return this.runtime.getSurfaceIds()
  }

  /** 判断 surface 是否存在 */
  hasSurface(surfaceId: string): boolean {
    return this.runtime.hasSurface(surfaceId)
  }

  /** 将 Vizual action 事件转为 A2UI action 格式，并触发回调 */
  createActionFromVizual(actionName: string, surfaceId: string, params: Record<string, unknown>): A2UIAction {
    return this.runtime.createActionFromVizual(actionName, surfaceId, params)
  }

  /**
   * 注册 action 订阅者。
   * 用于 FormBuilder 提交、Widget 交互等场景。
   * 返回 unsubscribe 函数。
   */
  onAction(handler: (action: A2UIAction) => void): () => void {
    return this.runtime.onAction(handler)
  }

  /**
   * 增量更新 surface 的 dataModel（客户端→Agent 方向）。
   * 用于表单提交、Widget 状态变化等需要将数据回传的场景。
   */
  updateSurfaceDataModel(surfaceId: string, path: string, value: unknown): VizualSpec | null {
    return this.runtime.updateSurfaceDataModel(surfaceId, path, value)?.spec ?? null
  }

  /** 重置 surface 到初始状态（仅保留 surfaceId 和 catalogId） */
  resetSurface(surfaceId: string): VizualSpec | null {
    return this.runtime.resetSurface(surfaceId)?.spec ?? null
  }
}

/**
 * 便捷函数：从 A2UI 消息数组一次性构建 VizualSpec。
 */
export function a2uiToVizualSpec(messages: A2UIMessage[]): VizualSpec | null {
  const bridge = new A2UIBridge()
  return bridge.processMessages(messages)
}
