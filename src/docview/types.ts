import type React from 'react'
import type { DocViewSchemaProps } from './schema'
import type { SectionContext } from './section-context'

/**
 * Annotation status lifecycle:
 * - draft: Created but not yet submitted for revision
 * - active: Submitted, awaiting or in-process of revision
 * - resolved: AI has revised the content, annotation is addressed
 * - orphaned: The annotated text is no longer found in content (after AI revision)
 */
export type AnnotationStatus = 'draft' | 'active' | 'resolved' | 'orphaned'

/** Review thread status lifecycle for the DocView Review SDK */
export type ReviewStatus =
  | 'open'
  | 'submitted'
  | 'in_progress'
  | 'proposed'
  | 'resolved'
  | 'rejected'
  | 'orphaned'

/** Status of an AI-generated revision proposal */
export type RevisionProposalStatus = 'proposed' | 'accepted' | 'rejected' | 'applied' | 'failed'

/** Actor metadata for review comments and proposals */
export interface ReviewActor {
  id: string
  name?: string
  role: 'user' | 'agent' | 'system'
}

/** Text anchor with offset and quote context for more stable relocation */
export interface TextRangeAnchor {
  start: number
  end: number
  selectedText: string
  quoteBefore?: string
  quoteAfter?: string
}

/** Table cell anchor for row/column-level review */
export interface TableCellAnchor {
  rowIndex: number
  columnIndex: number
  rowKey?: string | number
  columnKey?: string
  value?: unknown
}

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

/** Data point within a chart for drill-down annotation */
export interface ChartDataPoint {
  /** Series index in the ECharts instance */
  seriesIndex: number
  /** Data index within the series */
  dataIndex: number
  /** Human-readable name from x-axis or legend (e.g., "10月", "华东区") */
  name: string
  /** Human-readable value (e.g., "15.2万", 23.6) */
  value: string | number
}

/** Stable anchor for any reviewable DocView target */
export interface AnnotationAnchor {
  /** Section index in the sections array */
  sectionIndex: number
  /** Stable section identifier. Prefer this over sectionIndex when present. */
  sectionId?: string
  /** Type of the target element */
  targetType: 'chart' | 'kpi' | 'table' | 'callout' | 'component' | 'freeform' | 'markdown' | 'text' | 'heading'
  /** Human-readable label for the target (e.g., "Revenue chart", "Q1 KPI", "Row 3, Col 2") */
  label: string
  /** Precise DOM identifier for exact element matching (e.g., "kpi-3-1", "chart-5", "table-7-2-3") */
  targetId?: string
  /** Optional path/selector for host-level deep links */
  targetPath?: string
  /** For text-based annotations: range and quote context within the section text */
  textRange?: TextRangeAnchor
  /** For chart drill-down annotations: the specific data point within the chart */
  chartDataPoint?: ChartDataPoint
  /** For table annotations: exact cell coordinates and semantic keys */
  tableCell?: TableCellAnchor
}

/** Target for annotations. Kept as the legacy public name for compatibility. */
export interface AnnotationTarget extends AnnotationAnchor {}

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
  /** For non-text annotations: the component element being annotated */
  target?: AnnotationTarget
  /** Stable anchor used by the Review SDK. Mirrors target for compatibility where possible. */
  anchor?: AnnotationAnchor
  /** Review thread that owns this annotation when using the SDK projection. */
  threadId?: string
}

/** A single comment in an annotation thread */
export interface AnnotationComment {
  id: string
  body: string
  author: ReviewActor
  createdAt: string
  updatedAt: string
  kind?: 'comment' | 'revision_request' | 'agent_reply' | 'system'
}

/** Multi-comment review thread used by the DocView Review SDK */
export interface AnnotationThread {
  id: string
  anchor: AnnotationAnchor
  comments: AnnotationComment[]
  color: AnnotationColor
  status: ReviewStatus
  type?: 'comment' | 'question' | 'change_request' | 'issue' | 'suggestion'
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  createdBy?: ReviewActor
  resolvedAt?: string
  revisionProposalIds?: string[]
  metadata?: Record<string, unknown>
}

/** Supported section patch operations returned by an external AI agent */
export interface SectionPatch {
  op: 'replaceSection' | 'updateSection' | 'insertSection' | 'deleteSection'
  sectionId?: string
  sectionIndex?: number
  afterSectionId?: string
  section?: DocViewSchemaProps['sections'][number]
  updates?: Partial<DocViewSchemaProps['sections'][number]>
}

/** AI-generated revision proposal. The host/agent creates this; DocView manages its lifecycle. */
export interface RevisionProposal {
  id: string
  fromThreadIds: string[]
  summary: string
  patches: SectionPatch[]
  status: RevisionProposalStatus
  createdAt: string
  updatedAt: string
  author?: ReviewActor
  risk?: 'low' | 'medium' | 'high'
  error?: string
  metadata?: Record<string, unknown>
}

