import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import type { AnnotationTarget, Annotation, ChartDataPoint } from './types'

/** Props for the SectionRenderer component */
export interface SectionRendererProps {
  /** Sections array from DocViewSchema */
  sections: Array<{
    type: string
    content: string
    data?: unknown
    level?: number
    variant?: string
    componentType?: string
    title?: string
  }>
  /** Called when user clicks a non-text element to annotate it */
  onTargetClick?: (target: AnnotationTarget, element: HTMLElement) => void
  /** Current annotations for highlighting annotated data points in charts */
  annotations?: Annotation[]
}

/** Variant-to-color mapping for callout sections */
const variantColors: Record<string, string> = {
  info: '#3b82f6',
  warning: '#fbbf24',
  success: '#22c55e',
  error: '#ef4444',
  neutral: '#888',
}

/** Heading font sizes by level (h1=32px down to h6=14px) */
const headingSizes = [32, 24, 20, 18, 16, 14]

/**
 * SectionRenderer — Converts a DocViewSchema sections array into React elements.
 *
 * Handles all 7 section types:
 * - text: Paragraph with content
 * - heading: Styled heading at the given level
 * - chart: Clickable chart placeholder with data summary
 * - kpi: KPI metric cards from structured data
 * - table: Data table from structured data
 * - callout: Colored callout box based on variant
 * - component: Clickable component placeholder
 *
 * Non-text sections (chart, kpi, table, callout, component) are annotated with
 * data-docview-target, data-section-index, and data-target-type attributes to
 * support multi-granularity annotation targeting.
 */
export function SectionRenderer({ sections, onTargetClick, annotations }: SectionRendererProps) {
  /**
   * Handle click on a non-text target element (chart, kpi, table, callout, component).
   * Stops propagation and calls onTargetClick with target metadata and the clicked element.
   */
  const handleTargetClick = (
    e: React.MouseEvent,
    sectionIndex: number,
    targetType: AnnotationTarget['targetType'],
    label: string,
  ) => {
    e.stopPropagation()
    const element = e.currentTarget as HTMLElement
    const targetId = element.getAttribute('data-docview-target') || undefined
    onTargetClick?.({ sectionIndex, targetType, label, targetId }, element)
  }

  return (
    <div style={{ padding: '16px 24px', maxWidth: 900 }}>
      {sections.map((section, index) => {
        switch (section.type) {
          case 'text':
            return renderText(section, index)
          case 'heading':
            return renderHeading(section, index)
          case 'chart':
            return <ChartSection key={`chart-${index}`} section={section} index={index} handleClick={handleTargetClick} onTargetClick={onTargetClick} annotations={annotations} />
          case 'kpi':
            return renderKpi(section, index, handleTargetClick)
          case 'table':
            return renderTable(section, index, handleTargetClick)
          case 'callout':
            return renderCallout(section, index, handleTargetClick)
          case 'component':
            return renderComponent(section, index, handleTargetClick)
          default:
            return null
        }
      })}
    </div>
  )
}

/** Render a text section as a styled paragraph */
function renderText(section: SectionRendererProps['sections'][number], _index: number): React.ReactNode {
  return (
    <p
      key={`text-${_index}`}
      style={{
        color: '#e5e5e5',
        fontSize: 14,
        lineHeight: 1.6,
        marginBottom: 16,
        whiteSpace: 'pre-wrap' as const,
      }}
    >
      {section.content}
    </p>
  )
}

/** Render a heading section at the specified level (h1-h6) */
function renderHeading(section: SectionRendererProps['sections'][number], _index: number): React.ReactNode {
  const level = section.level ?? 2
  const size = headingSizes[Math.min(level, 6) - 1]
  const Tag = `h${Math.min(level, 6)}` as keyof React.JSX.IntrinsicElements

  return (
    <Tag
      key={`heading-${_index}`}
      style={{
        color: '#e5e5e5',
        fontSize: size,
        fontWeight: 700,
        marginBottom: 12,
        marginTop: 24,
        lineHeight: 1.3,
      }}
    >
      {section.content}
    </Tag>
  )
}

