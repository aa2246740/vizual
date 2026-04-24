/**
 * CDN Entry — Vizual
 *
 * Standalone build entry. When loaded via <script> tag, exposes window.Vizual
 */
import { registry } from './registry'
import * as echarts from 'echarts'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import { Renderer, StateProvider, JSONUIProvider } from '@json-render/react'

// Theme system
import { loadDesignMd, setGlobalTheme, applyTheme, registerTheme, getTheme, getThemeNames, toggleMode, getCurrentThemeName, mapDesignTokensToTheme } from './themes'
import { tc, tcss, chartColors } from './core/theme-colors'

// Export API
import { exportToPNG, downloadPNG } from './core/export'

// All components
import { BarChart, BarChartSchema } from './mviz-bridge/bar-chart'
import { AreaChart, AreaChartSchema } from './mviz-bridge/area'
import { LineChart, LineChartSchema } from './mviz-bridge/line'
import { PieChart, PieChartSchema } from './mviz-bridge/pie'
import { ScatterChart, ScatterChartSchema } from './mviz-bridge/scatter'
import { BubbleChart, BubbleChartSchema } from './mviz-bridge/bubble'
import { BoxplotChart, BoxplotChartSchema } from './mviz-bridge/boxplot'
import { HistogramChart, HistogramChartSchema } from './mviz-bridge/histogram'
import { WaterfallChart, WaterfallChartSchema } from './mviz-bridge/waterfall'
import { XmrChart, XmrChartSchema } from './mviz-bridge/xmr'
import { SankeyChart, SankeyChartSchema } from './mviz-bridge/sankey'
import { FunnelChart, FunnelChartSchema } from './mviz-bridge/funnel'
import { HeatmapChart, HeatmapChartSchema } from './mviz-bridge/heatmap'
import { CalendarChart, CalendarChartSchema } from './mviz-bridge/calendar'
import { SparklineChart, SparklineChartSchema } from './mviz-bridge/sparkline'
import { ComboChart, ComboChartSchema } from './mviz-bridge/combo'
import { DumbbellChart, DumbbellChartSchema } from './mviz-bridge/dumbbell'
import { RadarChart, RadarChartSchema } from './mviz-bridge/radar'
import { MermaidChart, MermaidSchema } from './mviz-bridge/mermaid'
import { DataTable, DataTableSchema } from './mviz-bridge/table'
import { Timeline, TimelineSchema } from './components/timeline'
import { Kanban, KanbanSchema } from './components/kanban'
import { GanttChart, GanttChartSchema } from './components/gantt'
import { OrgChart, OrgChartSchema } from './components/org-chart'
import { KpiDashboard, KpiDashboardSchema } from './components/kpi-dashboard'
import { AuditLog, AuditLogSchema } from './components/audit-log'
import { FormBuilder, FormBuilderSchema } from './inputs/form-builder'
import { GridLayout, GridLayoutSchema } from './components/grid-layout'
import { SplitLayout, SplitLayoutSchema } from './components/split-layout'
import { HeroLayout, HeroLayoutSchema } from './components/hero-layout'
import { DocView } from './docview/container'

// renderSpec function
function renderSpec(spec: any, container: HTMLElement) {
  const root = ReactDOMClient.createRoot(container)
  root.render(
    React.createElement(JSONUIProvider, { registry } as any,
      React.createElement(Renderer, { spec, registry })
    )
  )
  return root
}

// === Expose to window ===
declare global {
  interface Window {
    Vizual: typeof vizual
  }
}

const vizual = {
  // React runtimes
  React,
  ReactDOM,
  ReactDOMClient,
  echarts,

  // Theme system
  loadDesignMd,
  mapDesignTokensToTheme,
  setGlobalTheme,
  applyTheme,
  registerTheme,
  getTheme,
  getThemeNames,
  toggleMode,
  getCurrentThemeName,

  // Colors
  tc,
  tcss,
  chartColors,

  // Export
  exportToPNG,
  downloadPNG,

  // Registry
  registry,

  // renderSpec
  renderSpec,

  // All components
  BarChart,
  BarChartSchema,
  AreaChart,
  AreaChartSchema,
  LineChart,
  LineChartSchema,
  PieChart,
  PieChartSchema,
  ScatterChart,
  ScatterChartSchema,
  BubbleChart,
  BubbleChartSchema,
  BoxplotChart,
  BoxplotChartSchema,
  HistogramChart,
  HistogramChartSchema,
  WaterfallChart,
  WaterfallChartSchema,
  XmrChart,
  XmrChartSchema,
  SankeyChart,
  SankeyChartSchema,
  FunnelChart,
  FunnelChartSchema,
  HeatmapChart,
  HeatmapChartSchema,
  CalendarChart,
  CalendarChartSchema,
  SparklineChart,
  SparklineChartSchema,
  ComboChart,
  ComboChartSchema,
  DumbbellChart,
  DumbbellChartSchema,
  RadarChart,
  RadarChartSchema,
  MermaidChart,
  MermaidSchema,
  DataTable,
  DataTableSchema,
  Timeline,
  TimelineSchema,
  Kanban,
  KanbanSchema,
  GanttChart,
  GanttChartSchema,
  OrgChart,
  OrgChartSchema,
  KpiDashboard,
  KpiDashboardSchema,
  AuditLog,
  AuditLogSchema,
  FormBuilder,
  FormBuilderSchema,
  GridLayout,
  GridLayoutSchema,
  SplitLayout,
  SplitLayoutSchema,
  HeroLayout,
  HeroLayoutSchema,
  DocView,
}

// Expose to window for <script> tag usage
window.Vizual = vizual
