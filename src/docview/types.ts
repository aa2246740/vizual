/**
 * Annotation status lifecycle:
 * - draft: Created but not yet submitted for revision
 * - active: Submitted, awaiting or in-process of revision
 * - resolved: AI has revised the content, annotation is addressed
 * - orphaned: The annotated text is no longer found in content (after AI revision)
 */
export type AnnotationStatus = 'draft' | 'active' | 'resolved' | 'orphaned'

/** Predefined color palette for annotations */
export const ANNOTATION_COLORS = [
  '#fbbf24', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#a855f7', // purple
  '#3b82f6', // blue
  '#22c55e', // green
] as const

export type AnnotationColor = typeof ANNOTATION_COLORS[number]

/** A single annotation on the document */
export interface Annotation {
  id: string
  /** The exact text content that was highlighted (used as primary reference, NOT char offsets) */
  text: string
  /** User's note about the annotation */
  note: string
  /** Color from the predefined palette */
  color: AnnotationColor
  /** Current status in the revision lifecycle */
  status: AnnotationStatus
  /** ISO timestamp when the annotation was created */
  createdAt: string
  /** ISO timestamp when the annotation was last updated */
  updatedAt: string
}

/** Callback when annotations change (add, update, delete) */
export type OnAnnotationsChange = (annotations: Annotation[]) => void

/** Callback when an action should be triggered (submitForm, requestRevision, batchSubmit) */
export type OnAction = (actionName: string, params: Record<string, unknown>) => void

/** Props for the DocView container */
export interface DocViewProps {
  /** Content to render and annotate */
  children: React.ReactNode
  /** Controlled annotations (if using external state) */
  annotations?: Annotation[]
  /** Callback when annotations change */
  onAnnotationsChange?: OnAnnotationsChange
  /** Show/hide the annotation panel */
  showPanel?: boolean
  /** Position of the annotation panel */
  panelPosition?: 'right' | 'left' | 'bottom'
  /** Callback when an action is triggered */
  onAction?: OnAction
  /** Additional CSS class name for the container */
  className?: string
  /** Additional CSS styles for the container */
  style?: React.CSSProperties
}
