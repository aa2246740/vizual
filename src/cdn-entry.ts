/**
 * CDN Entry — Vizual
 *
 * Standalone build entry. When loaded via <script> tag, exposes window.Vizual with:
 *   - React, ReactDOM, ReactDOMClient: React runtime
 *   - echarts: ECharts runtime
 *   - registry: json-render registry (32 components)
 *   - all component classes + schemas + DocView + hooks
 *   - renderSpec(spec, container): convenience function
 *
 * @deprecated renderKitCatalog.prompt() is deprecated. Use the vizual skill
 *   for AI integration instead. See: https://github.com/aa2246740/vizual
 */
import { registry } from './registry'
import { renderKitCatalog } from './catalog'
import * as echarts from 'echarts'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import { Renderer, StateProvider, JSONUIProvider } from '@json-render/react'

// Expose React runtimes for standalone consumers
export { React, ReactDOM, ReactDOMClient, echarts }

// Theme system (DESIGN.md support + Dark/Light mode toggle)
export { loadDesignMd, setGlobalTheme, applyTheme, registerTheme, getTheme, getThemeNames, toggleMode, getCurrentThemeName } from './themes'
export { parseDesignMd, mapDesignTokensToTheme, invertTheme } from './themes'
export { tc, tcss, chartColors } from './core/theme-colors'

// Export API
export {
  exportToPNG,
  downloadPNG,
} from './core/export'

// Catalog + Registry
export { renderKitCatalog } from './catalog'
export { registry } from './registry'
export { EChartsWrapper } from './core/echarts-wrapper'

// Charts (19) — mviz bridge
export { BarChart, BarChartSchema } from './mviz-bridge/bar-chart'
export { AreaChart, AreaChartSchema } from './mviz-bridge/area'
export { LineChart, LineChartSchema } from './mviz-bridge/line'
export { PieChart, PieChartSchema } from './mviz-bridge/pie'
export { ScatterChart, ScatterChartSchema } from './mviz-bridge/scatter'
export { BubbleChart, BubbleChartSchema } from './mviz-bridge/bubble'
export { BoxplotChart, BoxplotChartSchema } from './mviz-bridge/boxplot'
export { HistogramChart, HistogramChartSchema } from './mviz-bridge/histogram'
export { WaterfallChart, WaterfallChartSchema } from './mviz-bridge/waterfall'
export { XmrChart, XmrChartSchema } from './mviz-bridge/xmr'
export { SankeyChart, SankeySchema } from './mviz-bridge/sankey'
export { FunnelChart, FunnelChartSchema } from './mviz-bridge/funnel'
export { HeatmapChart, HeatmapChartSchema } from './mviz-bridge/heatmap'
export { CalendarChart, CalendarChartSchema } from './mviz-bridge/calendar'
export { SparklineChart, SparklineChartSchema } from './mviz-bridge/sparkline'
export { ComboChart, ComboChartSchema } from './mviz-bridge/combo'
export { DumbbellChart, DumbbellChartSchema } from './mviz-bridge/dumbbell'
export { RadarChart, RadarChartSchema } from './mviz-bridge/radar'
export { MermaidChart, MermaidSchema } from './mviz-bridge/mermaid'

// UI (1) — mviz bridge
export { DataTable, DataTableSchema } from './mviz-bridge/table'

// Business components (6)
export { Timeline, TimelineSchema } from './components/timeline'
export { Kanban, KanbanSchema } from './components/kanban'
export { GanttChart, GanttChartSchema } from './components/gantt'
export { OrgChart, OrgChartSchema } from './components/org-chart'
export { KpiDashboard, KpiDashboardSchema } from './components/kpi-dashboard'
export { AuditLog, AuditLogSchema } from './components/audit-log'

// Interactive input components (1)
export { FormBuilder, FormBuilderSchema } from './inputs/form-builder'

// Layout components (3)
export { GridLayout, GridLayoutSchema } from './components/grid-layout'
export { SplitLayout, SplitLayoutSchema } from './components/split-layout'
export { HeroLayout, HeroLayoutSchema } from './components/hero-layout'

// DocView (1)
export { DocView } from './docview/container'
export { DocViewSchema } from './docview/schema'
export { SectionRenderer } from './docview/section-renderer'
export { useAnnotations } from './docview/use-annotations'
export { useTextSelection } from './docview/use-text-selection'
export { useRevisionLoop } from './docview/use-revision-loop'
export { useVersionHistory } from './docview/use-version-history'
export { AnnotationOverlay } from './docview/annotation-overlay'
export { AnnotationPanel } from './docview/annotation-panel'
export { AnnotationInput } from './docview/annotation-input'
export { ANNOTATION_COLORS } from './docview/types'
export type { AnnotationTarget } from './docview/types'
export type { DocViewProps } from './docview/types'

/**
 * Convenience: render a spec into a DOM container.
 *
 * Usage (CDN):
 *   Vizual.renderSpec(spec, document.getElementById('app'))
 */
export function renderSpec(spec: any, container: HTMLElement) {
  const root = ReactDOMClient.createRoot(container)
  root.render(
    React.createElement(JSONUIProvider, { registry } as any,
      React.createElement(Renderer, { spec, registry })
    )
  )
  return root
}
