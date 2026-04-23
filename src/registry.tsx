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
import { RadarChart } from './mviz-bridge/radar/component'
import { MermaidChart } from './mviz-bridge/mermaid/component'

// UI components (mviz bridge) — only DataTable retained
import { DataTable } from './mviz-bridge/table/component'

// Custom business components
import { Timeline } from './components/timeline/component'
import { Kanban } from './components/kanban/component'
import { GanttChart } from './components/gantt/component'
import { OrgChart } from './components/org-chart/component'
import { KpiDashboard } from './components/kpi-dashboard/component'
import { AuditLog } from './components/audit-log/component'

// Interactive input components — only FormBuilder retained
import { FormBuilder } from './inputs/form-builder/component'

// DocView
import { DocView } from './docview/container'

// InteractivePlayground
import { InteractivePlayground } from './components/interactive-playground/component'

// Layout components
import { GridLayout } from './components/grid-layout/component'
import { SplitLayout } from './components/split-layout/component'
import { HeroLayout } from './components/hero-layout/component'

/**
 * AI RenderKit registry — 32 React components + 3 action handlers
 * (15 components removed — AI uses freeform HTML via DocView instead)
 *
 * Exported result includes:
 * - registry: ComponentRegistry for <Renderer>
 * - handlers: (getSetState, getState) => action handler map for JSONUIProvider
 * - executeAction: imperative action execution for use outside React tree
 */
// @ts-ignore — Component function signatures use Zod v3 inferred types;
// json-render's defineRegistry expects Zod v4 types. Runtime is correct.
export const { registry, handlers, executeAction } = defineRegistry(renderKitCatalog, {
  components: {
    BarChart, AreaChart, LineChart, PieChart, ScatterChart, BubbleChart,
    BoxplotChart, HistogramChart, WaterfallChart, XmrChart, SankeyChart,
    FunnelChart, HeatmapChart, CalendarChart, SparklineChart, ComboChart,
    DumbbellChart, RadarChart, MermaidDiagram: MermaidChart,
    DataTable,
    Timeline, Kanban, GanttChart, OrgChart, KpiDashboard,
    AuditLog,
    FormBuilder,
    InteractivePlayground,
    DocView,
    GridLayout, SplitLayout, HeroLayout,
  } as any,
  actions: {
    /** Store form submission in state. Host app can override via handlers(). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submitForm: async (params: any, setState: any) => {
      const submission = {
        formId: params?.formId,
        data: params?.data ?? {},
        submittedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _formSubmissions: [...(Array.isArray(prev._formSubmissions) ? prev._formSubmissions : []), submission],
        _lastFormSubmission: submission,
      }))
    },

    /** Store revision request in state. Host app wires to AI API. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestRevision: async (params: any, setState: any) => {
      const request = {
        annotationId: params?.annotationId ?? '',
        text: params?.text ?? '',
        note: params?.note ?? '',
        requestedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _revisionRequests: [...(Array.isArray(prev._revisionRequests) ? prev._revisionRequests : []), request],
        _lastRevisionRequest: request,
      }))
    },

    /** Store batch annotation submission in state. Used by DocView revision loop. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batchSubmit: async (params: any, setState: any) => {
      const batch = {
        annotations: params?.annotations ?? [],
        submittedAt: new Date().toISOString(),
      }
      setState((prev: any) => ({
        ...prev,
        _batchSubmissions: [...(Array.isArray(prev._batchSubmissions) ? prev._batchSubmissions : []), batch],
        _lastBatchSubmission: batch,
      }))
    },
  },
})
