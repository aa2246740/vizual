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
import { GanttChartSchema } from './components/gantt/schema'
import { OrgChartSchema } from './components/org-chart/schema'
import { KpiDashboardSchema } from './components/kpi-dashboard/schema'

// Interactive input component schemas
import { FormBuilderSchema } from './inputs/form-builder/schema'

import { MarkdownSchema } from './components/markdown/schema'
import { ContainerSchema } from './components/container/schema'

// A2UI basic catalog primitives
import { RowSchema } from './components/a2ui-row/schema'
import { ColumnSchema } from './components/a2ui-column/schema'
import { CardSchema } from './components/a2ui-card/schema'
import { TextSchema } from './components/a2ui-text/schema'
import { ImageSchema } from './components/a2ui-image/schema'
import { IconSchema } from './components/a2ui-icon/schema'
import { ListSchema } from './components/a2ui-list/schema'
import { DividerSchema } from './components/a2ui-divider/schema'
import { ButtonSchema } from './components/a2ui-button/schema'
import { CheckBoxSchema } from './components/a2ui-checkbox/schema'
import { TextFieldSchema } from './components/a2ui-textfield/schema'
import { ChoicePickerSchema } from './components/a2ui-choicepicker/schema'
import { SliderSchema } from './components/a2ui-slider/schema'
import { DateTimeInputSchema } from './components/a2ui-datetime/schema'
import { TabsSchema } from './components/a2ui-tabs/schema'
import { VideoSchema } from './components/a2ui-video/schema'
import { AudioPlayerSchema } from './components/a2ui-audio/schema'

/**
 * Vizual catalog — 44 components registered as json-render visualization catalog
 * Use host bridges such as renderLiveControlInMsg for liveControl parameter exploration.
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

    // Custom business components — 4
    Timeline: {
      props: TimelineSchema as any,
      description: 'Vertical timeline of events with dates.',
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

    // Interactive input components — 1
    FormBuilder: {
      props: FormBuilderSchema as any,
      description: 'Dynamic form builder for collecting structured user input and returning submitted data to the host Agent.',
    },

    Markdown: {
      props: MarkdownSchema as any,
      description: 'Render plain Markdown content.',
    },
    Container: {
      props: ContainerSchema as any,
      description: 'Native flex container for agent-composed UI, including spacing, wrapping, background, border, and simple sizing.',
    },

    // A2UI basic catalog primitives — 17 components
    Row: {
      props: RowSchema as any,
      description: 'Horizontal flex layout. Compose child components side by side with configurable gap, alignment, and wrapping.',
    },
    Column: {
      props: ColumnSchema as any,
      description: 'Vertical flex layout. Stack child components with configurable gap and alignment.',
    },
    Card: {
      props: CardSchema as any,
      description: 'Container with background, border-radius, and shadow. Wraps child components in a styled card.',
    },
    Text: {
      props: TextSchema as any,
      description: 'Typography primitive. Body text, headings, captions, labels, code with full style control.',
    },
    Image: {
      props: ImageSchema as any,
      description: 'Image display with responsive sizing, object-fit, and border-radius.',
    },
    Icon: {
      props: IconSchema as any,
      description: 'Icon or emoji display with configurable size and color.',
    },
    List: {
      props: ListSchema as any,
      description: 'Ordered or unordered list of text items.',
    },
    Divider: {
      props: DividerSchema as any,
      description: 'Horizontal or vertical divider line.',
    },
    Button: {
      props: ButtonSchema as any,
      description: 'Clickable button with primary, secondary, or ghost variants. Supports A2UI action callbacks.',
    },
    CheckBox: {
      props: CheckBoxSchema as any,
      description: 'Checkbox input with label.',
    },
    TextField: {
      props: TextFieldSchema as any,
      description: 'Text input field with label, placeholder, and type variants (text/email/password/number/url).',
    },
    ChoicePicker: {
      props: ChoicePickerSchema as any,
      description: 'Choice selector — dropdown or radio group from a list of options.',
    },
    Slider: {
      props: SliderSchema as any,
      description: 'Range slider with min/max/step configuration and A2UI v0.10 steps divisions.',
    },
    DateTimeInput: {
      props: DateTimeInputSchema as any,
      description: 'Date, time, or datetime-local input.',
    },
    Tabs: {
      props: TabsSchema as any,
      description: 'Tab navigation with labeled tabs and content panels.',
    },
    Video: {
      props: VideoSchema as any,
      description: 'Video player with controls, autoplay, and muted options.',
    },
    AudioPlayer: {
      props: AudioPlayerSchema as any,
      description: 'Audio player with controls and optional title.',
    },
  },
  actions: {
    submitForm: {
      params: z.object({
        formId: z.string().optional(),
        data: z.record(z.unknown()),
      }) as any,
      description: 'Submit form data collected from FormBuilder or input components and return it to the host Agent.',
    },
    applyFilter: {
      params: z.object({
        filterId: z.string().optional(),
        filters: z.record(z.unknown()).optional(),
        source: z.string().optional(),
      }) as any,
      description: 'Apply a host-visible filter selected inside a Vizual surface, such as risk level, region, time range, or category.',
    },
    drillDown: {
      params: z.object({
        chartId: z.string().optional(),
        point: z.unknown().optional(),
        row: z.record(z.unknown()).optional(),
        targetId: z.string().optional(),
      }) as any,
      description: 'Request deeper analysis for a selected chart point, table row, map marker, or other focused data item.',
    },
    selectLocation: {
      params: z.object({
        id: z.string().optional(),
        label: z.string().optional(),
        value: z.unknown().optional(),
      }) as any,
      description: 'Select a location-like entity from an interactive geography, branch, store, or region surface.',
    },
    updatePlan: {
      params: z.object({
        actionId: z.string().optional(),
        status: z.string().optional(),
        comment: z.string().optional(),
        data: z.record(z.unknown()).optional(),
      }) as any,
      description: 'Update an action-plan item from an interactive Vizual surface and return the change to the host Agent.',
    },
  },
})
