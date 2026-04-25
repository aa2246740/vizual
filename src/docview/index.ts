// @vizual/docview — Document annotation overlay with AI revision loop

// Main container component
export { DocView } from './container'
export type { DocViewProps } from './types'

// Annotation context bridge (for components inside DocView)
export { AnnotationContext, useAnnotationContext } from './annotation-context'
export type { AnnotationContextValue } from './annotation-context'

// Annotatable wrapper (for simple components)
export { AnnotatableWrapper } from './annotatable-wrapper'
export type { AnnotatableWrapperProps } from './annotatable-wrapper'

// Hooks (for custom integrations)
export { useAnnotations } from './use-annotations'
export type { UseAnnotationsOptions, UseAnnotationsReturn } from './use-annotations'
export { useTextSelection } from './use-text-selection'
export type { UseTextSelectionOptions, UseTextSelectionReturn, TextSelection } from './use-text-selection'
export { useRevisionLoop } from './use-revision-loop'
export type { UseRevisionLoopOptions, UseRevisionLoopReturn } from './use-revision-loop'
export { useVersionHistory } from './use-version-history'
export type { UseVersionHistoryOptions, UseVersionHistoryReturn, Snapshot } from './use-version-history'
export { useReviewController } from './use-review-controller'
export type { UseReviewControllerOptions, UseReviewControllerReturn } from './use-review-controller'
export {
  applySectionPatches,
  createReviewId,
  getSectionId,
  threadToAnnotation,
  threadsToAnnotations,
} from './review-sdk'

// Sub-components (for custom layouts)
export { AnnotationOverlay } from './annotation-overlay'
export type { AnnotationOverlayProps } from './annotation-overlay'
export { AnnotationPanel } from './annotation-panel'
export type { AnnotationPanelProps } from './annotation-panel'
export { AnnotationInput } from './annotation-input'
export type { AnnotationInputProps } from './annotation-input'
export { SectionRenderer } from './section-renderer'
export type { SectionRendererProps } from './section-renderer'

// Zod schema for catalog registration
export { DocViewSchema } from './schema'
export type { DocViewSchemaProps } from './schema'

// Section context enrichment for annotation payloads
export type { SectionContext } from './section-context'
export { buildSectionContext, buildSectionContextMap } from './section-context'

// Types and constants
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
} from './types'
export { ANNOTATION_COLORS } from './types'