/** Chart section that renders an actual ECharts chart when data is available.
 *  Supports two click levels:
 *  - Click on chart empty area/title → whole chart annotation
 *  - Click on specific bar/slice → data-point drill-down annotation
 */
function ChartSection({
  section,
  index,
  handleClick,
  onTargetClick,
  annotations = [],
}: {
  section: SectionRendererProps['sections'][number]
  index: number
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void
  onTargetClick?: (target: AnnotationTarget, element: HTMLElement) => void
  annotations?: Annotation[]
}) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)
  const dataPointClickedRef = useRef(false)
  const data = section.data as Record<string, unknown> | undefined
  const hasChartData = !!(data?.series && Array.isArray(data.series) && (data.series as Array<Record<string, unknown>>[])?.[0]?.data)

  // Initialize ECharts instance and register data point click handler
  useEffect(() => {
    if (!hasChartData || !chartRef.current) return

    const chart = echarts.init(chartRef.current, 'dark')
    chartInstanceRef.current = chart
    const options = buildChartOptions(section.title || '图表', data!)
    chart.setOption(options)

    // Register ECharts click event for data point drill-down
    chart.on('click', (params: any) => {
      if (params.componentType === 'series' && params.seriesIndex !== undefined && params.dataIndex !== undefined) {
        dataPointClickedRef.current = true
        const dp: ChartDataPoint = {
          seriesIndex: params.seriesIndex,
          dataIndex: params.dataIndex,
          name: params.name || '',
          value: params.value ?? '',
        }
        const targetId = `chart-${index}-${params.seriesIndex}-${params.dataIndex}`
        const chartTitle = section.title || '图表'
        const label = `${chartTitle} › ${dp.name}: ${dp.value}`
        const containerEl = chartRef.current?.closest('[data-docview-target]') as HTMLElement
        onTargetClick?.({
          sectionIndex: index,
          targetType: 'chart',
          label,
          targetId,
          chartDataPoint: dp,
        }, containerEl || chartRef.current!)
      }
    })

    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.off('click')
      chart.dispose()
      chartInstanceRef.current = null
    }
  }, [section, data, hasChartData, onTargetClick, index])

  // Highlight annotated data points via ECharts dispatchAction
  useEffect(() => {
    const chart = chartInstanceRef.current
    if (!chart) return

    // Downplay all first
    chart.dispatchAction({ type: 'downplay' })

    // Find annotations targeting data points in this chart
    const chartAnns = annotations.filter(a =>
      a.target?.targetType === 'chart' &&
      a.target?.sectionIndex === index &&
      a.target?.chartDataPoint &&
      a.status !== 'orphaned'
    )

    for (const ann of chartAnns) {
      const dp = ann.target!.chartDataPoint!
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: dp.seriesIndex,
        dataIndex: dp.dataIndex,
      })
    }
  }, [annotations, index])

  return (
    <div
      data-docview-target={`chart-${index}`}
      data-section-index={index}
      data-target-type="chart"
      onClick={(e) => {
        // If a data point was clicked, ECharts handler already processed it
        if (dataPointClickedRef.current) {
          dataPointClickedRef.current = false
          return
        }
        handleClick(e, index, 'chart', section.title || '图表')
      }}
      style={{
        background: '#111',
        border: '1px solid #2a2a4a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#4a4a6a' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a4a' }}
    >
      <span style={{ color: '#888', fontSize: 13, marginBottom: 8, display: 'block' }}>
        {section.title || '图表'}
      </span>
      {hasChartData ? (
        <div ref={chartRef} style={{ width: '100%', height: 250 }} />
      ) : (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 12 }}>
          点击以添加批注
        </div>
      )}
    </div>
  )
}

