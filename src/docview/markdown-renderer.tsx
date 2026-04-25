/**
 * Markdown Renderer — 将 Markdown 内容渲染为带主题感知样式的 React 元素
 *
 * 使用 marked 解析 Markdown → HTML，再用 DOMPurify 做白名单过滤，
 * 最终通过 dangerouslySetInnerHTML 注入到带 scoped 样式的容器中。
 *
 * 所有颜色通过 tcss() 获取 CSS 变量引用，天然响应主题切换。
 */
import React from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { tcss } from '../core/theme-colors'
import { getSectionId } from './review-sdk'

/** Section 类型定义，与 DocViewSchema 中的 Section 保持一致 */
type SectionLike = {
  type: string
  id?: string
  content: string
  data?: unknown
  layout?: string
}

/** 配置 marked：支持 GFM（表格、删除线等）和换行 */
marked.setOptions({ breaks: true, gfm: true })

/** DOMPurify 白名单配置 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'a', 'strong', 'b', 'em', 'i',
    'code', 'pre', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img',
    'del', 's', 'sup', 'sub',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'colspan', 'rowspan'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'form', 'input', 'button'],
  ADD_ATTR: ['target'],
} satisfies Parameters<typeof DOMPurify.sanitize>[1]

/**
 * 构建 scoped CSS 样式字符串
 *
 * 使用 [data-docview-markdown] 选择器限定作用域，
 * 避免污染文档中其他元素。所有颜色值使用 tcss() 引用 CSS 变量。
 */
function buildScopedStyles(): string {
  const tp = tcss('--rk-text-primary')
  const ts = tcss('--rk-text-secondary')
  const bgSec = tcss('--rk-bg-secondary')
  const bgTer = tcss('--rk-bg-tertiary')
  const border = tcss('--rk-border-subtle')
  const accent = tcss('--rk-accent')
  const fontMono = tcss('--rk-font-mono')
  const radiusSm = tcss('--rk-radius-sm')
  const radiusMd = tcss('--rk-radius-md')

  return `
[data-docview-markdown] h1 { font-size: 28px; font-weight: bold; color: ${tp}; margin: 24px 0 12px; line-height: 1.3; }
[data-docview-markdown] h2 { font-size: 22px; font-weight: 600; color: ${tp}; margin: 20px 0 10px; line-height: 1.35; }
[data-docview-markdown] h3 { font-size: 18px; font-weight: 600; color: ${tp}; margin: 16px 0 8px; line-height: 1.4; }
[data-docview-markdown] h4 { font-size: 16px; font-weight: 600; color: ${tp}; margin: 14px 0 6px; }
[data-docview-markdown] h5 { font-size: 15px; font-weight: 600; color: ${ts}; margin: 12px 0 6px; }
[data-docview-markdown] h6 { font-size: 14px; font-weight: 600; color: ${ts}; margin: 10px 0 4px; }
[data-docview-markdown] p { margin: 0 0 12px; }
[data-docview-markdown] ul, [data-docview-markdown] ol { padding-left: 24px; margin: 0 0 12px; }
[data-docview-markdown] li { margin-bottom: 4px; }
[data-docview-markdown] code { font-family: ${fontMono}; font-size: 0.9em; background: ${bgTer}; padding: 2px 6px; border-radius: ${radiusSm}; color: ${tp}; }
[data-docview-markdown] pre { background: ${bgSec}; border: 1px solid ${border}; border-radius: ${radiusMd}; padding: 12px 16px; overflow-x: auto; margin: 0 0 16px; }
[data-docview-markdown] pre code { background: transparent; padding: 0; font-size: 13px; line-height: 1.5; }
[data-docview-markdown] blockquote { border-left: 3px solid ${accent}; padding: 8px 16px; margin: 0 0 16px; color: ${ts}; background: ${bgTer}; border-radius: ${radiusSm}; }
[data-docview-markdown] a { color: ${accent}; text-decoration: none; }
[data-docview-markdown] a:hover { text-decoration: underline; }
[data-docview-markdown] table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
[data-docview-markdown] th { padding: 8px 12px; text-align: left; border-bottom: 1px solid ${border}; color: ${ts}; font-weight: 600; background: ${bgSec}; }
[data-docview-markdown] td { padding: 8px 12px; border-bottom: 1px solid ${border}; color: ${tp}; }
[data-docview-markdown] hr { border: none; border-top: 1px solid ${border}; margin: 20px 0; }
[data-docview-markdown] img { max-width: 100%; border-radius: ${radiusSm}; }
`
}

/**
 * 渲染 Markdown section 为带主题样式的 React 节点
 *
 * @param section - 包含 markdown 内容的 section 对象
 * @param index   - section 在数组中的索引，用作 React key
 * @returns ReactNode
 */
export function renderMarkdown(section: SectionLike, index: number): React.ReactNode {
  // 1. Markdown → HTML
  const rawHtml = marked.parse(section.content) as string

  // 2. HTML → 安全 HTML（白名单过滤）
  const cleanHtml = String(DOMPurify.sanitize(rawHtml, PURIFY_CONFIG))

  // 3. 构建 scoped 样式
  const scopedCss = buildScopedStyles()

  return (
    <div
      key={`markdown-${index}`}
      data-docview-target={`markdown-${section.id || index}`}
      data-section-index={index}
      data-section-id={getSectionId(section, index)}
      data-target-type="markdown"
    >
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <div
        data-docview-markdown
        style={{
          color: tcss('--rk-text-primary'),
          fontSize: tcss('--rk-text-md'),
          lineHeight: 1.6,
          fontFamily: tcss('--rk-font-sans'),
        }}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  )
}
