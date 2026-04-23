/**
 * Freeform Renderer — 渲染经过净化的任意 HTML 内容
 *
 * 与 markdown-renderer 不同，freeform-renderer 不做 Markdown 解析，
 * 直接将 section.content 作为 HTML 进行 DOMPurify 白名单过滤后渲染。
 * 允许 style 属性通过（AI 自由设计需要 CSS），禁止 class 和事件处理器。
 *
 * 渲染流程：
 * 1. DOMPurify 净化（允许 style，禁止 class/事件）
 * 2. 创建临时 DOM，querySelectorAll 扫描语义元素
 * 3. 给每个语义元素注入 data-docview-target / data-section-index / data-target-type
 * 4. 序列化回 HTML，dangerouslySetInnerHTML 渲染
 */
import React from 'react'
import DOMPurify from 'dompurify'
import { tcss, tc } from '../core/theme-colors'

/** Section 类型定义，与 DocViewSchema 中的 Section 保持一致 */
type SectionLike = {
  type: string
  content: string
  data?: unknown
  layout?: string
}

/** DOMPurify 白名单配置 — 允许 style（AI 设计需要），禁止 class 和事件属性 */
const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Markdown 核心标签
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'a', 'strong', 'b', 'em', 'i',
    'code', 'pre', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img',
    'del', 's', 'sup', 'sub',
    // 结构化 / 语义化标签
    'div', 'span', 'section', 'header', 'footer',
    'article', 'aside', 'details', 'summary',
    'figure', 'figcaption',
    'mark', 'small',
    'dl', 'dt', 'dd',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'colspan', 'rowspan',
    // style 允许通过 — AI 自由设计依赖内联 CSS
    'style',
    // 自定义数据属性 — 用于 annotation targeting
    'data-docview-target', 'data-section-index', 'data-target-type',
    'data-section', 'data-card',
  ],
  // 只禁止 class（样式冲突风险）和事件处理器（安全），style 不再禁止
  FORBID_ATTR: ['class', 'onclick', 'onerror', 'onload'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'form', 'input', 'button'],
  ADD_ATTR: ['target'],
}

/** 语义元素选择器 — 这些元素会自动获得批注定位属性 */
const SEMANTIC_SELECTORS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'section', 'article', 'aside',
  'header', 'footer',
  'figure', 'details',
  '[data-section]', '[data-card]',
].join(', ')

/** 需要做反向映射的主题色变量名（只映射颜色类，跳过字号/间距等） */
const THEME_COLOR_VARS = [
  '--rk-bg-primary', '--rk-bg-secondary', '--rk-bg-tertiary',
  '--rk-text-primary', '--rk-text-secondary', '--rk-text-tertiary',
  '--rk-border', '--rk-border-subtle',
  '--rk-accent', '--rk-accent-hover', '--rk-accent-muted',
  '--rk-success', '--rk-success-muted',
  '--rk-warning', '--rk-warning-muted',
  '--rk-error', '--rk-error-muted',
]

/** 构建当前主题的反向色值映射：解析值 → var(--rk-xxx) */
function buildColorReverseMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const varName of THEME_COLOR_VARS) {
    const resolved = tc(varName)
    if (resolved) {
      map.set(resolved.toLowerCase(), `var(${varName})`)
      // 也映射 3/6 位 hex 两种形式
      if (resolved.startsWith('#') && resolved.length === 7) {
        const short = `#${resolved[1]}${resolved[3]}${resolved[5]}`.toLowerCase()
        map.set(short, `var(${varName})`)
      }
    }
  }
  return map
}

/** 将 style 属性中的硬编码主题色值替换为 CSS 变量引用 */
function replaceThemeColors(html: string): string {
  const reverseMap = buildColorReverseMap()
  if (reverseMap.size === 0) return html

  // 匹配所有 style="..." 属性，替换其中的已知色值
  return html.replace(/(style=")([^"]*)(")/gi, (_match, prefix: string, styleContent: string, suffix: string) => {
    let replaced = styleContent
    for (const [hexValue, varRef] of reverseMap) {
      // 全局替换 style 内容中的色值（大小写不敏感）
      const re = new RegExp(escapeRegExp(hexValue), 'gi')
      replaced = replaced.replace(re, varRef)
    }
    return `${prefix}${replaced}${suffix}`
  })
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 对净化后的 HTML 进行语义扫描，为每个语义元素注入批注定位属性。
 *
 * 注入规则：
 * - data-docview-target="freeform-{sectionIndex}-{子序号}"
 * - data-section-index={sectionIndex}
 * - data-target-type="freeform"
 *
 * @param html     - DOMPurify 净化后的 HTML 字符串
 * @param sectionIndex - section 在数组中的索引
 * @returns 注入属性后的 HTML 字符串
 */
function injectAnnotationTargets(html: string, sectionIndex: number): string {
  // SSR / 非浏览器环境跳过注入，直接返回
  if (typeof document === 'undefined') return html

  const tmp = document.createElement('div')
  tmp.innerHTML = html

  const semanticElements = tmp.querySelectorAll(SEMANTIC_SELECTORS)
  if (semanticElements.length === 0) return html

  semanticElements.forEach((el, i) => {
    el.setAttribute('data-docview-target', `freeform-${sectionIndex}-${i}`)
    el.setAttribute('data-section-index', String(sectionIndex))
    el.setAttribute('data-target-type', 'freeform')
  })

  return tmp.innerHTML
}

/**
 * 渲染 Freeform section 为带基础主题样式的 React 节点
 *
 * @param section - 包含原始 HTML 内容的 section 对象
 * @param index   - section 在数组中的索引，用作 React key
 * @returns ReactNode
 */
export function renderFreeform(section: SectionLike, index: number): React.ReactNode {
  // Step 1: DOMPurify 净化（允许 style，禁止 class/事件）
  const cleanHtml = DOMPurify.sanitize(section.content, PURIFY_CONFIG)
  // Step 2: 扫描语义元素，注入批注定位属性
  const annotatedHtml = injectAnnotationTargets(cleanHtml, index)
  // Step 3: 将硬编码的主题色值替换为 CSS 变量引用，确保主题一致性
  const themedHtml = replaceThemeColors(annotatedHtml)

  return (
    <div
      key={`freeform-${index}`}
      data-docview-target={`freeform-${index}`}
      data-section-index={index}
      data-target-type="freeform"
      style={{
        color: tcss('--rk-text-primary'),
        background: tcss('--rk-bg-primary'),
        fontFamily: tcss('--rk-font-sans'),
        lineHeight: 1.6,
        marginBottom: 16,
      }}
      dangerouslySetInnerHTML={{ __html: themedHtml }}
    />
  )
}
