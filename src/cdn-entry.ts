/**
 * CDN Entry — Vizual
 *
 * Standalone build entry. When loaded via <script> tag, exposes window.Vizual
 */
import { registry, handlers as createVizualHandlers } from './registry'
import * as echarts from 'echarts'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import { Renderer, JSONUIProvider, createStateStore } from '@json-render/react'
import type { StateModel } from '@json-render/react'
import type { ComputedFunction } from '@json-render/core'

// Theme system
import { loadDesignMd, setGlobalTheme, applyTheme, registerTheme, getTheme, getThemeNames, toggleMode, getCurrentThemeName, mapDesignTokensToTheme, invertTheme } from './themes'
import { tc, tcss, chartColors } from './core/theme-colors'

// Export API
import {
  downloadBlob,
  downloadExport,
  downloadPNG,
  exportData,
  exportDataToCSV,
  exportDataToXLSX,
  exportElement,
  exportToPDF,
  exportToPNG,
} from './core/export'
import {
  applyArtifactPatch,
  cloneJson,
  createArtifact,
  createExportRecord,
  extractTargetMap,
  getArtifactElement,
  getArtifactTarget,
  isVizualArtifact,
  isVizualSpec,
  markArtifactError,
  markArtifactRendered,
  normalizeArtifact,
  summarizeSpec,
} from './core/artifact'
import {
  createHostRuntime,
  createLocalStorageArtifactStore,
  createMemoryArtifactStore,
  VizualHostRuntime,
} from './core/host-runtime'
import type {
  CreateVizualArtifactInput,
  VizualArtifact,
  VizualArtifactPatch,
  VizualSpec,
} from './core/artifact'

// All components
import { BarChart, BarChartSchema } from './charts/bar-chart'
import { AreaChart, AreaChartSchema } from './charts/area'
import { LineChart, LineChartSchema } from './charts/line'
import { PieChart, PieChartSchema } from './charts/pie'
import { ScatterChart, ScatterChartSchema } from './charts/scatter'
import { BubbleChart, BubbleChartSchema } from './charts/bubble'
import { BoxplotChart, BoxplotChartSchema } from './charts/boxplot'
import { HistogramChart, HistogramChartSchema } from './charts/histogram'
import { WaterfallChart, WaterfallChartSchema } from './charts/waterfall'
import { XmrChart, XmrChartSchema } from './charts/xmr'
import { SankeyChart, SankeyChartSchema } from './charts/sankey'
import { FunnelChart, FunnelChartSchema } from './charts/funnel'
import { HeatmapChart, HeatmapChartSchema } from './charts/heatmap'
import { CalendarChart, CalendarChartSchema } from './charts/calendar'
import { SparklineChart, SparklineChartSchema } from './charts/sparkline'
import { ComboChart, ComboChartSchema } from './charts/combo'
import { DumbbellChart, DumbbellChartSchema } from './charts/dumbbell'
import { RadarChart, RadarChartSchema } from './charts/radar'
import { MermaidChart, MermaidSchema } from './charts/mermaid'
import { DataTable, DataTableSchema } from './charts/table'
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

type RenderSpecOptions = {
  initialState?: Record<string, unknown>
  handlers?: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown>
  functions?: Record<string, ComputedFunction>
  onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void
}

const mountedRoots = new WeakMap<HTMLElement, ReactDOMClient.Root>()

function createObservableStateStore(
  initialState: StateModel,
  onStateChange?: RenderSpecOptions['onStateChange'],
) {
  const store = createStateStore(initialState)
  if (!onStateChange) return store

  return {
    ...store,
    set(path: string, value: unknown) {
      const before = store.get(path)
      store.set(path, value)
      const after = store.get(path)
      if (before !== after) onStateChange([{ path, value: after }])
    },
    update(updates: Record<string, unknown>) {
      const before = Object.fromEntries(
        Object.keys(updates).map(path => [path, store.get(path)]),
      )
      store.update(updates)
      const changes = Object.entries(updates)
        .map(([path]) => ({ path, value: store.get(path) }))
        .filter(change => before[change.path] !== change.value)
      if (changes.length) onStateChange(changes)
    },
  }
}

