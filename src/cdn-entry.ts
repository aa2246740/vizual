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
import { toVizualRenderTree, flattenVizualRenderTree } from './core/render-tree'
import {
  createAgentBridge,
  VizualAgentBridge,
} from './core/agent-bridge'
import {
  addReviewComment,
  acceptRevisionProposal,
  applyRevisionProposalToArtifact,
  createReviewComment,
  createReviewThread,
  createRevisionProposal,
  createVizualReviewId,
  defaultVizualReviewAgent,
  defaultVizualReviewUser,
  normalizeTargetRef,
  rejectRevisionProposal,
  updateReviewThreadStatus,
} from './core/review'
import {
  applyLiveControlStatePatch,
  buildFormBuilderSpecFromLiveControl,
  createLiveControlInitialState,
  createLiveControlSchema,
  getVisibleLiveControlFields,
  validateLiveControlState,
} from './core/live-control'
import type {
  CreateVizualArtifactInput,
  VizualArtifact,
  VizualArtifactPatch,
  VizualSpec,
} from './core/artifact'
import { assertNoCyclicChildren, withDefaultElementProps } from './core/spec-validation'
import { applyVizualStateChanges } from './core/react-renderer'
import { createVizualHostBridge, wrapActionHandlersWithOnAction, collectDeclaredVizualActions, summarizeVizualInteractivity, VIZUAL_ROUNDTRIP_ACTIONS, type VizualAction } from './core/host-bridge'
import { collectVizualRenderEvidence } from './core/render-evidence'

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
import { GanttChart, GanttChartSchema } from './components/gantt'
import { OrgChart, OrgChartSchema } from './components/org-chart'
import { KpiDashboard, KpiDashboardSchema } from './components/kpi-dashboard'
import { FormBuilder, FormBuilderSchema } from './inputs/form-builder'
import { Markdown, MarkdownSchema } from './components/markdown'

