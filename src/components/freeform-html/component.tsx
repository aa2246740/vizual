/**
 * FreeformHtml — Agent 自由 HTML/CSS 渲染组件
 *
 * 允许 Agent 输出任意 HTML 和 CSS，经 DOMPurify 安全过滤后渲染。
 * 这是 Vizual 的"逃生舱"——当组件库无法满足 Agent 的创意需求时使用。
 *
 * 渲染流程：
 * 1. DOMPurify 净化（允许 style，禁止 script/class/事件）
 * 2. 主题色值替换（硬编码色值 → CSS 变量）
 * 3. dangerouslySetInnerHTML 渲染
 */
import React from 'react'
import DOMPurify from 'dompurify'
import { tcss, tc } from '../../core/theme-colors'
import type { FreeformHtmlProps } from './schema'

/** DOMPurify 配置 — 允许 style（Agent 设计需要），禁止 class 和事件属性 */
const PURIFY_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'a', 'strong', 'b', 'em', 'i',
    'code', 'pre', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img',
    'del', 's', 'sup', 'sub',
    'div', 'span', 'section', 'header', 'footer',
    'article', 'aside', 'details', 'summary',
    'figure', 'figcaption',
    'mark', 'small',
    'dl', 'dt', 'dd',
    'nav', 'main',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt',
    'colspan', 'rowspan', 'width', 'height',
    'style',
    'data-*',
  ],
  FORBID_ATTR: ['class', 'onclick', 'onerror', 'onload', 'onmouseover'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'form', 'input', 'button'],
  ADD_ATTR: ['target'],
}

/** 需要做反向映射的主题色变量 */
const THEME_COLOR_VARS = [
  '--rk-bg-primary', '--rk-bg-secondary', '--rk-bg-tertiary',
  '--rk-text-primary', '--rk-text-secondary', '--rk-text-tertiary',
  '--rk-border', '--rk-border-subtle',
  '--rk-accent', '--rk-accent-hover', '--rk-accent-muted',
  '--rk-success', '--rk-success-muted',
  '--rk-warning', '--rk-warning-muted',
  '--rk-error', '--rk-error-muted',
]

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildColorReverseMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const varName of THEME_COLOR_VARS) {
    const resolved = tc(varName)
    if (resolved) {
      map.set(resolved.toLowerCase(), `var(${varName})`)
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

  return html.replace(/(style=")([^"]*)(")/gi, (_match, prefix: string, styleContent: string, suffix: string) => {
    let replaced = styleContent
    for (const [hexValue, varRef] of reverseMap) {
      const re = new RegExp(escapeRegExp(hexValue), 'gi')
      replaced = replaced.replace(re, varRef)
    }
    return `${prefix}${replaced}${suffix}`
  })
}

export function FreeformHtml({ props }: { props: FreeformHtmlProps }) {
  const { html = '', width = '100%', minHeight = 40, applyTheme = true } = props

  // Step 1: DOMPurify 净化
  const cleanHtml = String(DOMPurify.sanitize(html, PURIFY_CONFIG))
  // Step 2: 主题色值替换
  const themedHtml = applyTheme ? replaceThemeColors(cleanHtml) : cleanHtml

  return (
    <div
      style={{
        width,
        minHeight,
        color: tcss('--rk-text-primary'),
        fontFamily: tcss('--rk-font-sans'),
        lineHeight: 1.6,
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: themedHtml }}
    />
  )
}
