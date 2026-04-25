import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react'
import { z } from 'zod'

// Chart schemas
import { BarChartSchema } from './charts/bar-chart/schema'
import { AreaChartSchema } from './charts/area/schema'
import { LineChartSchema } from './charts/line/schema'
import { PieChartSchema } from './charts/pie/schema'
import { ScatterChartSchema } from './charts/scatter/schema'
import { BubbleChartSchema } from './charts/bubble/schema'
import { BoxplotChartSchema } from './charts/boxplot/schema'
import { HistogramChartSchema } from './charts/histogram/schema'
import { WaterfallChartSchema } from './charts/waterfall/schema'
import { XmrChartSchema } from './charts/xmr/schema'
import { SankeyChartSchema } from './charts/sankey/schema'
import { FunnelChartSchema } from './charts/funnel/schema'
import { HeatmapChartSchema } from './charts/heatmap/schema'
import { CalendarChartSchema } from './charts/calendar/schema'
import { SparklineChartSchema } from './charts/sparkline/schema'
import { ComboChartSchema } from './charts/combo/schema'
import { DumbbellChartSchema } from './charts/dumbbell/schema'
import { RadarChartSchema } from './charts/radar/schema'
import { MermaidSchema } from './charts/mermaid/schema'

// UI component schemas
import { DataTableSchema } from './charts/table/schema'

// Custom business component schemas
import { TimelineSchema } from './components/timeline/schema'
import { KanbanSchema } from './components/kanban/schema'
import { GanttChartSchema } from './components/gantt/schema'
import { OrgChartSchema } from './components/org-chart/schema'
import { KpiDashboardSchema } from './components/kpi-dashboard/schema'
import { AuditLogSchema } from './components/audit-log/schema'

// Interactive input component schemas
import { FormBuilderSchema } from './inputs/form-builder/schema'

// DocView schema
import { DocViewSchema } from './docview/schema'

// Layout component schemas
import { GridLayoutSchema } from './components/grid-layout/schema'
import { SplitLayoutSchema } from './components/split-layout/schema'
import { HeroLayoutSchema } from './components/hero-layout/schema'

/**
 * AI RenderKit catalog — 31 components registered as json-render visualization catalog
 * (InteractivePlayground removed — use HTML pages with native controls for interactive parameter exploration)
 * (15 components removed — AI uses freeform HTML via DocView instead)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderKitCatalog = defineCatalog(schema, {
  components: {
    // Charts — 19
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

    // UI components — 1
    DataTable: {
      props: DataTableSchema as any,
      description: 'Data table with column definitions and formatting.',
    },

    // Custom business components — 6
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
    AuditLog: {
      props: AuditLogSchema as any,
      description: 'Operation log with timestamps and severity.',
    },

    // Interactive input components — 1
    FormBuilder: {
      props: FormBuilderSchema as any,
      description: 'Dynamic form builder with validation, cascading fields, and grid layout. Use $bindState to capture form data.',
    },

    // DocView — Document annotation component — 1
    DocView: {
      props: DocViewSchema as any,
      description: 'Interactive document with sections (text, headings, charts, KPIs, tables, callouts, markdown, freeform, embedded components) and annotation support. Supports aiContext for semantic annotation enrichment and layout variants per section.',
    },

    // Layout components — 3
    GridLayout: {
      props: GridLayoutSchema as any,
      description: 'CSS Grid container for composing child components into multi-column layouts.',
    },
    SplitLayout: {
      props: SplitLayoutSchema as any,
      description: 'Two-pane split layout with configurable direction and ratio.',
    },
    HeroLayout: {
      props: HeroLayoutSchema as any,
      description: 'Large prominent hero section with gradient, solid, or transparent background.',
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
      description: 'Legacy compatibility event for requesting AI revision for a single annotation. New hosts should prefer DocView onReviewAction/controllerRef.',
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
      description: 'Legacy compatibility event for batch annotation submission. New hosts should prefer DocView threadsSubmitted review events and RevisionProposal patches.',
    },
  },
})