function createStoreBackedSetState(store: ReturnType<typeof createStateStore>) {
  return (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
    const prev = store.getSnapshot() as Record<string, unknown>
    const next = updater(prev)
    const updates: Record<string, unknown> = {}
    for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
      updates[`/${key}`] = next[key]
    }
    store.update(updates)
  }
}

// renderSpec function
function renderSpec(spec: any, container: HTMLElement, options: RenderSpecOptions = {}) {
  const initialState = {
    ...((spec?.state as StateModel | undefined) ?? {}),
    ...(options.initialState ?? {}),
  }
  const store = createObservableStateStore(initialState, options.onStateChange)
  const setState = createStoreBackedSetState(store)
  const actionHandlers = {
    ...createVizualHandlers(() => setState, () => store.getSnapshot()),
    ...(options.handlers ?? {}),
  }
  let root = mountedRoots.get(container)
  if (!root) {
    root = ReactDOMClient.createRoot(container)
    mountedRoots.set(container, root)
  }
  root.render(
    React.createElement(JSONUIProvider, {
      registry,
      store,
      handlers: actionHandlers,
      functions: options.functions,
      onStateChange: options.onStateChange,
    } as any,
      React.createElement(Renderer, { spec, registry })
    )
  )
  return root
}

function unmountSpec(container: HTMLElement) {
  const root = mountedRoots.get(container)
  if (!root) return false
  root.unmount()
  mountedRoots.delete(container)
  return true
}

type RenderArtifactOptions = RenderSpecOptions & {
  source?: CreateVizualArtifactInput['source']
  theme?: CreateVizualArtifactInput['theme']
  metadata?: CreateVizualArtifactInput['metadata']
}

function applyArtifactTheme(artifact: VizualArtifact, container?: HTMLElement) {
  if (artifact.theme?.designMd) {
    loadDesignMd(artifact.theme.designMd, { apply: true })
  }
  if (artifact.theme?.name) {
    if (container) applyTheme(container, artifact.theme.name)
    else setGlobalTheme(artifact.theme.name)
  }
}

function renderArtifact(
  input: VizualSpec | VizualArtifact | CreateVizualArtifactInput,
  container: HTMLElement,
  options: RenderArtifactOptions = {},
) {
  let artifact = normalizeArtifact(input as VizualArtifact | VizualSpec | CreateVizualArtifactInput, {
    source: options.source,
    theme: options.theme,
    metadata: options.metadata,
  })
  const renderOptions = { ...options }
  delete renderOptions.source
  delete renderOptions.theme
  delete renderOptions.metadata

  try {
    applyArtifactTheme(artifact, container)
    const root = renderSpec(artifact.spec, container, {
      ...renderOptions,
      initialState: {
        ...(artifact.state || {}),
        ...(renderOptions.initialState || {}),
      },
    })
    artifact = markArtifactRendered(artifact)
    return { artifact, root }
  } catch (error) {
    artifact = markArtifactError(artifact, error)
    throw Object.assign(error instanceof Error ? error : new Error(String(error)), { artifact })
  }
}

function updateArtifact(
  input: VizualArtifact,
  patchOrPatches: VizualArtifactPatch | VizualArtifactPatch[],
) {
  return applyArtifactPatch(input, patchOrPatches)
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
  invertTheme,
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
  exportToPDF,
  exportElement,
  exportData,
  exportDataToCSV,
  exportDataToXLSX,
  downloadPNG,
  downloadBlob,
  downloadExport,

  // Registry
  registry,

  // renderSpec
  renderSpec,
  renderArtifact,
  updateArtifact,
  unmountSpec,
  applyArtifactPatch,
  cloneJson,
  createArtifact,
  createExportRecord,
  extractTargetMap,
  getArtifactElement,
  getArtifactTarget,
  isVizualArtifact,
  isVizualSpec,
  markArtifactError,
  markArtifactRendered,
  normalizeArtifact,
  summarizeSpec,
  createHostRuntime,
  createLocalStorageArtifactStore,
  createMemoryArtifactStore,
  VizualHostRuntime,

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
