// @vizual/docview — Document annotation overlay with AI revision loop

// Main container component
export { DocView } from './container'
export type { DocViewProps } from './types'

// Hooks (for custom integrations)
export { useAnnotations } from './use-annotations'
export type { UseAnnotationsOptions, UseAnnotationsReturn } from './use-annotations'
export { useTextSelection } from './use-text-selection'
export type { UseTextSelectionOptions, UseTextSelectionReturn, TextSelection } from './use-text-selection'
export { useRevisionLoop } from './use-revision-loop'
export type { UseRevisionLoopOptions, UseRevisionLoopReturn } from './use-revision-loop'
export { useVersionHistory } from './use-version-history'
export type { UseVersionHistoryOptions, UseVersionHistoryReturn, Snapshot } from './use-version-history'

// Sub-components (for custom layouts)
export { AnnotationOverlay } from './annotation-overlay'
export type { AnnotationOverlayProps } from './annotation-overlay'
export { AnnotationPanel } from './annotation-panel'
export type { AnnotationPanelProps } from './annotation-panel'
export { AnnotationInput } from './annotation-input'
export type { AnnotationInputProps } from './annotation-input'

// Zod schema for catalog registration
export { DocViewSchema } from './schema'
export type { DocViewSchemaProps } from './schema'

// Types and constants
export type { Annotation, AnnotationStatus, AnnotationColor, OnAnnotationsChange, OnAction } from './types'
export { ANNOTATION_COLORS } from './types'
