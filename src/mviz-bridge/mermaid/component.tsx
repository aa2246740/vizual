import { useEffect, useRef, useState } from 'react'
import type { MermaidProps } from './schema'

/**
 * Mermaid diagram component — renders mermaid syntax via mermaid.js
 */
export function MermaidChart(props: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [html, setHtml] = useState<string>('')

  useEffect(() => {
    // Dynamic import mermaid
    import('mermaid').then(async (mermaid) => {
      mermaid.default.initialize({
        startOnLoad: false,
        theme: props.theme ?? 'default',
      })
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
      const { svg } = await mermaid.default.render(id, props.code)
      setHtml(svg)
    }).catch(() => {
      setHtml(`<pre style="color:#888;font-size:13px">${props.code}</pre>`)
    })
  }, [props.code, props.theme])

  return (
    <div style={{ width: '100%', minHeight: props.height ?? 200 }}>
      {props.title && <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{props.title}</h3>}
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
