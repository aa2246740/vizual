// AI RenderKit — json-render 可视化 Catalog
export { renderKitCatalog } from './catalog'
export { registry, handlers, executeAction } from './registry'

// Charts (mviz bridge)
export { BarChart, BarChartSchema } from './mviz-bridge/bar-chart'
export type { BarChartProps } from './mviz-bridge/bar-chart'
export { AreaChart, AreaChartSchema } from './mviz-bridge/area'
export type { AreaChartProps } from './mviz-bridge/area'
export { LineChart, LineChartSchema } from './mviz-bridge/line'
export type { LineChartProps } from './mviz-bridge/line'
export { PieChart, PieChartSchema } from './mviz-bridge/pie'
export type { PieChartProps } from './mviz-bridge/pie'
export { ScatterChart, ScatterChartSchema } from './mviz-bridge/scatter'
export type { ScatterChartProps } from './mviz-bridge/scatter'
export { BubbleChart, BubbleChartSchema } from './mviz-bridge/bubble'
export type { BubbleChartProps } from './mviz-bridge/bubble'
export { BoxplotChart, BoxplotChartSchema } from './mviz-bridge/boxplot'
export type { BoxplotChartProps } from './mviz-bridge/boxplot'
export { HistogramChart, HistogramChartSchema } from './mviz-bridge/histogram'
export type { HistogramChartProps } from './mviz-bridge/histogram'
export { WaterfallChart, WaterfallChartSchema } from './mviz-bridge/waterfall'
export type { WaterfallChartProps } from './mviz-bridge/waterfall'
export { XmrChart, XmrChartSchema } from './mviz-bridge/xmr'
export type { XmrChartProps } from './mviz-bridge/xmr'
export { SankeyChart, SankeyChartSchema } from './mviz-bridge/sankey'
export type { SankeyChartProps } from './mviz-bridge/sankey'
export { FunnelChart, FunnelChartSchema } from './mviz-bridge/funnel'
export type { FunnelChartProps } from './mviz-bridge/funnel'
export { HeatmapChart, HeatmapChartSchema } from './mviz-bridge/heatmap'
export type { HeatmapChartProps } from './mviz-bridge/heatmap'
export { CalendarChart, CalendarChartSchema } from './mviz-bridge/calendar'
export type { CalendarChartProps } from './mviz-bridge/calendar'
export { SparklineChart, SparklineChartSchema } from './mviz-bridge/sparkline'
export type { SparklineChartProps } from './mviz-bridge/sparkline'
export { ComboChart, ComboChartSchema } from './mviz-bridge/combo'
export type { ComboChartProps } from './mviz-bridge/combo'
export { DumbbellChart, DumbbellChartSchema } from './mviz-bridge/dumbbell'
export type { DumbbellChartProps } from './mviz-bridge/dumbbell'
export { RadarChart, RadarChartSchema } from './mviz-bridge/radar'
export type { RadarChartProps } from './mviz-bridge/radar'
export { MermaidChart, MermaidSchema } from './mviz-bridge/mermaid'
export type { MermaidProps } from './mviz-bridge/mermaid'

// UI components (mviz bridge) — only DataTable retained
export { DataTable, DataTableSchema } from './mviz-bridge/table'
export type { DataTableProps } from './mviz-bridge/table'

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

// InteractivePlayground — Interactive parameter exploration wrapper
export { InteractivePlayground, InteractivePlaygroundSchema } from './components/interactive-playground'
export type { InteractivePlaygroundProps, Control } from './components/interactive-playground'

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

// DocView sub-components (for custom layouts)
export { AnnotationOverlay } from './docview/annotation-overlay'
export type { AnnotationOverlayProps } from './docview/annotation-overlay'
export { AnnotationPanel } from './docview/annotation-panel'
export type { AnnotationPanelProps } from './docview/annotation-panel'
export { AnnotationInput } from './docview/annotation-input'
export type { AnnotationInputProps } from './docview/annotation-input'

// DocView types and constants
export type { Annotation, AnnotationStatus, AnnotationColor, AnnotationTarget, OnAnnotationsChange, OnAction } from './docview/types'
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
  exportToPNG,
  downloadPNG,
} from './core/export'
export type { ExportOptions } from './core/export'
