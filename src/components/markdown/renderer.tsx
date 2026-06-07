/**
 * Markdown Renderer — render Markdown content as themed React elements.
 *
 * Markdown is a core content component. It must not depend on review-product
 * internals or product-specific DOM attributes.
 */
import React from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { tcss } from '../../core/theme-colors'
import { normalizeEscapedText } from '../../core/text-normalize'

/** Configure marked: GFM tables/strikethrough plus line breaks. */
marked.setOptions({ breaks: true, gfm: true })

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
[data-vizual-markdown] h1 { font-size: 28px; font-weight: bold; color: ${tp}; margin: 24px 0 12px; line-height: 1.3; }
[data-vizual-markdown] h2 { font-size: 22px; font-weight: 600; color: ${tp}; margin: 20px 0 10px; line-height: 1.35; }
[data-vizual-markdown] h3 { font-size: 18px; font-weight: 600; color: ${tp}; margin: 16px 0 8px; line-height: 1.4; }
[data-vizual-markdown] h4 { font-size: 16px; font-weight: 600; color: ${tp}; margin: 14px 0 6px; }
[data-vizual-markdown] h5 { font-size: 15px; font-weight: 600; color: ${ts}; margin: 12px 0 6px; }
[data-vizual-markdown] h6 { font-size: 14px; font-weight: 600; color: ${ts}; margin: 10px 0 4px; }
[data-vizual-markdown] p { margin: 0 0 12px; }
[data-vizual-markdown] ul, [data-vizual-markdown] ol { padding-left: 24px; margin: 0 0 12px; }
[data-vizual-markdown] li { margin-bottom: 4px; }
[data-vizual-markdown] code { font-family: ${fontMono}; font-size: 0.9em; background: ${bgTer}; padding: 2px 6px; border-radius: ${radiusSm}; color: ${tp}; }
[data-vizual-markdown] pre { background: ${bgSec}; border: 1px solid ${border}; border-radius: ${radiusMd}; padding: 12px 16px; overflow-x: auto; margin: 0 0 16px; }
[data-vizual-markdown] pre code { background: transparent; padding: 0; font-size: 13px; line-height: 1.5; }
[data-vizual-markdown] blockquote { border-left: 3px solid ${accent}; padding: 8px 16px; margin: 0 0 16px; color: ${ts}; background: ${bgTer}; border-radius: ${radiusSm}; }
[data-vizual-markdown] a { color: ${accent}; text-decoration: none; }
[data-vizual-markdown] a:hover { text-decoration: underline; }
[data-vizual-markdown] table { width: 100%; border-collapse: collapse; margin: 0 0 16px; }
[data-vizual-markdown] th { padding: 8px 12px; text-align: left; border-bottom: 1px solid ${border}; color: ${ts}; font-weight: 600; background: ${bgSec}; }
[data-vizual-markdown] td { padding: 8px 12px; border-bottom: 1px solid ${border}; color: ${tp}; }
[data-vizual-markdown] hr { border: none; border-top: 1px solid ${border}; margin: 20px 0; }
[data-vizual-markdown] img { max-width: 100%; border-radius: ${radiusSm}; }
`
}

export function renderMarkdownContent(content: string, key = 'markdown'): React.ReactNode {
  const rawHtml = marked.parse(normalizeEscapedText(content)) as string
  const cleanHtml = String(DOMPurify.sanitize(rawHtml, PURIFY_CONFIG))
  const scopedCss = buildScopedStyles()

  return (
    <div key={key}>
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <div
        data-vizual-markdown
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
