// Vizual — AI Agent visual runtime catalog
export { renderKitCatalog } from './catalog'
export { registry, handlers, executeAction } from './registry'

// A2UI protocol bridge
export { A2UIBridge, a2uiToVizualSpec } from './a2ui'
export type {
  A2UIMessage,
  A2UISurfaceState,
  A2UIComponentDef,
  A2UIDynamicValue,
  A2UIAction,
  A2UICreateSurface,
  A2UIUpdateComponents,
  A2UIUpdateDataModel,
  A2UIAppendDataModel,
  A2UIDeleteSurface,
} from './a2ui'

// Unified native core plus compatibility runtime name
export {
  VizualNativeCore,
  VizualNativeStreamReader,
  createVizualNativeStreamReader,
  nativeInputsToVizualSnapshot,
  normalizeVizualNativeInput,
  previewVizualNativeInput,
  validateVizualNativeInput,
  VIZUAL_NATIVE_PREVIEW_MIME,
} from './native-core'
export type {
  VizualNativeAgUiEvent,
  VizualNativeCoreOptions,
  VizualNativeFunctionCallState,
  VizualNativeInput,
  VizualNativeOperation,
  VizualNativeProtocol,
  VizualNativeStreamFormat,
  VizualNativeStreamReaderOptions,
  VizualNativeStreamRecord,
  VizualNativeQualityFinding,
  VizualNativeQualitySeverity,
  VizualNativeRunState,
  VizualNativeRunStatus,
  VizualNativeSurfaceSnapshot,
  VizualNativeSurfaceState,
  VizualNormalizedResult,
  VizualNormalizeOptions,
  VizualPreviewOptions,
  VizualPreviewResult,
  VizualValidateOptions,
  VizualValidationIssue,
  VizualValidationResult,
} from './native-core'
export {
  createVizualAgentEnvelope,
  createVizualAgentToolDefinition,
  assertVizualAgentToolCoverage,
  inferVizualAgentUserIntent,
  isVizualAgentEnvelope,
  renderVizualAgentInput,
  vizualEnvelopeToMcpEmbeddedResource,
  vizualPreviewToMcpEmbeddedResource,
  VIZUAL_AGENT_CHART_COMPONENTS,
  VIZUAL_AGENT_ENVELOPE_MIME,
  VIZUAL_AGENT_TOOL_NAME,
  VIZUAL_NATIVE_MIME,
} from './agent-helper'
export type {
  VizualAgentDisplayHint,
  VizualAgentCoverageIssue,
  VizualAgentCoverageResult,
  VizualAgentEnvelope,
  VizualAgentQAGuidance,
  VizualAgentRenderResult,
  VizualAgentToolDefinition,
  VizualAgentUserIntent,
} from './agent-helper'
export {
  createVizualActionDefinitions,
  createVizualAgentPromptExamples,
  createVizualCatalogManifest,
  createVizualToolInputSchema,
  zodToJsonSchema,
  VIZUAL_CATALOG_ID,
  VIZUAL_CATALOG_MANIFEST_SCHEMA,
  VIZUAL_CATALOG_VERSION,
} from './catalog-manifest'
export type {
  JsonSchemaObject,
  VizualAgentPromptExample,
  VizualCatalogActionManifest,
  VizualCatalogComponentManifest,
  VizualCatalogManifest,
} from './catalog-manifest'
export { VizualFusionRuntime, a2uiMessagesToVizualSnapshot } from './fusion'
export type {
  AGUIEvent,
  AGUIEventType,
  VizualFusionInput,
  VizualFusionQualityFinding,
  VizualFusionQualitySeverity,
  VizualFusionRuntimeOptions,
  VizualFusionSurfaceSnapshot,
} from './fusion'

