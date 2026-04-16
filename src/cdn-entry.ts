/**
 * CDN Entry — ai-render-kit
 *
 * When loaded via <script> tag, exposes window.AIRenderKit with:
 *   - registry: json-render registry (37 components)
 *   - renderKitCatalog: catalog (has .prompt() for AI)
 *   - all 37 component classes + schemas
 *   - renderSpec(spec, container): convenience function
 */
import { registry } from './registry'
import { renderKitCatalog } from './catalog'
import * as echarts from 'echarts'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { Renderer, JSONUIProvider } from '@json-render/react'

// Re-export everything from index
export { renderKitCatalog } from './catalog'
export { registry } from './registry'
export { EChartsWrapper } from './core/echarts-wrapper'

// Charts
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
export { SankeyChart, SankeyChartSchema } from './mviz-bridge/sankey'
export { FunnelChart, FunnelChartSchema } from './mviz-bridge/funnel'
export { HeatmapChart, HeatmapChartSchema } from './mviz-bridge/heatmap'
export { CalendarChart, CalendarChartSchema } from './mviz-bridge/calendar'
export { SparklineChart, SparklineChartSchema } from './mviz-bridge/sparkline'
export { ComboChart, ComboChartSchema } from './mviz-bridge/combo'
export { DumbbellChart, DumbbellChartSchema } from './mviz-bridge/dumbbell'
export { MermaidChart, MermaidSchema } from './mviz-bridge/mermaid'

// UI
export { BigValue, BigValueSchema } from './mviz-bridge/big-value'
export { Delta, DeltaSchema } from './mviz-bridge/delta'
export { Alert, AlertSchema } from './mviz-bridge/alert'
export { Note, NoteSchema } from './mviz-bridge/note'
export { TextBlock, TextBlockSchema } from './mviz-bridge/text'
export { TextArea, TextAreaSchema } from './mviz-bridge/textarea'
export { DataTable, DataTableSchema } from './mviz-bridge/table'
export { EmptySpace, EmptySpaceSchema } from './mviz-bridge/empty-space'

// Business
export { Timeline, TimelineSchema } from './components/timeline'
export { Kanban, KanbanSchema } from './components/kanban'
export { GanttChart, GanttChartSchema } from './components/gantt'
export { OrgChart, OrgChartSchema } from './components/org-chart'
export { KpiDashboard, KpiDashboardSchema } from './components/kpi-dashboard'
export { BudgetReport, BudgetReportSchema } from './components/budget-report'
export { FeatureTable, FeatureTableSchema } from './components/feature-table'
export { AuditLog, AuditLogSchema } from './components/audit-log'
export { JsonViewer, JsonViewerSchema } from './components/json-viewer'
export { CodeBlock, CodeBlockSchema } from './components/code-block'
export { FormView, FormViewSchema } from './components/form-view'

/**
 * Convenience: render a spec into a DOM container.
 *
 * Usage (CDN):
 *   AIRenderKit.renderSpec(spec, document.getElementById('app'))
 */
export function renderSpec(spec: any, container: HTMLElement) {
  const root = createRoot(container)
  root.render(
    createElement(JSONUIProvider, { registry },
      createElement(Renderer, { spec, registry })
    )
  )
  return root
}