export type DocViewReviewActionEvent =
  | { type: 'threadCreated'; thread: AnnotationThread; sectionContext?: SectionContext }
  | { type: 'threadUpdated'; thread: AnnotationThread; previousStatus?: ReviewStatus }
  | { type: 'threadDeleted'; thread: AnnotationThread }
  | { type: 'commentAdded'; thread: AnnotationThread; comment: AnnotationComment }
  | { type: 'threadsSubmitted'; threads: AnnotationThread[]; sectionContexts: Record<string, SectionContext> }
  | { type: 'revisionProposalCreated'; proposal: RevisionProposal; threads: AnnotationThread[] }
  | { type: 'revisionAccepted'; proposal: RevisionProposal; threads: AnnotationThread[] }
  | { type: 'revisionRejected'; proposal: RevisionProposal; threads: AnnotationThread[] }
  | { type: 'revisionApplied'; proposal: RevisionProposal; sections: DocViewSchemaProps['sections']; threads: AnnotationThread[] }
  | { type: 'snapshotSaved'; snapshot: unknown }

export interface CreateThreadInput {
  anchor: AnnotationAnchor
  body: string
  color?: AnnotationColor
  author?: ReviewActor
  type?: AnnotationThread['type']
  priority?: AnnotationThread['priority']
  metadata?: Record<string, unknown>
}

export interface CreateRevisionProposalInput {
  fromThreadIds: string[]
  summary: string
  patches: SectionPatch[]
  author?: ReviewActor
  risk?: RevisionProposal['risk']
  metadata?: Record<string, unknown>
}

/** Imperative SDK surface exposed to hosts/agents through DocView props */
export interface DocViewReviewController {
  getThreads: () => AnnotationThread[]
  getRevisionProposals: () => RevisionProposal[]
  getAnnotations: () => Annotation[]
  createThread: (input: CreateThreadInput) => AnnotationThread
  addComment: (threadId: string, body: string, author?: ReviewActor) => AnnotationComment | undefined
  updateThreadStatus: (threadId: string, status: ReviewStatus) => AnnotationThread | undefined
  submitThreads: (threadIds?: string[]) => AnnotationThread[]
  createRevisionProposal: (input: CreateRevisionProposalInput) => RevisionProposal
  acceptRevision: (proposalId: string) => RevisionProposal | undefined
  rejectRevision: (proposalId: string, reason?: string) => RevisionProposal | undefined
  applyRevision: (proposalId: string) => RevisionProposal | undefined
  resolveThread: (threadId: string) => AnnotationThread | undefined
  reopenThread: (threadId: string) => AnnotationThread | undefined
  deleteThread: (threadId: string) => AnnotationThread | undefined
  exportReviewState: () => {
    threads: AnnotationThread[]
    revisionProposals: RevisionProposal[]
    annotations: Annotation[]
  }
}

/** Callback when annotations change (add, update, delete) */
export type OnAnnotationsChange = (annotations: Annotation[]) => void

/** Callback when an action should be triggered (submitForm, requestRevision, batchSubmit) */
export type OnAction = (actionName: string, params: Record<string, unknown>) => void

/** Props for the DocView container */
export interface DocViewProps {
  /** Content to render and annotate (manual mode) */
  children?: React.ReactNode
  /** Document sections to render (AI-driven mode). If provided AND children is empty, sections are rendered internally. */
  sections?: DocViewSchemaProps['sections']
  /** Controlled annotations (if using external state) */
  annotations?: Annotation[]
  /** Callback when annotations change */
  onAnnotationsChange?: OnAnnotationsChange
  /** Review SDK threads (controlled mode) */
  threads?: AnnotationThread[]
  /** Callback when review SDK threads change */
  onThreadsChange?: (threads: AnnotationThread[]) => void
  /** Review SDK revision proposals (controlled mode) */
  revisionProposals?: RevisionProposal[]
  /** Callback when revision proposals change */
  onRevisionProposalsChange?: (proposals: RevisionProposal[]) => void
  /** Callback when applying a revision produces a new sections array */
  onSectionsChange?: (sections: DocViewSchemaProps['sections']) => void
  /** Typed Review SDK events for host/agent integration */
  onReviewAction?: (event: DocViewReviewActionEvent) => void
  /** Receives the imperative Review SDK controller */
  controllerRef?: React.MutableRefObject<DocViewReviewController | null> | ((controller: DocViewReviewController | null) => void)
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

/** Semantic context for a section, included in annotation payloads for AI understanding */
export type { SectionContext } from './section-context'
