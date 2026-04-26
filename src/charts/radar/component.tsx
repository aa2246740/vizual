import type { RadarChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'
import { tcss, tc } from '../../core/theme-colors'

/**
 * Build ECharts radar option from schema props.
 *
 * Two input modes:
 * 1. indicators + series — direct mapping to ECharts radar config
 * 2. data + x + y — auto-extract dimensions and values from flat table
 */
function buildRadarFallback(props: RadarChartProps): Record<string, unknown> {
  // Mode 1: indicators + series provided directly
  if (props.indicators && props.indicators.length > 0) {
    const indicators = props.indicators.map(ind => ({
      name: ind.name,
      max: ind.max ?? 100,
    }))
    const seriesData = (props.series ?? []).map(s => ({
      value: s.values,
      name: s.name ?? '',
    }))

    const hasTitle = !!props.title
    const hasLegend = seriesData.length > 1

    return {
      title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
      tooltip: {},
      legend: hasLegend ? { bottom: 0, left: 'center' } : undefined,
      radar: {
        indicator: indicators,
        center: ['50%', '54%'],
        radius: '60%',
        name: {
          textStyle: {
            fontSize:parseInt(tc('--rk-text-sm')),
          },
        },
      },
      series: [{
        type: 'radar',
        data: seriesData,
      }],
    }
  }

  // Mode 2: flat table data — auto-extract
  const xField = props.x ?? 'name'
  const yFields = Array.isArray(props.y) ? props.y : [props.y ?? 'value']
  const data = Array.isArray(props.data) ? props.data : []

  // Dimensions are unique x values, each becomes a radar axis
  const dimensions = [...new Set(data.map(d => String(d[xField] ?? '')))]
  if (dimensions.length === 0) {
    return {
      title: props.title ? { text: props.title, top: 0, left: 'center' } : undefined,
      tooltip: {},
      radar: { indicator: [{ name: '-', max: 100 }] },
      series: [{ type: 'radar', data: [] }],
    }
  }

  // Compute max per dimension for radar axes
  const maxPerDim = dimensions.map(dim => {
    let max = 0
    for (const d of data) {
      if (String(d[xField] ?? '') !== dim) continue
      for (const f of yFields) {
        const v = Number(d[f]) || 0
        if (v > max) max = v
      }
    }
    return max
  })

  const indicators = dimensions.map((dim, i) => ({
    name: dim,
    max: maxPerDim[i] > 0 ? Math.ceil(maxPerDim[i] * 1.1) : 100,
  }))

  // Each yField becomes a series; values ordered by dimension
  const seriesData = yFields.map(field => ({
    value: dimensions.map(dim => {
      const row = data.find(d => String(d[xField] ?? '') === dim)
      return row ? Number(row[field]) || 0 : 0
    }),
    name: field,
  }))

  const hasTitle = !!props.title
  const hasLegend = yFields.length > 1

  return {
    title: hasTitle ? { text: props.title, top: 0, left: 'center' } : undefined,
    tooltip: {},
    legend: hasLegend ? { bottom: 0, left: 'center' } : undefined,
    radar: {
      indicator: indicators,
      center: ['50%', '54%'],
      radius: '60%',
      name: {
        textStyle: {
          fontSize:parseInt(tc('--rk-text-sm')),
        },
      },
    },
    series: [{
      type: 'radar',
      data: seriesData,
    }],
  }
}

export const RadarChart = createEChartsBridge('radar', buildRadarFallback)
