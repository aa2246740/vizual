import React, { useRef, useEffect, useMemo } from 'react'
import * as echarts from 'echarts'
import type { AnnotationTarget, Annotation, ChartDataPoint } from './types'
import { tcss, tc } from '../core/theme-colors'
import { renderMarkdown } from './markdown-renderer'
import { renderFreeform } from './freeform-renderer'
import { wrapWithLayout } from './layout-wrappers'
import { AnnotationContext } from './annotation-context'
import { getSectionId } from './review-sdk'
import { registry } from '../registry'

/** Props for the SectionRenderer component */
export interface SectionRendererProps {
  /** Sections array from DocViewSchema */
  sections: Array<{
    type: string
    id?: string
    content: string
    data?: unknown
    level?: number
    variant?: string
    componentType?: string
    title?: string
    aiContext?: string
    layout?: string
  }>
  /** Called when user clicks a non-text element to annotate it */
  onTargetClick?: (target: AnnotationTarget, element: HTMLElement) => void
  /** Current annotations for highlighting annotated data points in charts */
  annotations?: Annotation[]
}

/** Variant-to-color mapping for callout sections — tcss() is naturally reactive */
const variantColors: Record<string, string> = {
  info: tcss('--rk-accent'),
  warning: '#fbbf24',
  success: tcss('--rk-success'),
  error: tcss('--rk-error'),
  neutral: tcss('--rk-text-secondary'),
}

/** Heading font sizes by level (h1=32px down to h6=14px) */
const headingSizes = [32, 24, 20, 18, 16, 14]

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  return JSON.stringify(value, (_key, val) => {
    if (!val || typeof val !== 'object') return val
    if (seen.has(val)) return '[Circular]'
    seen.add(val)
    if (Array.isArray(val)) return val
    return Object.keys(val as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = (val as Record<string, unknown>)[key]
        return acc
      }, {})
  }) ?? ''
}

function targetSuffix(section: SectionRendererProps['sections'][number], index: number): string {
  return typeof section.id === 'string' && section.id.trim() ? section.id : String(index)
}

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
 * Sections are annotated with
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
    const section = sections[sectionIndex]
    const targetId = element.getAttribute('data-docview-target') || undefined
    const tableCell = targetType === 'table' && element.hasAttribute('data-row-index')
      ? {
          rowIndex: parseInt(element.getAttribute('data-row-index') || '0', 10),
          columnIndex: parseInt(element.getAttribute('data-column-index') || '0', 10),
          isHeader: element.getAttribute('data-table-cell-kind') === 'header',
          rowKey: element.getAttribute('data-row-key') || undefined,
          columnKey: element.getAttribute('data-column-key') || undefined,
          value: element.getAttribute('data-cell-value') || undefined,
        }
      : undefined
    onTargetClick?.({
      sectionIndex,
      sectionId: getSectionId(section, sectionIndex),
      targetType,
      label,
      targetId,
      targetPath: targetId ? `[data-docview-target="${targetId}"]` : undefined,
      tableCell,
    }, element)
  }

  return (
    <div style={{ padding: '16px 24px', maxWidth: 900, background: tcss('--rk-bg-primary'), minHeight: '100%' }}>
      {sections.map((section, index) => {
        let content: React.ReactNode
        switch (section.type) {
          case 'text':
            content = renderText(section, index)
            break
          case 'heading':
            content = renderHeading(section, index)
            break
          case 'chart':
            content = <ChartSection key={`chart-${index}`} section={section} index={index} handleClick={handleTargetClick} onTargetClick={onTargetClick} annotations={annotations} />
            break
          case 'kpi':
            content = renderKpi(section, index, handleTargetClick)
            break
          case 'table':
            content = renderTable(section, index, handleTargetClick)
            break
          case 'callout':
            content = renderCallout(section, index, handleTargetClick)
            break
          case 'component':
            content = renderComponent(section, index, handleTargetClick, onTargetClick, annotations)
            break
          case 'markdown':
            content = renderMarkdown(section, index)
            break
          case 'freeform':
            content = renderFreeform(section, index)
            break
          default:
            return null
        }
        return wrapWithLayout(section, index, content, section.layout)
      })}
    </div>
  )
}