// Charts
export { BarChart, BarChartSchema } from './charts/bar-chart'
export type { BarChartProps } from './charts/bar-chart'
export { AreaChart, AreaChartSchema } from './charts/area'
export type { AreaChartProps } from './charts/area'
export { LineChart, LineChartSchema } from './charts/line'
export type { LineChartProps } from './charts/line'
export { PieChart, PieChartSchema } from './charts/pie'
export type { PieChartProps } from './charts/pie'
export { ScatterChart, ScatterChartSchema } from './charts/scatter'
export type { ScatterChartProps } from './charts/scatter'
export { BubbleChart, BubbleChartSchema } from './charts/bubble'
export type { BubbleChartProps } from './charts/bubble'
export { BoxplotChart, BoxplotChartSchema } from './charts/boxplot'
export type { BoxplotChartProps } from './charts/boxplot'
export { HistogramChart, HistogramChartSchema } from './charts/histogram'
export type { HistogramChartProps } from './charts/histogram'
export { WaterfallChart, WaterfallChartSchema } from './charts/waterfall'
export type { WaterfallChartProps } from './charts/waterfall'
export { XmrChart, XmrChartSchema } from './charts/xmr'
export type { XmrChartProps } from './charts/xmr'
export { SankeyChart, SankeyChartSchema } from './charts/sankey'
export type { SankeyChartProps } from './charts/sankey'
export { FunnelChart, FunnelChartSchema } from './charts/funnel'
export type { FunnelChartProps } from './charts/funnel'
export { HeatmapChart, HeatmapChartSchema } from './charts/heatmap'
export type { HeatmapChartProps } from './charts/heatmap'
export { CalendarChart, CalendarChartSchema } from './charts/calendar'
export type { CalendarChartProps } from './charts/calendar'
export { SparklineChart, SparklineChartSchema } from './charts/sparkline'
export type { SparklineChartProps } from './charts/sparkline'
export { ComboChart, ComboChartSchema } from './charts/combo'
export type { ComboChartProps } from './charts/combo'
export { DumbbellChart, DumbbellChartSchema } from './charts/dumbbell'
export type { DumbbellChartProps } from './charts/dumbbell'
export { RadarChart, RadarChartSchema } from './charts/radar'
export type { RadarChartProps } from './charts/radar'
export { MermaidChart, MermaidSchema } from './charts/mermaid'
export type { MermaidProps } from './charts/mermaid'

// UI components
export { DataTable, DataTableSchema } from './charts/table'
export type { DataTableProps } from './charts/table'

// Custom business components
export { Timeline, TimelineSchema } from './components/timeline'
export type { TimelineProps } from './components/timeline'
export { GanttChart, GanttChartSchema } from './components/gantt'
export type { GanttChartProps } from './components/gantt'
export { OrgChart, OrgChartSchema } from './components/org-chart'
export type { OrgChartProps } from './components/org-chart'
export { KpiDashboard, KpiDashboardSchema } from './components/kpi-dashboard'
export type { KpiDashboardProps } from './components/kpi-dashboard'

// Interactive input components — only FormBuilder retained
export { FormBuilder, FormBuilderSchema } from './inputs/form-builder'
export type { FormBuilderProps } from './inputs/form-builder'

// Historical layout compatibility
export { HeroLayout, HeroLayoutSchema } from './components/hero-layout'
export type { HeroLayoutProps } from './components/hero-layout'

export { Markdown, MarkdownSchema } from './components/markdown'
export type { MarkdownProps } from './components/markdown'

// A2UI basic catalog primitives
export { Row, RowSchema } from './components/a2ui-row'
export type { RowProps } from './components/a2ui-row'
export { Column, ColumnSchema } from './components/a2ui-column'
export type { ColumnProps } from './components/a2ui-column'
export { Card, CardSchema } from './components/a2ui-card'
export type { CardProps } from './components/a2ui-card'
export { Text, TextSchema } from './components/a2ui-text'
export { Container, ContainerSchema } from './components/container'
export type { TextProps } from './components/a2ui-text'
export { Image, ImageSchema } from './components/a2ui-image'
export type { ImageProps } from './components/a2ui-image'
export { Icon, IconSchema } from './components/a2ui-icon'
export type { IconProps } from './components/a2ui-icon'
export { List, ListSchema } from './components/a2ui-list'
export type { ListProps } from './components/a2ui-list'
export { Divider, DividerSchema } from './components/a2ui-divider'
export type { DividerProps } from './components/a2ui-divider'
export { Button, ButtonSchema } from './components/a2ui-button'
export type { ButtonProps } from './components/a2ui-button'
export { CheckBox, CheckBoxSchema } from './components/a2ui-checkbox'
export type { CheckBoxProps } from './components/a2ui-checkbox'
export { TextField, TextFieldSchema } from './components/a2ui-textfield'
export type { TextFieldProps } from './components/a2ui-textfield'
export { ChoicePicker, ChoicePickerSchema } from './components/a2ui-choicepicker'
export type { ChoicePickerProps } from './components/a2ui-choicepicker'
export { Slider, SliderSchema } from './components/a2ui-slider'
export type { SliderProps } from './components/a2ui-slider'
export { DateTimeInput, DateTimeInputSchema } from './components/a2ui-datetime'
export type { DateTimeInputProps } from './components/a2ui-datetime'
export { Tabs, TabsSchema } from './components/a2ui-tabs'
export type { TabsProps } from './components/a2ui-tabs'
export { Video, VideoSchema } from './components/a2ui-video'
export type { VideoProps } from './components/a2ui-video'
export { AudioPlayer, AudioPlayerSchema } from './components/a2ui-audio'
export type { AudioPlayerProps } from './components/a2ui-audio'

