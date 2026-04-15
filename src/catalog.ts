import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react'

// Chart schemas (mviz bridge)
import { BarChartSchema } from './mviz-bridge/bar-chart/schema'
import { AreaChartSchema } from './mviz-bridge/area/schema'
import { LineChartSchema } from './mviz-bridge/line/schema'
import { PieChartSchema } from './mviz-bridge/pie/schema'
import { ScatterChartSchema } from './mviz-bridge/scatter/schema'
import { BubbleChartSchema } from './mviz-bridge/bubble/schema'
import { BoxplotChartSchema } from './mviz-bridge/boxplot/schema'
import { HistogramChartSchema } from './mviz-bridge/histogram/schema'
import { WaterfallChartSchema } from './mviz-bridge/waterfall/schema'
import { XmrChartSchema } from './mviz-bridge/xmr/schema'
import { SankeyChartSchema } from './mviz-bridge/sankey/schema'
import { FunnelChartSchema } from './mviz-bridge/funnel/schema'
import { HeatmapChartSchema } from './mviz-bridge/heatmap/schema'
import { CalendarChartSchema } from './mviz-bridge/calendar/schema'
import { SparklineChartSchema } from './mviz-bridge/sparkline/schema'
import { ComboChartSchema } from './mviz-bridge/combo/schema'
import { DumbbellChartSchema } from './mviz-bridge/dumbbell/schema'
import { MermaidSchema } from './mviz-bridge/mermaid/schema'

// UI component schemas (mviz bridge)
import { BigValueSchema } from './mviz-bridge/big-value/schema'
import { DeltaSchema } from './mviz-bridge/delta/schema'
import { AlertSchema } from './mviz-bridge/alert/schema'
import { NoteSchema } from './mviz-bridge/note/schema'
import { TextBlockSchema } from './mviz-bridge/text/schema'
import { TextAreaSchema } from './mviz-bridge/textarea/schema'
import { DataTableSchema } from './mviz-bridge/table/schema'
import { EmptySpaceSchema } from './mviz-bridge/empty-space/schema'

// Custom business component schemas
import { TimelineSchema } from './components/timeline/schema'
import { KanbanSchema } from './components/kanban/schema'
import { GanttChartSchema } from './components/gantt/schema'
import { OrgChartSchema } from './components/org-chart/schema'
import { KpiDashboardSchema } from './components/kpi-dashboard/schema'
import { BudgetReportSchema } from './components/budget-report/schema'
import { FeatureTableSchema } from './components/feature-table/schema'
import { AuditLogSchema } from './components/audit-log/schema'
import { JsonViewerSchema } from './components/json-viewer/schema'
import { CodeBlockSchema } from './components/code-block/schema'
import { FormViewSchema } from './components/form-view/schema'

/**
 * AI RenderKit catalog — 26 components registered as json-render visualization catalog
 */
export const renderKitCatalog = defineCatalog(schema, {
  components: {
    // Charts (mviz bridge) — 18
    BarChart: {
      props: BarChartSchema,
      description: 'Bar chart with grouped, stacked, and horizontal variants.',
    },
    AreaChart: {
      props: AreaChartSchema,
      description: 'Area chart with stacked and smooth variants.',
    },
    LineChart: {
      props: LineChartSchema,
      description: 'Line chart with multi-series and smooth variants.',
    },
    PieChart: {
      props: PieChartSchema,
      description: 'Pie or donut chart for proportional data.',
    },
    ScatterChart: {
      props: ScatterChartSchema,
      description: 'Scatter plot for correlation analysis.',
    },
    BubbleChart: {
      props: BubbleChartSchema,
      description: 'Bubble chart with size dimension.',
    },
    BoxplotChart: {
      props: BoxplotChartSchema,
      description: 'Box plot for distribution analysis.',
    },
    HistogramChart: {
      props: HistogramChartSchema,
      description: 'Histogram for frequency distribution.',
    },
    WaterfallChart: {
      props: WaterfallChartSchema,
      description: 'Waterfall chart for incremental changes.',
    },
    XmrChart: {
      props: XmrChartSchema,
      description: 'XMR control chart for process monitoring.',
    },
    SankeyChart: {
      props: SankeyChartSchema,
      description: 'Sankey diagram for flow visualization.',
    },
    FunnelChart: {
      props: FunnelChartSchema,
      description: 'Funnel chart for conversion analysis.',
    },
    HeatmapChart: {
      props: HeatmapChartSchema,
      description: 'Heatmap for matrix data visualization.',
    },
    CalendarChart: {
      props: CalendarChartSchema,
      description: 'Calendar heatmap for time-series patterns.',
    },
    SparklineChart: {
      props: SparklineChartSchema,
      description: 'Inline sparkline for trend indicators.',
    },
    ComboChart: {
      props: ComboChartSchema,
      description: 'Combo chart mixing bar and line series.',
    },
    DumbbellChart: {
      props: DumbbellChartSchema,
      description: 'Dumbbell chart for range comparison.',
    },
    MermaidDiagram: {
      props: MermaidSchema,
      description: 'Mermaid diagram for flowcharts, sequences, and more.',
    },

    // UI components (mviz bridge) — 8
    BigValue: {
      props: BigValueSchema,
      description: 'Large metric display with trend indicator.',
    },
    Delta: {
      props: DeltaSchema,
      description: 'Value change indicator with direction.',
    },
    Alert: {
      props: AlertSchema,
      description: 'Alert banner with severity levels.',
    },
    Note: {
      props: NoteSchema,
      description: 'Callout note with variant styles.',
    },
    TextBlock: {
      props: TextBlockSchema,
      description: 'Styled text display.',
    },
    TextArea: {
      props: TextAreaSchema,
      description: 'Multi-line text block with monospace formatting.',
    },
    DataTable: {
      props: DataTableSchema,
      description: 'Data table with column definitions and formatting.',
    },
    EmptySpace: {
      props: EmptySpaceSchema,
      description: 'Vertical spacer.',
    },

    // Custom business components — 11
    Timeline: {
      props: TimelineSchema,
      description: 'Vertical timeline of events with dates.',
    },
    Kanban: {
      props: KanbanSchema,
      description: 'Kanban board with columns and draggable cards.',
    },
    GanttChart: {
      props: GanttChartSchema,
      description: 'Gantt chart with task bars, progress, and date axis.',
    },
    OrgChart: {
      props: OrgChartSchema,
      description: 'Organization chart with tree hierarchy.',
    },
    KpiDashboard: {
      props: KpiDashboardSchema,
      description: 'Multi-metric KPI dashboard cards.',
    },
    BudgetReport: {
      props: BudgetReportSchema,
      description: 'Budget vs actual with variance bars.',
    },
    FeatureTable: {
      props: FeatureTableSchema,
      description: 'Product comparison matrix with checkmarks.',
    },
    AuditLog: {
      props: AuditLogSchema,
      description: 'Operation log with timestamps and severity.',
    },
    JsonViewer: {
      props: JsonViewerSchema,
      description: 'Syntax-highlighted JSON viewer.',
    },
    CodeBlock: {
      props: CodeBlockSchema,
      description: 'Code block with line numbers and language tag.',
    },
    FormView: {
      props: FormViewSchema,
      description: 'Structured key-value data display.',
    },
  },
  actions: {},
})
