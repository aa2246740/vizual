import React from 'react'
import { tcss } from '../core/theme-colors'

/**
 * Layout Wrappers — DocView section layout variants
 *
 * 为 DocView section 内容提供不同的视觉布局包装。
 * 不支持的 layout 值静默回退到 'default'（无包装）。
 *
 * 所有颜色通过 tcss() 获取 CSS var() 引用，
 * 天然响应主题切换，无需额外处理。
 */

/** 最小 section 结构，用于 wrapGrid 等需要访问 section.data 的场景 */
type SectionLike = {
  type: string
  content: string
  data?: unknown
  layout?: string
}

/**
 * 根据布局变体包装已渲染的 section 内容
 *
 * @param section   原始 section 数据（wrapGrid 需要读取 data.columns）
 * @param index     section 索引（保留供将来扩展使用）
 * @param renderedContent  已渲染的 React 节点
 * @param layout    布局变体名称，未指定时默认 'default'
 * @returns 包装后的 React 节点
 */
export function wrapWithLayout(
  section: SectionLike,
  index: number,
  renderedContent: React.ReactNode,
  layout?: string,
): React.ReactNode {
  const variant = layout || 'default'

  switch (variant) {
    case 'hero':
      return wrapHero(renderedContent)
    case 'split':
      return wrapSplit(renderedContent)
    case 'grid':
      return wrapGrid(section, renderedContent)
    case 'banner':
      return wrapBanner(renderedContent)
    case 'card':
      return wrapCard(renderedContent)
    case 'compact':
      return wrapCompact(renderedContent)
    default:
      return renderedContent
  }
}

// ---------------------------------------------------------------------------
// 内部布局包装函数
// ---------------------------------------------------------------------------

/**
 * Hero 布局 — 全宽渐变背景
 *
 * 视觉特征：
 *   - 从 accent-muted 到透明的 135deg 渐变背景
 *   - 最小高度 180px，内容垂直水平居中
 *   - 大圆角，24px 内边距
 */
function wrapHero(content: React.ReactNode): React.ReactNode {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${tcss('--rk-accent-muted')}, transparent)`,
      borderRadius: tcss('--rk-radius-lg'),
      padding: 24,
      minHeight: 180,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    }}>
      {content}
    </div>
  )
}

/**
 * Split 布局 — 左右两栏
 *
 * 视觉特征：
 *   - 1:1 网格布局
 *   - 内容在左栏，右栏留空（用于批注上下文或视觉呼吸空间）
 */
function wrapSplit(content: React.ReactNode): React.ReactNode {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 16,
    }}>
      <div>{content}</div>
      <div /> {/* placeholder for visual balance */}
    </div>
  )
}

/**
 * Grid 布局 — 多列网格
 *
 * 列数规则：
 *   - KPI 类型：默认 3 列，可通过 data.columns 覆盖
 *   - 其他类型：默认 2 列，可通过 data.columns 覆盖
 */
function wrapGrid(section: SectionLike, content: React.ReactNode): React.ReactNode {
  const data = section.data as Record<string, unknown> | undefined
  const cols = (data?.columns as number) || (section.type === 'kpi' ? 3 : 2)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 12,
      marginBottom: 16,
    }}>
      {content}
    </div>
  )
}

/**
 * Banner 布局 — 全宽突出横幅
 *
 * 视觉特征：
 *   - 左侧 4px accent 色竖线
 *   - 次要背景色填充
 *   - 充足的水平内边距 (16px 24px)
 *   - 小圆角
 */
function wrapBanner(content: React.ReactNode): React.ReactNode {
  return (
    <div style={{
      borderLeft: `4px solid ${tcss('--rk-accent')}`,
      background: tcss('--rk-bg-secondary'),
      padding: '16px 24px',
      borderRadius: tcss('--rk-radius-sm'),
      marginBottom: 16,
    }}>
      {content}
    </div>
  )
}

/**
 * Card 布局 — 浮起卡片
 *
 * 视觉特征：
 *   - 次要背景色
 *   - 1px 边框
 *   - 大圆角
 *   - 投影阴影，形成浮起感
 */
function wrapCard(content: React.ReactNode): React.ReactNode {
  return (
    <div style={{
      background: tcss('--rk-bg-secondary'),
      border: `1px solid ${tcss('--rk-border')}`,
      borderRadius: tcss('--rk-radius-lg'),
      padding: 20,
      marginBottom: 16,
      boxShadow: tcss('--rk-shadow'),
    }}>
      {content}
    </div>
  )
}

/**
 * Compact 布局 — 紧凑密集排列
 *
 * 视觉特征：
 *   - 缩小的内边距 (8px 12px)
 *   - 小号字体
 *   - 更小的底部间距 (8px)
 *   - 适合信息密度优先的场景
 */
function wrapCompact(content: React.ReactNode): React.ReactNode {
  return (
    <div style={{
      padding: '8px 12px',
      fontSize: tcss('--rk-text-sm'),
      marginBottom: 8,
    }}>
      {content}
    </div>
  )
}
