import type { WaterfallChartProps } from './schema'
import { createEChartsBridge } from '../../core/echarts-bridge-factory'
import { tc } from '../../core/theme-colors'

/**
 * Waterfall chart — uses ECharts `type: 'custom'` with renderItem for
 * guaranteed floating bars + connector lines between consecutive bars.
 *
 * Bar types:
 *   - First item     → full bar from 0 (accent color, starting value)
 *   - value > 0      → floating bar going up (green)
 *   - value < 0      → floating bar going down (red)
 *   - value = 0      → subtotal/total bar from 0 (accent color)
 *
 * Connector lines (dashed) link each bar's endpoint to the next bar's start,
 * making the waterfall flow visually obvious.
 */
function buildWaterfallFallback(props: WaterfallChartProps): Record<string, unknown> {
  const category = props.x ?? props.label ?? 'name'
  const valueField = props.y ?? props.value ?? 'value'
  const yFields = Array.isArray(valueField) ? valueField : [valueField]
  const field = yFields[0]

  const data = props.data
  const categories = data.map(d => String(d[category] ?? ''))

  const accentColor = tc('--rk-accent')
  const posColor = tc('--rk-success')
  const negColor = tc('--rk-error')
  const textColor = tc('--rk-text-secondary')
  const borderColor = tc('--rk-border-subtle')

  // Calculate bar positions: [categoryIndex, startValue, endValue, color, label]
  let running = 0
  interface BarInfo { start: number; end: number; color: string; label: string }
  const bars: BarInfo[] = []

  for (let i = 0; i < data.length; i++) {
    const val = Number(data[i][field]) || 0
    const isFirst = i === 0
    const isSummary = val === 0 && !isFirst

    if (isFirst) {
      bars.push({ start: 0, end: val, color: accentColor, label: String(val) })
      running = val
    } else if (isSummary) {
      bars.push({ start: 0, end: running, color: accentColor, label: String(running) })
      // running stays the same — summary bar resets the baseline visually
    } else if (val >= 0) {
      bars.push({ start: running, end: running + val, color: posColor, label: '+' + val })
      running += val
    } else {
      bars.push({ start: running + val, end: running, color: negColor, label: String(val) })
      running += val
    }
  }

  // Build custom series data: [categoryIndex, start, end, colorIndex]
  // colorIndex: 0=accent, 1=green, 2=red — used in renderItem
  const colorMap: Record<string, number> = {}
  const colors = [accentColor, posColor, negColor]
  colors.forEach((c, idx) => { if (c) colorMap[c] = idx })

  const customData = bars.map((b, i) => [i, b.start, b.end, colorMap[b.color] ?? 0])

  return {
    title: props.title ? {
      text: props.title,
      left: 'center',
      textStyle: { color: tc('--rk-text-primary'), fontSize: 14 },
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const idx = p.dataIndex
        const bar = bars[idx]
        if (!bar) return ''
        const diff = bar.end - bar.start
        return `<b>${categories[idx]}</b><br/>` +
          `值: ${bar.label}<br/>` +
          (bar.start > 0 ? `范围: ${bar.start} → ${bar.end}` : `总计: ${bar.end}`)
      },
    },
    grid: { left: 60, right: 20, top: props.title ? 40 : 20, bottom: 50 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: textColor, fontSize: 10, rotate: categories.length > 6 ? 25 : 0 },
    },
    yAxis: {
      type: 'value',
      max: Math.max(...bars.map(b => b.end), ...bars.map(b => b.start)) * 1.1 || undefined,
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: borderColor } },
    },
    series: [
      // Main bars via custom renderItem — guaranteed floating
      {
        type: 'custom',
        renderItem: (_params: any, api: any) => {
          const categoryIdx = api.value(0)
          const start = api.value(1)
          const end = api.value(2)
          const colorIdx = api.value(3)

          const startCoord = api.coord([categoryIdx, start])
          const endCoord = api.coord([categoryIdx, end])
          const bandWidth = api.size([1, 0])[0]
          const barWidth = bandWidth * 0.45

          const rectShape = {
            x: startCoord[0] - barWidth / 2,
            y: endCoord[1],
            width: barWidth,
            height: startCoord[1] - endCoord[1],
          }

          return {
            type: 'rect',
            shape: rectShape,
            style: {
              fill: colors[colorIdx],
              stroke: 'transparent',
            },
            // Label on top
            label: {
              show: true,
              position: 'top',
              formatter: () => bars[categoryIdx]?.label ?? '',
              fontSize: 11,
              color: textColor,
              distance: 4,
              x: startCoord[0],
              y: Math.min(startCoord[1], endCoord[1]) - 4,
            },
          }
        },
        data: customData,
        z: 100,
      },
      // Connector lines between consecutive bars
      {
        type: 'custom',
        renderItem: (_params: any, api: any) => {
          const idx = api.value(0)
          if (idx >= bars.length - 1) return { type: 'group', children: [] }

          const current = bars[idx]
          const next = bars[idx + 1]
          if (!current || !next) return { type: 'group', children: [] }

          // Connector goes from current bar's top endpoint to next bar's start
          const fromY = current.end
          const toY = next.start

          const fromCoord = api.coord([idx, fromY])
          const toCoord = api.coord([idx + 1, toY])

          return {
            type: 'group',
            children: [{
              type: 'line',
              shape: { x1: fromCoord[0], y1: fromCoord[1], x2: toCoord[0], y2: toCoord[1] },
              style: {
                stroke: textColor,
                lineWidth: 1,
                lineDash: [4, 3],
                opacity: 0.4,
              },
            }],
          }
        },
        data: bars.map((_, i) => [i]),
        z: 50,
        silent: true,
      },
    ],
  }
}

export const WaterfallChart = createEChartsBridge('waterfall', buildWaterfallFallback)
