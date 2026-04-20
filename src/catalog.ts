import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react'
import { z } from 'zod'

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
import { RadarChartSchema } from './mviz-bridge/radar/schema'
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

// Interactive input component schemas
import { InputTextSchema } from './inputs/input-text/schema'
import { InputSelectSchema } from './inputs/input-select/schema'
import { InputFileSchema } from './inputs/input-file/schema'
import { FormBuilderSchema } from './inputs/form-builder/schema'

// DocView schema
import { DocViewSchema } from './docview/schema'

// InteractivePlayground schema
import { InteractivePlaygroundSchema } from './components/interactive-playground/schema'

/**
 * AI RenderKit catalog — 43 components registered as json-render visualization catalog
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderKitCatalog = defineCatalog(schema, {
  components: {
    // Charts (mviz bridge) — 19
    BarChart: {
      props: BarChartSchema as any,
      description: 'Bar chart with grouped, stacked, and horizontal variants.',
    },
    AreaChart: {
      props: AreaChartSchema as any,
      description: 'Area chart with stacked and smooth variants.',
    },
    LineChart: {
      props: LineChartSchema as any,
      description: 'Line chart with multi-series and smooth variants.',
    },
    PieChart: {
      props: PieChartSchema as any,
      description: 'Pie or donut chart for proportional data.',
    },
    ScatterChart: {
      props: ScatterChartSchema as any,
      description: 'Scatter plot for correlation analysis.',
    },
    BubbleChart: {
      props: BubbleChartSchema as any,
      description: 'Bubble chart with size dimension.',
    },
    BoxplotChart: {
      props: BoxplotChartSchema as any,
      description: 'Box plot for distribution analysis.',
    },
    HistogramChart: {
      props: HistogramChartSchema as any,
      description: 'Histogram for frequency distribution.',
    },
    WaterfallChart: {
      props: WaterfallChartSchema as any,
      description: 'Waterfall chart for incremental changes.',
    },
    XmrChart: {
      props: XmrChartSchema as any,
      description: 'XMR control chart for process monitoring.',
    },
    SankeyChart: {
      props: SankeyChartSchema as any,
      description: 'Sankey diagram for flow visualization.',
    },
    FunnelChart: {
      props: FunnelChartSchema as any,
      description: 'Funnel chart for conversion analysis.',
    },
    HeatmapChart: {
      props: HeatmapChartSchema as any,
      description: 'Heatmap for matrix data visualization.',
    },
    CalendarChart: {
      props: CalendarChartSchema as any,
      description: 'Calendar heatmap for time-series patterns.',
    },
    SparklineChart: {
      props: SparklineChartSchema as any,
      description: 'Inline sparkline for trend indicators.',
    },
    ComboChart: {
      props: ComboChartSchema as any,
      description: 'Combo chart mixing bar and line series.',
    },
    DumbbellChart: {
      props: DumbbellChartSchema as any,
      description: 'Dumbbell chart for range comparison.',
    },
    RadarChart: {
      props: RadarChartSchema as any,
      description: 'Radar chart for multi-dimensional comparison.',
    },
    MermaidDiagram: {
      props: MermaidSchema as any,
      description: 'Mermaid diagram for flowcharts, sequences, and more.',
    },

    // UI components (mviz bridge) — 8
    BigValue: {
      props: BigValueSchema as any,
      description: 'Large metric display with trend indicator.',
    },
    Delta: {
      props: DeltaSchema as any,
      description: 'Value change indicator with direction.',
    },
    Alert: {
      props: AlertSchema as any,
      description: 'Alert banner with severity levels.',
    },
    Note: {
      props: NoteSchema as any,
      description: 'Callout note with variant styles.',
    },
    TextBlock: {
      props: TextBlockSchema as any,
      description: 'Styled text display.',
    },
    TextArea: {
      props: TextAreaSchema as any,
      description: 'Multi-line text block with monospace formatting.',
    },
    DataTable: {
      props: DataTableSchema as any,
      description: 'Data table with column definitions and formatting.',
    },
    EmptySpace: {
      props: EmptySpaceSchema as any,
      description: 'Vertical spacer.',
    },

    // Custom business components — 11
    Timeline: {
      props: TimelineSchema as any,
      description: 'Vertical timeline of events with dates.',
    },
    Kanban: {
      props: KanbanSchema as any,
      description: 'Kanban board with columns and draggable cards.',
    },
    GanttChart: {
      props: GanttChartSchema as any,
      description: 'Gantt chart with task bars, progress, and date axis.',
    },
    OrgChart: {
      props: OrgChartSchema as any,
      description: 'Organization chart with tree hierarchy.',
    },
    KpiDashboard: {
      props: KpiDashboardSchema as any,
      description: 'Multi-metric KPI dashboard cards.',
    },
    BudgetReport: {
      props: BudgetReportSchema as any,
      description: 'Budget vs actual with variance bars.',
    },
    FeatureTable: {
      props: FeatureTableSchema as any,
      description: 'Product comparison matrix with checkmarks.',
    },
    AuditLog: {
      props: AuditLogSchema as any,
      description: 'Operation log with timestamps and severity.',
    },
    JsonViewer: {
      props: JsonViewerSchema as any,
      description: 'Syntax-highlighted JSON viewer.',
    },
    CodeBlock: {
      props: CodeBlockSchema as any,
      description: 'Code block with line numbers and language tag.',
    },
    FormView: {
      props: FormViewSchema as any,
      description: 'Structured key-value data display.',
    },

    // Interactive input components — 4
    InputText: {
      props: InputTextSchema as any,
      description: 'Text input with two-way binding. Use $bindState for value prop to enable state sync.',
    },
    InputSelect: {
      props: InputSelectSchema as any,
      description: 'Dropdown select with options. Use $bindState for value prop.',
    },
    InputFile: {
      props: InputFileSchema as any,
      description: 'File upload with drag-and-drop support.',
    },
    FormBuilder: {
      props: FormBuilderSchema as any,
      description: 'Dynamic form builder with validation, cascading fields, and grid layout. Use $bindState to capture form data.',
    },

    // InteractivePlayground — Meta component — 1
    InteractivePlayground: {
      props: InteractivePlaygroundSchema as any,
      description: 'Interactive playground wrapping any vizual component with AI-defined controls (slider, select, toggle, color, text, number, buttonGroup). Users adjust parameters and see real-time re-render. Use for education, demos, palette exploration.',
    },

    // DocView — Document annotation component — 1
    DocView: {
      props: DocViewSchema as any,
      description: 'Interactive document with sections (text, headings, charts, KPIs, tables, callouts, embedded components) and annotation support. AI outputs structured sections, users annotate for revision feedback.',
    },
  },
  actions: {
    submitForm: {
      params: z.object({
        formId: z.string().optional(),
        data: z.record(z.unknown()),
      }) as any,
      description: 'Submit form data collected from FormBuilder or input components. Host app receives form data and can process it (save, validate server-side, trigger AI workflow).',
    },
    requestRevision: {
      params: z.object({
        annotationId: z.string(),
        text: z.string(),
        note: z.string(),
      }) as any,
      description: 'Request AI revision for a specific annotation. Host app wires this to its AI API with the annotation context.',
    },
    batchSubmit: {
      params: z.object({
        annotations: z.array(z.object({
          id: z.string(),
          text: z.string(),
          note: z.string(),
          color: z.string(),
        })),
      }) as any,
      description: 'Batch submit multiple annotations for AI revision. Used by DocView revision loop to send all draft annotations at once.',
    },
  },
})
