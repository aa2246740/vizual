// Vizual — AI Agent visual runtime catalog
export { renderKitCatalog } from './catalog'
export { registry, handlers, executeAction } from './registry'

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
export { Kanban, KanbanSchema } from './components/kanban'
export type { KanbanProps } from './components/kanban'
export { GanttChart, GanttChartSchema } from './components/gantt'
export type { GanttChartProps } from './components/gantt'
export { OrgChart, OrgChartSchema } from './components/org-chart'
export type { OrgChartProps } from './components/org-chart'
export { KpiDashboard, KpiDashboardSchema } from './components/kpi-dashboard'
export type { KpiDashboardProps } from './components/kpi-dashboard'
export { AuditLog, AuditLogSchema } from './components/audit-log'
export type { AuditLogProps } from './components/audit-log'

// Interactive input components — only FormBuilder retained
export { FormBuilder, FormBuilderSchema } from './inputs/form-builder'
export type { FormBuilderProps } from './inputs/form-builder'

// DocView — Document annotation with AI revision loop
export { DocView } from './docview/container'
export { DocViewSchema } from './docview/schema'
export type { DocViewSchemaProps } from './docview/schema'
export { SectionRenderer } from './docview/section-renderer'
export type { SectionRendererProps } from './docview/section-renderer'

// Annotation context bridge (for components inside DocView)
export { AnnotationContext, useAnnotationContext } from './docview/annotation-context'
export type { AnnotationContextValue } from './docview/annotation-context'
export { AnnotatableWrapper } from './docview/annotatable-wrapper'
export type { AnnotatableWrapperProps } from './docview/annotatable-wrapper'

// DocView hooks (for custom integrations)
export { useAnnotations } from './docview/use-annotations'
export type { UseAnnotationsOptions, UseAnnotationsReturn } from './docview/use-annotations'
export { useTextSelection } from './docview/use-text-selection'
export type { UseTextSelectionOptions, UseTextSelectionReturn, TextSelection } from './docview/use-text-selection'
export { useRevisionLoop } from './docview/use-revision-loop'
export type { UseRevisionLoopOptions, UseRevisionLoopReturn } from './docview/use-revision-loop'
export { useVersionHistory } from './docview/use-version-history'
export type { UseVersionHistoryOptions, UseVersionHistoryReturn, Snapshot } from './docview/use-version-history'
export { useReviewController } from './docview/use-review-controller'
export type { UseReviewControllerOptions, UseReviewControllerReturn } from './docview/use-review-controller'
export {
  applySectionPatches,
  createReviewId,
  getSectionId,
  threadsToAnnotations,
  threadToAnnotation,
} from './docview/review-sdk'

// DocView sub-components (for custom layouts)
export { AnnotationOverlay } from './docview/annotation-overlay'
export type { AnnotationOverlayProps } from './docview/annotation-overlay'
export { AnnotationPanel } from './docview/annotation-panel'
export type { AnnotationPanelProps } from './docview/annotation-panel'
export { AnnotationInput } from './docview/annotation-input'
export type { AnnotationInputProps } from './docview/annotation-input'

// DocView types and constants
export type {
  Annotation,
  AnnotationAnchor,
  AnnotationComment,
  AnnotationStatus,
  AnnotationColor,
  AnnotationTarget,
  AnnotationThread,
  CreateRevisionProposalInput,
  CreateThreadInput,
  DocViewReviewActionEvent,
  DocViewReviewController,
  OnAnnotationsChange,
  OnAction,
  ReviewActor,
  ReviewStatus,
  RevisionProposal,
  RevisionProposalStatus,
  SectionPatch,
  TableCellAnchor,
  TextRangeAnchor,
} from './docview/types'
export type { DocViewProps } from './docview/types'
export { ANNOTATION_COLORS } from './docview/types'

// DocView section context (for annotation enrichment)
export type { SectionContext } from './docview/section-context'
export { buildSectionContext, buildSectionContextMap } from './docview/section-context'

// Layout components
export { GridLayout, GridLayoutSchema } from './components/grid-layout'
export type { GridLayoutProps } from './components/grid-layout'
export { SplitLayout, SplitLayoutSchema } from './components/split-layout'
export type { SplitLayoutProps } from './components/split-layout'
export { HeroLayout, HeroLayoutSchema } from './components/hero-layout'
export type { HeroLayoutProps } from './components/hero-layout'

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