/** Build ECharts options from section data — merges user data with dark theme defaults */
function buildChartOptions(title: string, data: Record<string, unknown>): Record<string, unknown> {
  const series = data.series as Array<Record<string, unknown>> | undefined
  const seriesType = series?.[0]?.type as string || 'bar'

  return {
    backgroundColor: 'transparent',
    title: { text: '', show: false },
    tooltip: { trigger: seriesType === 'pie' ? 'item' : 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    legend: seriesType === 'pie' ? { bottom: 0, textStyle: { color: '#888', fontSize: 11 } } : undefined,
    ...data,
    series: series?.map((s: Record<string, unknown>) => ({
      ...s,
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
      },
    })),
  }
}

/** Render a KPI section with metric cards from structured data */
function renderKpi(
  section: SectionRendererProps['sections'][number],
  index: number,
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void,
): React.ReactNode {
  /** Parse metrics from section data — expects { metrics: Array<{label, value, color?, change?}> } */
  const metrics = parseKpiMetrics(section.data)

  if (metrics.length > 0) {
    return (
      <div
        key={`kpi-${index}`}
        style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' as const }}
      >
        {metrics.map((metric, mIdx) => (
          <div
            key={`kpi-${index}-${mIdx}`}
            data-docview-target={`kpi-${index}-${mIdx}`}
            data-section-index={index}
            data-target-type="kpi"
            onClick={(e) => handleClick(e, index, 'kpi', metric.label)}
            style={{
              background: '#111',
              border: '1px solid #2a2a4a',
              borderRadius: 8,
              padding: '12px 16px',
              minWidth: 140,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#4a4a6a' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a4a' }}
          >
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{metric.label}</div>
            <div style={{
              fontSize: 24,
              fontWeight: 700,
              color: metric.color || '#e5e5e5',
              lineHeight: 1.2,
            }}>
              {metric.value}
            </div>
            {metric.change && (
              <div style={{
                fontSize: 11,
                color: metric.change.startsWith('-') ? '#ef4444' : '#22c55e',
                marginTop: 4,
              }}>
                {metric.change}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Fallback: single placeholder KPI card from section.content
  return (
    <div
      key={`kpi-${index}`}
      data-docview-target={`kpi-${index}`}
      data-section-index={index}
      data-target-type="kpi"
      onClick={(e) => handleClick(e, index, 'kpi', section.content || 'KPI')}
      style={{
        background: '#111',
        border: '1px solid #2a2a4a',
        borderRadius: 8,
        padding: '12px 16px',
        minWidth: 140,
        cursor: 'pointer',
        marginBottom: 16,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#4a4a6a' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a4a' }}
    >
      <div style={{ fontSize: 12, color: '#888' }}>KPI</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#e5e5e5' }}>{section.content}</div>
    </div>
  )
}

/** Render a table section from structured data (columns + rows) */
function renderTable(
  section: SectionRendererProps['sections'][number],
  index: number,
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void,
): React.ReactNode {
  const tableData = parseTableData(section.data)

  if (tableData) {
    const { columns, rows } = tableData
    return (
      <div
        key={`table-${index}`}
        style={{
          background: '#111',
          border: '1px solid #2a2a4a',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
          <thead>
            <tr>
              {columns.map((col, cIdx) => (
                <th
                  key={`th-${cIdx}`}
                  style={{
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#aaa',
                    background: '#0d0d14',
                    borderBottom: '1px solid #2a2a4a',
                    textAlign: 'left',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={`tr-${rIdx}`}>
                {(Array.isArray(row) ? row : columns.map((_, cIdx) => (row as Record<string, unknown>)[columns[cIdx]] ?? '')).map(
                  (cell: unknown, cIdx: number) => (
                    <td
                      key={`td-${rIdx}-${cIdx}`}
                      data-docview-target={`table-${index}-${rIdx}-${cIdx}`}
                      data-section-index={index}
                      data-target-type="table"
                      onClick={(e) =>
                        handleClick(e, index, 'table', `Row ${rIdx + 1}, Col ${cIdx + 1}`)
                      }
                      style={{
                        padding: '8px 14px',
                        fontSize: 13,
                        color: '#e5e5e5',
                        borderBottom: rIdx < rows.length - 1 ? '1px solid #1a1a2e' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#1a1a2e' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {String(cell)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Fallback: styled content box when no structured data provided
  return (
    <div
      key={`table-${index}`}
      data-docview-target={`table-${index}`}
      data-section-index={index}
      data-target-type="table"
      onClick={(e) => handleClick(e, index, 'table', section.title || 'Table')}
      style={{
        background: '#111',
        border: '1px solid #2a2a4a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#4a4a6a' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a4a' }}
    >
      <span style={{ color: '#888', fontSize: 13 }}>{section.content}</span>
    </div>
  )
}

/** Render a callout section with colored left border based on variant */
function renderCallout(
  section: SectionRendererProps['sections'][number],
  index: number,
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void,
): React.ReactNode {
  const borderColor = variantColors[section.variant || 'neutral'] || '#888'

  return (
    <div
      key={`callout-${index}`}
      data-docview-target={`callout-${index}`}
      data-section-index={index}
      data-target-type="callout"
      onClick={(e) => handleClick(e, index, 'callout', section.content.slice(0, 40) || 'Callout')}
      style={{
        background: '#111',
        borderLeft: `3px solid ${borderColor}`,
        padding: '12px 16px',
        borderRadius: 4,
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#151525' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#111' }}
    >
      <p style={{ color: '#e5e5e5', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
        {section.content}
      </p>
    </div>
  )
}

/** Render a component section as a clickable placeholder */
function renderComponent(
  section: SectionRendererProps['sections'][number],
  index: number,
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void,
): React.ReactNode {
  const label = section.componentType || section.title || 'Component'

  return (
    <div
      key={`component-${index}`}
      data-docview-target={`component-${index}`}
      data-section-index={index}
      data-target-type="component"
      onClick={(e) => handleClick(e, index, 'component', label)}
      style={{
        background: '#111',
        border: '1px solid #2a2a4a',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        cursor: 'pointer',
        minHeight: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#4a4a6a' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a4a' }}
    >
      <span style={{ color: '#888', fontSize: 13 }}>{label}</span>
    </div>
  )
}

// --- Data parsing helpers ---

/** Extract a brief summary string from chart data (e.g., "5 series, 12 data points") */
function extractDataSummary(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  // ECharts-style spec: series array
  if (Array.isArray(obj.series)) {
    const count = obj.series.length
    return `${count} series`
  }
  // Simple array data
  if (Array.isArray(obj.data)) {
    return `${obj.data.length} data points`
  }
  return null
}

/** Parse KPI metrics from section data — expects { metrics: Array<{label, value, color?, change?}> } */
function parseKpiMetrics(data: unknown): Array<{ label: string; value: string; color?: string; change?: string }> {
  if (!data || typeof data !== 'object') return []
  const obj = data as Record<string, unknown>

  if (Array.isArray(obj.metrics)) {
    return obj.metrics
      .filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null)
      .map((m) => ({
        label: String(m.label || ''),
        value: String(m.value ?? ''),
        color: typeof m.color === 'string' ? m.color : undefined,
        change: typeof m.change === 'string' ? m.change : undefined,
      }))
      .filter((m) => m.label && m.value)
  }
  return []
}

/** Parse table data from section data — expects { columns: string[], rows: any[][] | Record<string, any>[] } */
function parseTableData(
  data: unknown,
): { columns: string[]; rows: unknown[][] | Record<string, unknown>[] } | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  if (Array.isArray(obj.columns) && Array.isArray(obj.rows)) {
    return {
      columns: obj.columns.map(String),
      rows: obj.rows as unknown[][] | Record<string, unknown>[],
    }
  }
  return null
}
