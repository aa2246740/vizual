import { useEffect, useState } from 'react'
import type { MermaidProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'

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

  useEffect(() => {
    let cancelled = false

    async function renderWith(lib: any) {
      lib.initialize({ startOnLoad: false, theme: props.theme ?? 'dark', securityLevel: 'loose' })
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
      try {
        const { svg } = await lib.render(id, props.code)
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
  }, [props.code, props.theme])

  if (error) {
    return (
      <div style={{ width: '100%', minHeight: props.height ?? 200 }}>
        {props.title && <h3 style={{ fontSize:tcss('--rk-text-md'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 8, color: tcss('--rk-text-primary') }}>{props.title}</h3>}
        <pre style={{ color: tcss('--rk-text-secondary'), fontSize:tcss('--rk-text-base'), padding: 12, background: tcss('--rk-bg-secondary'), borderRadius:tcss('--rk-radius-sm'), whiteSpace: 'pre-wrap' }}>{props.code}</pre>
        <div style={{ color: tcss('--rk-error'), fontSize:tcss('--rk-text-xs'), marginTop: 4 }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: props.height ?? 200 }}>
      {props.title && <h3 style={{ fontSize:tcss('--rk-text-md'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 8, color: tcss('--rk-text-primary') }}>{props.title}</h3>}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
