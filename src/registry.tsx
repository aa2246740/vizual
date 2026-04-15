import { defineRegistry } from '@json-render/react'
import { renderKitCatalog } from './catalog'

// Chart components (mviz bridge)
import { BarChart } from './mviz-bridge/bar-chart/component'
import { AreaChart } from './mviz-bridge/area/component'
import { LineChart } from './mviz-bridge/line/component'
import { PieChart } from './mviz-bridge/pie/component'
import { ScatterChart } from './mviz-bridge/scatter/component'
import { BubbleChart } from './mviz-bridge/bubble/component'
import { BoxplotChart } from './mviz-bridge/boxplot/component'
import { HistogramChart } from './mviz-bridge/histogram/component'
import { WaterfallChart } from './mviz-bridge/waterfall/component'
import { XmrChart } from './mviz-bridge/xmr/component'
import { SankeyChart } from './mviz-bridge/sankey/component'
import { FunnelChart } from './mviz-bridge/funnel/component'
import { HeatmapChart } from './mviz-bridge/heatmap/component'
import { CalendarChart } from './mviz-bridge/calendar/component'
import { SparklineChart } from './mviz-bridge/sparkline/component'
import { ComboChart } from './mviz-bridge/combo/component'
import { DumbbellChart } from './mviz-bridge/dumbbell/component'
import { MermaidChart } from './mviz-bridge/mermaid/component'

// UI components (mviz bridge)
import { BigValue } from './mviz-bridge/big-value/component'
import { Delta } from './mviz-bridge/delta/component'
import { Alert } from './mviz-bridge/alert/component'
import { Note } from './mviz-bridge/note/component'
import { TextBlock } from './mviz-bridge/text/component'
import { TextArea } from './mviz-bridge/textarea/component'
import { DataTable } from './mviz-bridge/table/component'
import { EmptySpace } from './mviz-bridge/empty-space/component'

// Custom business components
import { Timeline } from './components/timeline/component'
import { Kanban } from './components/kanban/component'
import { GanttChart } from './components/gantt/component'
import { OrgChart } from './components/org-chart/component'
import { KpiDashboard } from './components/kpi-dashboard/component'
import { BudgetReport } from './components/budget-report/component'
import { FeatureTable } from './components/feature-table/component'
import { AuditLog } from './components/audit-log/component'
import { JsonViewer } from './components/json-viewer/component'
import { CodeBlock } from './components/code-block/component'
import { FormView } from './components/form-view/component'

/**
 * AI RenderKit registry — 37 React components mapped to catalog schemas
 */
export const { registry } = defineRegistry(renderKitCatalog, {
  components: {
    BarChart, AreaChart, LineChart, PieChart, ScatterChart, BubbleChart,
    BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart,
    FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart,
    DumbbellChart, MermaidDiagram: MermaidChart,
    BigValue, Delta, Alert, Note, TextBlock, TextArea, DataTable, EmptySpace,
    Timeline, Kanban, GanttChart, OrgChart, KpiDashboard, BudgetReport,
    FeatureTable, AuditLog, JsonViewer, CodeBlock, FormView,
  },
})