type RenderSpecOptions = {
  initialState?: Record<string, unknown>
  handlers?: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown>
  functions?: Record<string, ComputedFunction>
  onStateChange?: (changes: Array<{ path: string; value: unknown }>) => void
  onAction?: (action: VizualAction) => void
  surfaceId?: string
  recomputeSpec?: (state: Record<string, unknown>) => VizualSpec
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
  assertNoCyclicChildren(spec)
  const rendererSpec = withDefaultElementProps(spec)

  const initialState = {
    ...((rendererSpec?.state as StateModel | undefined) ?? {}),
    ...(options.initialState ?? {}),
  }
  // In-playground live preview: when bound control state changes, re-derive the
  // spec from the new state and re-render locally (no agent involved). We reuse
  // the SAME store (control values already live there), ignore Vizual-internal
  // bookkeeping paths (/_charts, /_forms, ...), and guard re-entrancy so the
  // re-render cannot loop.
  const liveStateRef: { current: Record<string, unknown> } = { current: initialState }
  let recomputing = false
  const handleStateChange = (changes: Array<{ path: string; value: unknown }>) => {
    options.onStateChange?.(changes)
    if (!options.recomputeSpec || recomputing) return
    const meaningful = changes.filter(c => !c.path.startsWith('/_'))
    if (!meaningful.length) return
    liveStateRef.current = applyVizualStateChanges({ ...liveStateRef.current, ...(store.getSnapshot() as Record<string, unknown>) }, meaningful)
    recomputing = true
    try {
      mount(options.recomputeSpec(liveStateRef.current))
    } finally {
      recomputing = false
    }
  }
  const store = createObservableStateStore(initialState, handleStateChange)
  const setState = createStoreBackedSetState(store)
  const baseHandlers = {
    ...createVizualHandlers(() => setState, () => store.getSnapshot()),
    ...(options.handlers ?? {}),
  }
  const actionHandlers = options.onAction
    ? wrapActionHandlersWithOnAction(baseHandlers, {
        onAction: options.onAction,
        surfaceId: options.surfaceId,
        getState: () => store.getSnapshot() as Record<string, unknown>,
        spec: rendererSpec,
      })
    : baseHandlers
  let root = mountedRoots.get(container)
  if (!root) {
    root = ReactDOMClient.createRoot(container)
    mountedRoots.set(container, root)
  }
  const mount = (nextSpec: any) => {
    const finalSpec = withDefaultElementProps(nextSpec)
    root!.render(
      React.createElement(JSONUIProvider, {
        registry,
        store,
        handlers: actionHandlers,
        functions: options.functions,
        onStateChange: handleStateChange,
      } as any,
        React.createElement(Renderer, { spec: finalSpec as any, registry })
      )
    )
  }
  mount(rendererSpec)
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

// A2UI protocol bridge
import { A2UIBridge, a2uiToVizualSpec } from './a2ui'
import {
  VizualNativeCore,
  VizualNativeStreamReader,
  createVizualNativeStreamReader,
  nativeInputsToVizualSnapshot,
  normalizeVizualNativeInput,
  previewVizualNativeInput,
  repairAgentInput,
  validateVizualNativeInput,
  VIZUAL_NATIVE_PREVIEW_MIME,
} from './native-core'
import { VizualFusionRuntime, a2uiMessagesToVizualSnapshot } from './fusion'
import {
  createVizualAgentEnvelope,
  createVizualAgentToolDefinition,
  isVizualAgentEnvelope,
  renderVizualAgentInput,
  vizualEnvelopeToMcpEmbeddedResource,
  vizualPreviewToMcpEmbeddedResource,
  VIZUAL_AGENT_ENVELOPE_MIME,
  VIZUAL_AGENT_TOOL_NAME,
  VIZUAL_NATIVE_MIME,
} from './agent-helper'
import {
  createVizualActionDefinitions,
  createVizualAgentPromptExamples,
  createVizualCatalogManifest,
  createVizualToolInputSchema,
  VIZUAL_CATALOG_ID,
  VIZUAL_CATALOG_MANIFEST_SCHEMA,
  VIZUAL_CATALOG_VERSION,
} from './catalog-manifest'
import {
  buildVizualActionMessage,
  extractVizualPresentations,
  isInternalVizualActionMessage,
  selectRenderableVizualPresentations,
  selectVisibleVizualPresentations,
  selectVizualFallbackTexts,
} from './chat-adapter'

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
  createVizualHostBridge,
  wrapActionHandlersWithOnAction,
  collectDeclaredVizualActions,
  summarizeVizualInteractivity,
  applyVizualStateChanges,
  VIZUAL_ROUNDTRIP_ACTIONS,
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
  collectVizualRenderEvidence,
  normalizeArtifact,
  summarizeSpec,
  toVizualRenderTree,
  flattenVizualRenderTree,
  createHostRuntime,
  createLocalStorageArtifactStore,
  createMemoryArtifactStore,
  VizualHostRuntime,
  createAgentBridge,
  VizualAgentBridge,
  addReviewComment,
  acceptRevisionProposal,
  applyRevisionProposalToArtifact,
  createReviewComment,
  createReviewThread,
  createRevisionProposal,
  createVizualReviewId,
  defaultVizualReviewAgent,
  defaultVizualReviewUser,
  normalizeTargetRef,
  rejectRevisionProposal,
  updateReviewThreadStatus,
  applyLiveControlStatePatch,
  buildFormBuilderSpecFromLiveControl,
  createLiveControlInitialState,
  createLiveControlSchema,
  getVisibleLiveControlFields,
  validateLiveControlState,

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
  GanttChart,
  GanttChartSchema,
  OrgChart,
  OrgChartSchema,
  KpiDashboard,
  KpiDashboardSchema,
  FormBuilder,
  FormBuilderSchema,
  Markdown,
  MarkdownSchema,

  // A2UI protocol bridge
  A2UIBridge,
  a2uiToVizualSpec,
  VizualNativeCore,
  VizualNativeStreamReader,
  createVizualNativeStreamReader,
  nativeInputsToVizualSnapshot,
  normalizeVizualNativeInput,
  previewVizualNativeInput,
  repairAgentInput,
  validateVizualNativeInput,
  VIZUAL_NATIVE_PREVIEW_MIME,
  VizualFusionRuntime,
  a2uiMessagesToVizualSnapshot,
  createVizualAgentEnvelope,
  createVizualAgentToolDefinition,
  createVizualActionDefinitions,
  createVizualAgentPromptExamples,
  createVizualCatalogManifest,
  createVizualToolInputSchema,
  isVizualAgentEnvelope,
  renderVizualAgentInput,
  buildVizualActionMessage,
  extractVizualPresentations,
  isInternalVizualActionMessage,
  selectRenderableVizualPresentations,
  selectVisibleVizualPresentations,
  selectVizualFallbackTexts,
  vizualEnvelopeToMcpEmbeddedResource,
  vizualPreviewToMcpEmbeddedResource,
  VIZUAL_AGENT_ENVELOPE_MIME,
  VIZUAL_AGENT_TOOL_NAME,
  VIZUAL_NATIVE_MIME,
  VIZUAL_CATALOG_ID,
  VIZUAL_CATALOG_MANIFEST_SCHEMA,
  VIZUAL_CATALOG_VERSION,
}

// Expose to window for <script> tag usage
window.Vizual = vizual
