import { useEffect, useState } from 'react'
import type { MermaidProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'
import type { AnnotationTarget } from '../../docview/types'

/**
 * Mermaid diagram component — renders mermaid syntax via mermaid.js
 *
 * Strategy:
 * - CDN build (vizual.cdn.js): mermaid is externalized to global `window.mermaid`
 * - npm/standalone build: `import('mermaid')` dynamic import
 * - Tests: `<script>` tag loads mermaid which sets `window.mermaid`
 */
export function MermaidChart({ props }: { props: MermaidProps }) {
  const [html, setHtml] = useState<string>('')
  const [error, setError] = useState<string>('')
  const ctx = useAnnotationContext()
  // Support both `code` (canonical) and `definition` (alias) field names
  const code = props.code ?? (props as Record<string, unknown>).definition ?? ''

  useEffect(() => {
    let cancelled = false

    async function renderWith(lib: any) {
      lib.initialize({ startOnLoad: false, theme: props.theme ?? 'dark', securityLevel: 'loose' })
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
      try {
        const { svg } = await lib.render(id, code)
        if (!cancelled) { setHtml(svg); setError('') }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Render failed')
      }
    }

    // 1. Try window.mermaid (set by <script> tag or CDN externalization)
    const globalMermaid = (globalThis as any).mermaid
    if (globalMermaid) {
      renderWith(globalMermaid)
      return
    }

    // 2. Try dynamic import (npm/standandalone build)
    import('mermaid').then(mod => {
      const lib = mod.default || mod
      if (!cancelled) renderWith(lib)
    }).catch(() => {
      if (!cancelled) setError('Mermaid library not loaded')
    })

    return () => { cancelled = true }
  }, [code, props.theme])

  // 批注相关属性（仅在 DocView 内生效）
  const annotationProps = ctx ? {
    'data-docview-target': `component-${ctx.sectionIndex}`,
    'data-section-index': ctx.sectionIndex,
    'data-target-type': 'component' as const,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      ctx.onTargetClick?.({
        sectionIndex: ctx.sectionIndex,
        targetType: 'component',
        label: ctx.title || props.title || 'MermaidDiagram',
        targetId: `component-${ctx.sectionIndex}`,
      }, e.currentTarget as HTMLElement)
    },
    style: { cursor: 'pointer' as const },
  } : {}

  if (error) {
    return (
      <div style={{ width: '100%', minHeight: props.height ?? 200 }} {...annotationProps}>
        {props.title && <h3 style={{ fontSize:tcss('--rk-text-md'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 8, color: tcss('--rk-text-primary') }}>{props.title}</h3>}
        <pre style={{ color: tcss('--rk-text-secondary'), fontSize:tcss('--rk-text-base'), padding: 12, background: tcss('--rk-bg-secondary'), borderRadius:tcss('--rk-radius-sm'), whiteSpace: 'pre-wrap' }}>{code}</pre>
        <div style={{ color: tcss('--rk-error'), fontSize:tcss('--rk-text-xs'), marginTop: 4 }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: props.height ?? 200 }} {...annotationProps}>
      {props.title && <h3 style={{ fontSize:tcss('--rk-text-md'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 8, color: tcss('--rk-text-primary') }}>{props.title}</h3>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
