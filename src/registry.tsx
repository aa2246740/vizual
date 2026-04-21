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

// Interactive input components
import { InputText } from './inputs/input-text/component'
import { InputSelect } from './inputs/input-select/component'
import { InputFile } from './inputs/input-file/component'
import { FormBuilder } from './inputs/form-builder/component'

// New components
import { ProgressBar } from './components/progress-bar/component'
import { TreeView } from './components/tree-view/component'

// DocView
import { DocView } from './docview/container'

// InteractivePlayground
import { InteractivePlayground } from './components/interactive-playground/component'

/**
 * AI RenderKit registry — 43 React components + 3 action handlers
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
    BigValue, Delta, Alert, Note, TextBlock, TextArea, DataTable, EmptySpace,
    Timeline, Kanban, GanttChart, OrgChart, KpiDashboard, BudgetReport,
    FeatureTable, AuditLog, JsonViewer, CodeBlock, FormView,
    ProgressBar, TreeView,
    InputText, InputSelect, InputFile, FormBuilder,
    InteractivePlayground,
    DocView,
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
