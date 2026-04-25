import React, { createContext, useContext } from 'react'
import type { AnnotationTarget, Annotation } from './types'

/**
 * AnnotationContext — 桥接 DocView 和内部渲染的 Vizual 组件。
 *
 * 组件通过 useAnnotationContext() 消费：
 * - 在 DocView 内 → 返回 context 值，启用批注行为
 * - 在 DocView 外 → 返回 null，组件行为不变
 *
 * 数据流：
 * DocView container → AnnotationContext.Provider (per section)
 *                   → 组件内 useAnnotationContext() → 加 data-docview-target / click handler
 */
export interface AnnotationContextValue {
  /** 当前 section 在 sections 数组中的索引 */
  sectionIndex: number
  /** Stable section id for review anchors */
  sectionId?: string
  /** 组件类型名 (e.g. 'BarChart', 'Kanban') */
  componentType: string
  /** 可选标题 */
  title?: string
  /** 用户点击元素时调用，触发批注流程 */
  onTargetClick?: (target: AnnotationTarget, element: HTMLElement) => void
  /** 当前所有批注，用于组件内部高亮已批注的子元素 */
  annotations?: Annotation[]
}

const AnnotationContext = createContext<AnnotationContextValue | null>(null)

/**
 * 组件内调用此 hook 判断是否在 DocView 内部。
 * 返回 null 表示不在 DocView 内，组件应跳过所有批注逻辑。
 */
export function useAnnotationContext(): AnnotationContextValue | null {
  return useContext(AnnotationContext)
}

export { AnnotationContext }