// Core utilities
export { EChartsWrapper } from './core/echarts-wrapper'
export type { EChartsWrapperProps } from './core/echarts-wrapper'
export {
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
export type {
  CreateVizualArtifactInput,
  VizualArtifact,
  VizualArtifactKind,
  VizualArtifactPatch,
  VizualArtifactSource,
  VizualArtifactStatus,
  VizualArtifactTheme,
  VizualArtifactVersion,
  VizualExportFormat,
  VizualExportRecord,
  VizualSpec,
  VizualSpecElement,
  VizualTarget,
  VizualTargetType,
} from './core/artifact'

// Theme system
export { registerTheme, getTheme, getThemeNames, applyTheme, setGlobalTheme, loadDesignMd, toggleMode, getCurrentThemeName } from './themes'
export type { Theme as ThemeDefinition, LoadDesignMdOptions } from './themes'
export { parseDesignMd, mapDesignTokensToTheme, invertTheme } from './themes'
export { detectMode } from './themes/design-md-parser'
export type { DesignTokens, ColorToken, TypographyToken, SpacingToken, RadiusToken, ThemeMappingReport } from './themes'

// Theme presets
export { defaultDarkTheme } from './themes/default-dark'
export { defaultLightTheme } from './themes/default-light'
export { linearTheme } from './themes/linear'
export { vercelTheme } from './themes/vercel'

// Theme color accessor
export { tc, tcss, chartColors, updateActiveColors } from './core/theme-colors'

// Export API
export {
  createHostRuntime,
  createLocalStorageArtifactStore,
  createMemoryArtifactStore,
  VizualHostRuntime,
} from './core/host-runtime'
export type {
  ArtifactListQuery,
  ArtifactRef,
  ExportArtifactInput,
  HostRenderAdapter,
  HostRenderResult,
  HostRuntimeEvent,
  HostRuntimeEventHandler,
  RenderMessageArtifactInput,
  VizualArtifactStore,
} from './core/host-runtime'
export {
  createAgentBridge,
  VizualAgentBridge,
} from './core/agent-bridge'
export type {
  AgentBridgeArtifactEvent,
  AgentBridgeArtifactRef,
  AgentBridgeRenderKind,
  AgentBridgeRenderRecord,
  AgentBridgeSnapshot,
  CreateAgentBridgeOptions,
  InteractiveSessionAdapter,
  InteractiveSnapshot,
  LiveControlSessionAdapter,
  LiveControlSnapshot,
} from './core/agent-bridge'
export {
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
export type {
  ApplyVizualRevisionResult,
  CreateVizualReviewThreadInput,
  CreateVizualRevisionProposalInput,
  VizualReviewActor,
  VizualReviewActorRole,
  VizualReviewComment,
  VizualReviewStatus,
  VizualReviewThread,
  VizualRevisionProposal,
  VizualRevisionStatus,
  VizualTargetRef,
} from './core/review'
export {
  applyLiveControlStatePatch,
  buildFormBuilderSpecFromLiveControl,
  createLiveControlInitialState,
  createLiveControlSchema,
  getVisibleLiveControlFields,
  validateLiveControlState,
} from './core/live-control'
export type {
  CreateLiveControlSchemaInput,
  VizualLiveControlField,
  VizualLiveControlFieldType,
  VizualLiveControlOption,
  VizualLiveControlSchema,
  VizualLiveControlStatePatch,
  VizualLiveControlVisibilityRule,
} from './core/live-control'
export {
  applyVizualStateChanges,
  getVizualStateValue,
  VizualArtifactView,
  VizualRenderer,
} from './core/react-renderer'
export type {
  VizualArtifactViewProps,
  VizualRendererProps,
  VizualStateChange,
} from './core/react-renderer'
export {
  downloadBlob,
  downloadExport,
  exportToPNG,
  exportToPDF,
  exportElement,
  exportData,
  exportDataToCSV,
  exportDataToXLSX,
  downloadPNG,
} from './core/export'
export type { DataExportColumn, DataExportOptions, ExportOptions, PDFExportOptions } from './core/export'
