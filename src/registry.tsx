import React from 'react'
import { defineRegistry } from '@json-render/react'
import { renderKitCatalog } from './catalog'

// Chart components
import { BarChart } from './charts/bar-chart/component'
import { AreaChart } from './charts/area/component'
import { LineChart } from './charts/line/component'
import { PieChart } from './charts/pie/component'
import { ScatterChart } from './charts/scatter/component'
import { BubbleChart } from './charts/bubble/component'
import { BoxplotChart } from './charts/boxplot/component'
import { HistogramChart } from './charts/histogram/component'
import { WaterfallChart } from './charts/waterfall/component'
import { XmrChart } from './charts/xmr/component'
import { SankeyChart } from './charts/sankey/component'
import { FunnelChart } from './charts/funnel/component'
import { HeatmapChart } from './charts/heatmap/component'
import { CalendarChart } from './charts/calendar/component'
import { SparklineChart } from './charts/sparkline/component'
import { ComboChart } from './charts/combo/component'
import { DumbbellChart } from './charts/dumbbell/component'
import { RadarChart } from './charts/radar/component'
import { MermaidChart } from './charts/mermaid/component'

// UI components
import { DataTable } from './charts/table/component'

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

// Layout components
import { GridLayout } from './components/grid-layout/component'
import { SplitLayout } from './components/split-layout/component'
import { HeroLayout } from './components/hero-layout/component'

// Freeform HTML
import { FreeformHtml } from './components/freeform-html/component'

// A2UI basic catalog primitives
import { Row } from './components/a2ui-row/component'
import { Column } from './components/a2ui-column/component'
import { Card } from './components/a2ui-card/component'
import { Text } from './components/a2ui-text/component'
import { Image } from './components/a2ui-image/component'
import { Icon } from './components/a2ui-icon/component'
import { List } from './components/a2ui-list/component'
import { Divider } from './components/a2ui-divider/component'
import { Button } from './components/a2ui-button/component'
import { CheckBox } from './components/a2ui-checkbox/component'
import { TextField } from './components/a2ui-textfield/component'
import { ChoicePicker } from './components/a2ui-choicepicker/component'
import { Slider } from './components/a2ui-slider/component'
import { DateTimeInput } from './components/a2ui-datetime/component'
import { Tabs } from './components/a2ui-tabs/component'
import { Modal } from './components/a2ui-modal/component'
import { Video } from './components/a2ui-video/component'
import { AudioPlayer } from './components/a2ui-audio/component'

/** 不需要 wrapper 的组件 — 布局类、容器类和 DocView 自身管理背景 */
const NO_WRAP = new Set([
  'GridLayout', 'SplitLayout', 'HeroLayout', 'DocView',
  'Row', 'Column', 'Card', 'Tabs', 'Modal',
  'FreeformHtml',
])
const CHART_COMPONENTS = new Set([
  'BarChart', 'AreaChart', 'LineChart', 'PieChart', 'ScatterChart', 'BubbleChart',
  'BoxplotChart', 'HistogramChart', 'WaterfallChart', 'XmrChart', 'SankeyChart',
  'FunnelChart', 'HeatmapChart', 'CalendarChart', 'SparklineChart', 'ComboChart',
  'DumbbellChart', 'RadarChart', 'MermaidDiagram',
])

/**
 * 包装组件函数：给需要背景的组件套上自包含的容器。
 * 这样组件在任何宿主页面里都能正确显示，不依赖外部背景色。
 */
function withBackgroundWrap(name: string, componentFn: React.ComponentType<any>) {
  return (props: any) => {
    const inner = React.createElement(componentFn, props)
    const isChart = CHART_COMPONENTS.has(name)
    return React.createElement('div', {
      style: {
        background: 'var(--rk-bg-secondary)',
        borderRadius: 'var(--rk-radius-md)',
        padding: isChart ? 0 : '12px',
        minWidth: 0,
        width: '100%',
      },
    }, inner)
  }
}

/**
 * Vizual registry — 31 React components + action handlers
 */
// @ts-ignore
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
    DocView,
    GridLayout, SplitLayout, HeroLayout,
    FreeformHtml,
    Row, Column, Card,
    Text, Image, Icon, List, Divider,
    Button, CheckBox, TextField, ChoicePicker, Slider, DateTimeInput,
    Tabs, Modal, Video, AudioPlayer,
  } as any,
  actions: {
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

// 给非布局组件套上背景容器，让它们在任何宿主环境自包含
for (const [name, componentFn] of Object.entries(registry)) {
  if (!NO_WRAP.has(name) && typeof componentFn === 'function') {
    registry[name] = withBackgroundWrap(name, componentFn)
  }
}