/** Render a text section as a styled paragraph */
function renderText(section: SectionRendererProps['sections'][number], _index: number): React.ReactNode {
  const suffix = targetSuffix(section, _index)
  return (
    <p
      key={`text-${_index}`}
      data-docview-target={`text-${suffix}`}
      data-section-index={_index}
      data-section-id={getSectionId(section, _index)}
      data-target-type="text"
      style={{
        color: tcss('--rk-text-primary'),
        fontSize:tcss('--rk-text-md'),
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
  const suffix = targetSuffix(section, _index)

  return (
    <Tag
      key={`heading-${_index}`}
      data-docview-target={`heading-${suffix}`}
      data-section-index={_index}
      data-section-id={getSectionId(section, _index)}
      data-target-type="heading"
      style={{
        color: tcss('--rk-text-primary'),
        fontSize: size,
        fontWeight:tcss('--rk-weight-bold'),
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
  const onTargetClickRef = useRef(onTargetClick)
  const indexRef = useRef(index)
  const titleRef = useRef(section.title || '图表')
  const rawData = section.data as Record<string, unknown> | undefined
  const registryChart = resolveRegistryChartData(rawData, section.title)
  // Normalize chart data: support both ECharts format and Vizual field-mapped format
  const data = normalizeChartData(rawData)
  const dataKey = stableStringify(data)
  const chartOptions = useMemo(
    () => data ? buildChartOptions(section.title || '图表', data) : null,
    [dataKey, section.title],
  )
  const hasChartData = !!(data?.series && Array.isArray(data.series) && ((data.series as Record<string, unknown>[])?.[0] as Record<string, unknown>)?.data != null)

  useEffect(() => {
    onTargetClickRef.current = onTargetClick
    indexRef.current = index
    titleRef.current = section.title || '图表'
  }, [onTargetClick, index, section.title])

  // Initialize ECharts once. Popup/annotation state updates must not dispose
  // and recreate the chart, otherwise ECharts replays its entry animation.
  useEffect(() => {
    if (!hasChartData || !chartRef.current) return
    const chart = echarts.init(chartRef.current, 'dark')
    chartInstanceRef.current = chart

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
        const targetId = `chart-${targetSuffix(section, indexRef.current)}-${params.seriesIndex}-${params.dataIndex}`
        const chartTitle = titleRef.current
        const label = `${chartTitle} › ${dp.name}: ${dp.value}`
        const containerEl = chartRef.current?.closest('[data-docview-target]') as HTMLElement
        onTargetClickRef.current?.({
          sectionIndex: indexRef.current,
          sectionId: getSectionId(section, indexRef.current),
          targetType: 'chart',
          label,
          targetId,
          targetPath: `[data-docview-target="chart-${targetSuffix(section, indexRef.current)}"]`,
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
  }, [hasChartData])

  // Only update chart data/options when the chart spec itself changes.
  useEffect(() => {
    if (!chartInstanceRef.current || !chartOptions) return
    chartInstanceRef.current.setOption(chartOptions, true)
  }, [chartOptions])

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
      a.status !== 'orphaned' &&
      a.status !== 'resolved'
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

  if (registryChart) {
    const Component = registry[registryChart.componentType] as React.ComponentType<any> | undefined
    if (Component) {
      const contextValue = {
        sectionIndex: index,
        sectionId: getSectionId(section, index),
        componentType: registryChart.componentType,
        title: section.title || (registryChart.props.title as string | undefined),
        onTargetClick: (target: AnnotationTarget, element: HTMLElement) => {
          const targetId = target.targetId || element.getAttribute('data-docview-target') || undefined
          onTargetClick?.({
            ...target,
            sectionId: target.sectionId || getSectionId(section, index),
            targetId,
            targetPath: target.targetPath || (targetId ? `[data-docview-target="${targetId}"]` : undefined),
          }, element)
        },
        annotations,
      }

      return (
        <AnnotationContext.Provider key={`chart-ctx-${index}`} value={contextValue}>
          <div
            data-docview-target={`chart-${targetSuffix(section, index)}`}
            data-section-index={index}
            data-section-id={getSectionId(section, index)}
            data-target-type="chart"
            style={{ marginBottom: 16, position: 'relative' }}
          >
            <Component element={{ type: registryChart.componentType, props: registryChart.props, children: [] }} props={registryChart.props} children={[]} />
          </div>
        </AnnotationContext.Provider>
      )
    }
  }

  return (
    <div
      data-docview-target={`chart-${targetSuffix(section, index)}`}
      data-section-index={index}
      data-section-id={getSectionId(section, index)}
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
        background: tcss('--rk-bg-primary'),
        border: `1px solid ${tcss('--rk-border-subtle')}`,
        borderRadius:tcss('--rk-radius-md'),
        padding: tcss('--rk-space-4'),
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border') }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border-subtle') }}
    >
      <span style={{ color: tcss('--rk-text-secondary'), fontSize:tcss('--rk-text-base'), marginBottom: 8, display: 'block' }}>
        {section.title || '图表'}
      </span>
      {hasChartData ? (
        <div ref={chartRef} style={{ width: '100%', height: 250 }} />
      ) : (
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tcss('--rk-text-tertiary'), fontSize:tcss('--rk-text-sm') }}>
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
  const useShadowEmphasis = tc('--rk-shadow').trim() !== 'none'

  return {
    backgroundColor: 'transparent',
    title: { text: '', show: false },
    tooltip: { trigger: seriesType === 'pie' ? 'item' : 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    legend: seriesType === 'pie' ? { bottom: 0, textStyle: { color: tc('--rk-text-secondary'), fontSize:parseInt(tc('--rk-text-xs')) } } : undefined,
    ...data,
    series: series?.map((s: Record<string, unknown>) => {
      if (!useShadowEmphasis) return { ...s }
      const emphasis = s.emphasis && typeof s.emphasis === 'object' && !Array.isArray(s.emphasis)
        ? s.emphasis as Record<string, unknown>
        : {}
      const itemStyle = emphasis.itemStyle && typeof emphasis.itemStyle === 'object' && !Array.isArray(emphasis.itemStyle)
        ? emphasis.itemStyle as Record<string, unknown>
        : {}
      return {
        ...s,
        emphasis: {
          ...emphasis,
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.5)',
            ...itemStyle,
          },
        },
      }
    }),
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
  const suffix = targetSuffix(section, index)

  if (metrics.length > 0) {
    return (
      <div
        key={`kpi-${index}`}
        style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' as const }}
      >
        {metrics.map((metric, mIdx) => (
          <div
            key={`kpi-${index}-${mIdx}`}
            data-docview-target={`kpi-${suffix}-${mIdx}`}
            data-section-index={index}
            data-section-id={getSectionId(section, index)}
            data-target-type="kpi"
            onClick={(e) => handleClick(e, index, 'kpi', metric.label)}
            style={{
              background: tcss('--rk-bg-primary'),
              border: `1px solid ${tcss('--rk-border-subtle')}`,
              borderRadius:tcss('--rk-radius-md'),
              padding: '12px 16px',
              minWidth: 140,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border') }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border-subtle') }}
          >
            <div style={{ fontSize:tcss('--rk-text-sm'), color: tcss('--rk-text-secondary'), marginBottom: 4 }}>{metric.label}</div>
            <div style={{
              fontSize:tcss('--rk-text-2xl'),
              fontWeight:tcss('--rk-weight-bold'),
              color: metric.color || tcss('--rk-text-primary'),
              lineHeight: 1.2,
            }}>
              {metric.value}
            </div>
            {metric.change && (
              <div style={{
                fontSize:parseInt(tc('--rk-text-xs')),
                color: (metric.change.startsWith('-') || metric.change.includes('↓')) ? tcss('--rk-error') : tcss('--rk-success'),
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
      data-docview-target={`kpi-${suffix}`}
      data-section-index={index}
      data-section-id={getSectionId(section, index)}
      data-target-type="kpi"
      onClick={(e) => handleClick(e, index, 'kpi', section.content || 'KPI')}
      style={{
        background: tcss('--rk-bg-primary'),
        border: `1px solid ${tcss('--rk-border-subtle')}`,
        borderRadius:tcss('--rk-radius-md'),
        padding: '12px 16px',
        minWidth: 140,
        cursor: 'pointer',
        marginBottom: 16,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border') }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border-subtle') }}
    >
      <div style={{ fontSize:tcss('--rk-text-sm'), color: tcss('--rk-text-secondary') }}>KPI</div>
      <div style={{ fontSize:tcss('--rk-text-2xl'), fontWeight:tcss('--rk-weight-bold'), color: tcss('--rk-text-primary') }}>{section.content}</div>
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
  const suffix = targetSuffix(section, index)

  if (tableData) {
    const { columns, rows } = tableData
    return (
      <div
        key={`table-${index}`}
        style={{
          background: tcss('--rk-bg-primary'),
          border: `1px solid ${tcss('--rk-border-subtle')}`,
          borderRadius:tcss('--rk-radius-md'),
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
                  data-docview-target={`table-${suffix}-header-${cIdx}`}
                  data-section-index={index}
                  data-section-id={getSectionId(section, index)}
                  data-target-type="table"
                  data-row-index={-1}
                  data-column-index={cIdx}
                  data-table-cell-kind="header"
                  data-column-key={col}
                  data-cell-value={col}
                  onClick={(e) =>
                    handleClick(e, index, 'table', `Header: ${col}`)
                  }
                  style={{
                    padding: '10px 14px',
                    fontSize:tcss('--rk-text-sm'),
                    fontWeight:tcss('--rk-weight-semibold'),
                    color: tcss('--rk-text-secondary'),
                    background: tcss('--rk-bg-primary'),
                    borderBottom: `1px solid ${tcss('--rk-border-subtle')}`,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-secondary') }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-primary') }}
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
                  (cell: unknown, cIdx: number) => {
                    const rowObj = !Array.isArray(row) && row && typeof row === 'object' ? row as Record<string, unknown> : undefined
                    const rowKey = rowObj ? rowObj.id ?? rowObj.key ?? rowObj.name ?? rowObj[columns[0]] : undefined
                    const columnKey = columns[cIdx]
                    return (
                    <td
                      key={`td-${rIdx}-${cIdx}`}
                      data-docview-target={`table-${suffix}-${rIdx}-${cIdx}`}
                      data-section-index={index}
                      data-section-id={getSectionId(section, index)}
                      data-target-type="table"
                      data-row-index={rIdx}
                      data-column-index={cIdx}
                      data-row-key={rowKey == null ? undefined : String(rowKey)}
                      data-column-key={columnKey}
                      data-cell-value={String(cell)}
                      onClick={(e) =>
                        handleClick(e, index, 'table', `${columnKey}: ${String(cell)}`)
                      }
                      style={{
                        padding: '8px 14px',
                        fontSize:tcss('--rk-text-base'),
                        color: tcss('--rk-text-primary'),
                        borderBottom: rIdx < rows.length - 1 ? `1px solid ${tcss('--rk-border-subtle')}` : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-secondary') }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {String(cell)}
                    </td>
                    )
                  },
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
      data-docview-target={`table-${suffix}`}
      data-section-index={index}
      data-section-id={getSectionId(section, index)}
      data-target-type="table"
      onClick={(e) => handleClick(e, index, 'table', section.title || 'Table')}
      style={{
        background: tcss('--rk-bg-primary'),
        border: `1px solid ${tcss('--rk-border-subtle')}`,
        borderRadius:tcss('--rk-radius-md'),
        padding: tcss('--rk-space-4'),
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border') }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border-subtle') }}
    >
      <span style={{ color: tcss('--rk-text-secondary'), fontSize:tcss('--rk-text-base') }}>{section.content}</span>
    </div>
  )
}

/** Render a callout section with colored left border based on variant */
function renderCallout(
  section: SectionRendererProps['sections'][number],
  index: number,
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void,
): React.ReactNode {
  const borderColor = variantColors[section.variant || 'neutral'] || tcss('--rk-text-secondary')
  const suffix = targetSuffix(section, index)

  return (
    <div
      key={`callout-${index}`}
      data-docview-target={`callout-${suffix}`}
      data-section-index={index}
      data-section-id={getSectionId(section, index)}
      data-target-type="callout"
      onClick={(e) => handleClick(e, index, 'callout', section.content.slice(0, 40) || 'Callout')}
      style={{
        background: tcss('--rk-bg-primary'),
        borderLeft: `3px solid ${borderColor}`,
        padding: '12px 16px',
        borderRadius:tcss('--rk-radius-sm'),
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-secondary') }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-primary') }}
    >
      <p style={{ color: tcss('--rk-text-primary'), fontSize:tcss('--rk-text-md'), lineHeight: 1.5, margin: 0 }}>
        {section.content}
      </p>
    </div>
  )
}

/**
 * 渲染 component section 为真实的 Vizual 组件。
 *
 * 流程：
 * 1. 通过 registry 查找 componentType 对应的组件
 * 2. 用 AnnotationContext.Provider 包裹，传入 sectionIndex 和 onTargetClick
 * 3. 组件内部通过 useAnnotationContext() 感知 DocView 环境，自动启用批注
 * 4. 如果组件未注册，降级为占位符
 */
function renderComponent(
  section: SectionRendererProps['sections'][number],
  index: number,
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void,
  onTargetClickProp?: (target: AnnotationTarget, element: HTMLElement) => void,
  annotations?: Annotation[],
): React.ReactNode {
  const componentType = section.componentType
  const label = componentType || section.title || 'Component'
  const suffix = targetSuffix(section, index)

  // 无 componentType → 占位符
  if (!componentType) {
    return renderComponentPlaceholder(label, index, handleClick)
  }

  // 从 registry 查找真实组件
  const Component = registry[componentType] as React.ComponentType<any> | undefined
  if (!Component) {
    return renderComponentPlaceholder(`Unknown: ${componentType}`, index, handleClick)
  }

  // 构建 AnnotationContext value — 组件内部通过 useAnnotationContext() 消费
  const contextValue = {
    sectionIndex: index,
    sectionId: getSectionId(section, index),
    componentType,
    title: section.title,
    onTargetClick: (target: AnnotationTarget, element: HTMLElement) => {
      const targetId = target.targetId || element.getAttribute('data-docview-target') || undefined
      onTargetClickProp?.({
        ...target,
        sectionId: target.sectionId || getSectionId(section, index),
        targetId,
        targetPath: target.targetPath || (targetId ? `[data-docview-target="${targetId}"]` : undefined),
      }, element)
    },
    annotations,
  }

  // 组件 props 来自 section.data
  const componentProps = (section.data as Record<string, unknown>) ?? {}

  return (
    <AnnotationContext.Provider key={`component-ctx-${index}`} value={contextValue}>
      <div
        data-docview-target={`component-${suffix}`}
        data-section-index={index}
        data-section-id={getSectionId(section, index)}
        data-target-type="component"
        style={{
          marginBottom: 16,
          position: 'relative',
        }}
      >
        <Component element={{ type: componentType, props: componentProps, children: [] }} props={componentProps} children={[]} />
      </div>
    </AnnotationContext.Provider>
  )
}

/** 占位符降级渲染：组件未注册或未指定 componentType 时 */
function renderComponentPlaceholder(
  label: string,
  index: number,
  handleClick: (e: React.MouseEvent, idx: number, type: AnnotationTarget['targetType'], label: string) => void,
): React.ReactNode {
  return (
    <div
      key={`component-${index}`}
      data-docview-target={`component-${index}`}
      data-section-index={index}
      data-section-id={`section-${index}`}
      data-target-type="component"
      onClick={(e) => handleClick(e, index, 'component', label)}
      style={{
        background: tcss('--rk-bg-primary'),
        border: `1px solid ${tcss('--rk-border-subtle')}`,
        borderRadius: tcss('--rk-radius-md'),
        padding: tcss('--rk-space-4'),
        marginBottom: 16,
        cursor: 'pointer',
        minHeight: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border') }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tcss('--rk-border-subtle') }}
    >
      <span style={{ color: tcss('--rk-text-secondary'), fontSize: tcss('--rk-text-base') }}>{label}</span>
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

/**
 * Parse KPI metrics from section data.
 * Accepts two metric field naming conventions:
 *   { metrics: [{ label, value, color?, change? }] }        — canonical format
 *   { metrics: [{ label, value, color?, trend? }] }          — alias format (trend → change)
 * The `trend` field accepts 'up'/'down'/'neutral' strings and is converted
 * to a display-friendly change indicator.
 */
function parseKpiMetrics(data: unknown): Array<{ label: string; value: string; color?: string; change?: string }> {
  if (!data || typeof data !== 'object') return []
  const obj = data as Record<string, unknown>

  if (Array.isArray(obj.metrics)) {
    return obj.metrics
      .filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null)
      .map((m) => {
        const change = typeof m.change === 'string'
          ? m.change
          : typeof m.trend === 'string'
            ? trendToChange(m.trend)
            : undefined
        return {
          label: String(m.label || ''),
          value: String(m.value ?? ''),
          color: typeof m.color === 'string' ? m.color : undefined,
          change,
        }
      })
      .filter((m) => m.label && m.value)
  }
  return []
}

/** Convert trend direction ('up'/'down'/'neutral') to a display string */
function trendToChange(trend: string): string | undefined {
  switch (trend) {
    case 'up': return '+↑'
    case 'down': return '-↓'
    case 'neutral': return '—'
    default: return trend
  }
}

/**
 * Parse table data from section data.
 * Accepts two formats:
 *   1) { columns: string[], rows: any[][] | Record<string,any>[] }   — canonical
 *   2) { columns: [{key,label}], data: Record<string,any>[] }        — object-column format
 * Format 2 is converted to canonical: column labels become headers, rows are extracted by key.
 */
function parseTableData(
  data: unknown,
): { columns: string[]; rows: unknown[][] | Record<string, unknown>[] } | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  // Format 1: columns (string[]) + rows
  if (Array.isArray(obj.columns) && Array.isArray(obj.rows)) {
    return {
      columns: obj.columns.map(String),
      rows: obj.rows as unknown[][] | Record<string, unknown>[],
    }
  }

  // Format 2: columns ([{key,label}]) + data (object rows)
  if (Array.isArray(obj.columns) && Array.isArray(obj.data)) {
    const colDefs = obj.columns as Array<Record<string, unknown>>
    // Check if columns are objects with key/label fields
    const isObjectColumns = colDefs.length > 0 && typeof colDefs[0] === 'object' && colDefs[0] !== null && ('key' in colDefs[0] || 'label' in colDefs[0])
    if (isObjectColumns) {
      const keys = colDefs.map(c => String(c.key ?? ''))
      const labels = colDefs.map(c => String(c.label ?? c.key ?? ''))
      const dataRows = (obj.data as Array<Record<string, unknown>>).map(row =>
        keys.map(k => row[k] ?? '')
      )
      return { columns: labels, rows: dataRows }
    }
  }

  return null
}

/**
 * Normalize chart data to ECharts format.
 * Accepts:
 *   1) ECharts format: { xAxis?, yAxis?, series: [{type, data}] }  — returned as-is
 *   2) field format:   { type, x, y, data: [{xField, yField}] }   — converted to ECharts
 */
function normalizeChartData(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!data || typeof data !== 'object') return data

  // Already ECharts format — has series array
  if (Array.isArray(data.series)) return data

  // Field-mapped format: { type, x, y, data: [...] }
  const yIsString = typeof data.y === 'string'
  const yIsArray = Array.isArray(data.y) && (data.y as unknown[]).every(v => typeof v === 'string')
  if (typeof data.x === 'string' && (yIsString || yIsArray) && Array.isArray(data.data)) {
    const xField = data.x
    const yFields = yIsArray ? data.y as string[] : [data.y as string]
    const items = data.data as Array<Record<string, unknown>>
    const categories = items.map(item => String(item[xField] ?? ''))

    // Multiple y fields → multiple series (first = bar for combo, rest = line)
    const series = yFields.map((yField, i) => ({
      type: i === 0 ? 'bar' : 'line',
      name: yField,
      data: items.map(item => item[yField] ?? 0),
    }))

    return {
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value' },
      series,
    }
  }

  return data
}

const CHART_TYPE_TO_COMPONENT: Record<string, string> = {
  bar: 'BarChart',
  area: 'AreaChart',
  line: 'LineChart',
  pie: 'PieChart',
  scatter: 'ScatterChart',
  bubble: 'BubbleChart',
  boxplot: 'BoxplotChart',
  histogram: 'HistogramChart',
  waterfall: 'WaterfallChart',
  xmr: 'XmrChart',
  sankey: 'SankeyChart',
  funnel: 'FunnelChart',
  heatmap: 'HeatmapChart',
  calendar: 'CalendarChart',
  sparkline: 'SparklineChart',
  combo: 'ComboChart',
  dumbbell: 'DumbbellChart',
  radar: 'RadarChart',
  mermaid: 'MermaidDiagram',
}

const CHART_COMPONENT_TO_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(CHART_TYPE_TO_COMPONENT).map(([type, component]) => [component, type])
)

function normalizeChartComponentName(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined
  if (registry[value]) return value
  return CHART_TYPE_TO_COMPONENT[value]
}

function resolveRegistryChartData(
  data: Record<string, unknown> | undefined,
  sectionTitle?: string,
): { componentType: string; props: Record<string, unknown> } | null {
  if (!data || typeof data !== 'object') return null

  const rawType = data.chartType ?? data.componentType ?? data.type
  const componentType = normalizeChartComponentName(rawType)
  if (!componentType || !registry[componentType]) return null

  const nestedProps = data.props && typeof data.props === 'object' && !Array.isArray(data.props)
    ? data.props as Record<string, unknown>
    : undefined

  const {
    chartType: _chartType,
    componentType: _componentType,
    props: _props,
    children: _children,
    ...rest
  } = data

  const props = {
    ...(nestedProps ?? rest),
  }

  const literalType = CHART_COMPONENT_TO_TYPE[componentType]
  if (literalType && props.type === undefined) {
    props.type = literalType
  }
  if (sectionTitle && props.title === undefined) {
    props.title = sectionTitle
  }

  return { componentType, props }
}
