import { z } from 'zod'

/**
 * FreeformHtml — Agent 可以输出任意 HTML/CSS 内容的逃生舱组件。
 *
 * 用于：
 * - 自定义 UI（个人主页、创意 widget）
 * - 任何 Vizual 组件库未覆盖的场景
 * - Agent 用 HTML/CSS 设计 skill 自由创作
 *
 * 安全：DOMPurify 净化，禁止 script/iframe/事件处理器。
 */
export const FreeformHtmlSchema = z.object({
  /** 要渲染的 HTML 内容 */
  html: z.string(),
  /** 容器宽度（px 或 CSS 值），默认 100% */
  width: z.string().optional().default('100%'),
  /** 容器最小高度（px） */
  minHeight: z.number().optional().default(40),
  /** 是否注入主题 CSS 变量替换（默认 true） */
  applyTheme: z.boolean().optional().default(true),
})

export type FreeformHtmlProps = z.infer<typeof FreeformHtmlSchema>
