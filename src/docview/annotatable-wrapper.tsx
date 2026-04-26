import React from 'react'
import { useAnnotationContext } from './annotation-context'
import type { AnnotationTarget } from './types'
import { tcss } from '../core/theme-colors'

/**
 * AnnotatableWrapper — 为简单组件提供整体级批注支持。
 *
 * 行为：
 * - 在 DocView 外（无 AnnotationContext）→ 直接返回 children，不包装
 * - 在 DocView 内 → 包一层 div 加 data-docview-target + click handler
 *
 * 适用于：KpiDashboard, AuditLog, Timeline 等整体级批注组件。
 * 不适用于：需要子元素级批注的组件（DataTable 单元格、Kanban 卡片等），它们应直接用 useAnnotationContext()。
 */
export interface AnnotatableWrapperProps {
  children: React.ReactNode
  /** 批注目标类型 */
  targetType: AnnotationTarget['targetType']
  /** 组件类型名 (e.g. 'KpiDashboard') */
  componentType: string
  /** 批注目标 ID，用于精确 DOM 匹配 */
  targetId?: string
  /** 批注弹窗显示的文字 */
  label: string
}

export function AnnotatableWrapper({
  children,
  targetType,
  componentType,
  targetId,
  label,
}: AnnotatableWrapperProps) {
  const ctx = useAnnotationContext()

  // 不在 DocView 内 → 不包装
  if (!ctx) return <>{children}</>

  const resolvedTargetId = targetId || `${componentType.toLowerCase()}-${ctx.sectionIndex}`

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    ctx.onTargetClick?.(
      {
        sectionIndex: ctx.sectionIndex,
        targetType,
        label,
        targetId: resolvedTargetId,
      },
      e.currentTarget as HTMLElement,
    )
  }

  return (
    <div
      data-docview-target={resolvedTargetId}
      data-section-index={ctx.sectionIndex}
      data-section-id={ctx.sectionId}
      data-target-type={targetType}
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        borderRadius: tcss('--rk-radius-sm'),
        transition: 'outline 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.outline = `1px solid ${tcss('--rk-border')}`
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.outline = 'none'
      }}
    >
      {children}
    </div>
  )
}
