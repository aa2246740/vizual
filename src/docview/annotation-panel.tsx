import type { Annotation, AnnotationStatus, AnnotationThread, ReviewStatus, RevisionProposal } from './types'
import { tcss } from '../core/theme-colors'

export interface AnnotationPanelProps {
  /** Current annotations to display */
  annotations: Annotation[]
  /** Review SDK threads. When provided, panel uses threads as the primary model. */
  threads?: AnnotationThread[]
  /** Revision proposals waiting for accept/reject/apply decisions. */
  revisionProposals?: RevisionProposal[]
  /** Delete an annotation */
  onDelete: (id: string) => void
  /** Update annotation status */
  onUpdateStatus: (id: string, status: AnnotationStatus) => void
  /** Click an annotation to scroll to it */
  onClickAnnotation?: (annotation: Annotation) => void
  /** Panel position */
  position?: 'right' | 'left' | 'bottom'
  /** Draft annotations (from revision loop) */
  drafts?: Annotation[]
  /** Orphaned annotations (from revision loop) */
  orphans?: Annotation[]
  /** Submit all drafts for AI revision */
  onSubmitAllDrafts?: () => void
  /** Submit a single review thread */
  onSubmitThread?: (threadId: string) => void
  /** Apply an accepted/proposed revision */
  onApplyRevision?: (proposalId: string) => void
  /** Reject a revision proposal */
  onRejectRevision?: (proposalId: string) => void
}

/**
 * Sidebar panel for managing annotations with revision loop controls.
 *
 * Displays all annotations with:
 * - Highlighted text excerpt
 * - User note
 * - Color indicator
 * - Timestamp
 * - Status badge (draft/active/resolved/orphaned)
 * - Actions: Submit (individual), Delete
 * - Batch "Submit All Drafts" button
 * - Orphaned annotation indicators
 */
export function AnnotationPanel({
  annotations,
  threads = [],
  revisionProposals = [],
  onDelete,
  onUpdateStatus,
  onClickAnnotation,
  position = 'right',
  drafts = [],
  orphans = [],
  onSubmitAllDrafts,
  onSubmitThread,
  onApplyRevision,
  onRejectRevision,
}: AnnotationPanelProps) {
  // Computed at render time to pick up theme changes
  const statusLabels: Record<AnnotationStatus, { label: string; color: string; bg: string }> = {
    draft: { label: '草稿', color: '#fbbf24', bg: '#fbbf2420' },
    active: { label: '已提交', color: tcss('--rk-accent'), bg: tcss('--rk-accent-muted') },
    resolved: { label: '已解决', color: tcss('--rk-success'), bg: tcss('--rk-success-muted') },
    orphaned: { label: '原文已变化', color: tcss('--rk-text-secondary'), bg: tcss('--rk-bg-tertiary') },
  }
  const reviewStatusLabels: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
    open: { label: '待提交', color: '#fbbf24', bg: '#fbbf2420' },
    submitted: { label: '已提交', color: tcss('--rk-accent'), bg: tcss('--rk-accent-muted') },
    in_progress: { label: '修订中', color: tcss('--rk-accent'), bg: tcss('--rk-accent-muted') },
    proposed: { label: '有提案', color: '#a855f7', bg: '#a855f720' },
    resolved: { label: '已解决', color: tcss('--rk-success'), bg: tcss('--rk-success-muted') },
    rejected: { label: '已拒绝', color: tcss('--rk-error'), bg: 'rgba(239,68,68,0.12)' },
    orphaned: { label: '原文已变化', color: tcss('--rk-text-secondary'), bg: tcss('--rk-bg-tertiary') },
  }

  const hasThreads = threads.length > 0

  const panelStyle: React.CSSProperties = {
    background: tcss('--rk-bg-primary'),
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: position === 'bottom' ? '100%' : 320,
    height: position === 'bottom' ? 240 : 'auto',
    maxHeight: position === 'bottom' ? '40vh' : '100%',
    borderLeft: position === 'right' ? `1px solid ${tcss('--rk-border-subtle')}` : undefined,
    borderRight: position === 'left' ? `1px solid ${tcss('--rk-border-subtle')}` : undefined,
    borderTop: position === 'bottom' ? `1px solid ${tcss('--rk-border-subtle')}` : undefined,
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${tcss('--rk-border-subtle')}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontSize:tcss('--rk-text-md'), fontWeight:tcss('--rk-weight-semibold'), color: tcss('--rk-text-primary') }}>
            批注
          </span>
          <span style={{ fontSize:tcss('--rk-text-sm'), color: tcss('--rk-text-secondary'), marginLeft: 8 }}>
            {hasThreads ? threads.length : annotations.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {drafts.length > 0 && (
            <span style={{ fontSize:tcss('--rk-text-xs'), color: '#fbbf24', background: '#fbbf2420', padding: '2px 8px', borderRadius:tcss('--rk-radius-lg') }}>
              {drafts.length} 草稿
            </span>
          )}
          {orphans.length > 0 && (
            <span style={{ fontSize:tcss('--rk-text-xs'), color: tcss('--rk-text-secondary'), background: tcss('--rk-bg-tertiary'), padding: '2px 8px', borderRadius:tcss('--rk-radius-lg') }}>
              {orphans.length} 原文已变化
            </span>
          )}
        </div>
      </div>

      {/* Batch submit button */}
      {drafts.length > 0 && (
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${tcss('--rk-border-subtle')}` }}>
          <button
            onClick={onSubmitAllDrafts}
            style={{
              width: '100%', padding: '8px 12px', fontSize:tcss('--rk-text-base'), fontWeight:tcss('--rk-weight-medium'),
              background: tcss('--rk-accent'), color: '#fff', border: 'none', borderRadius:tcss('--rk-radius-md'),
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-accent-hover') }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-accent') }}
          >
            批量提交 ({drafts.length})
          </button>
        </div>
      )}

      {/* Revision proposals */}
      {revisionProposals.filter(p => p.status === 'proposed' || p.status === 'accepted').length > 0 && (
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${tcss('--rk-border-subtle')}` }}>
          {revisionProposals
            .filter(p => p.status === 'proposed' || p.status === 'accepted')
            .map(proposal => (
              <div key={proposal.id} style={{
                background: tcss('--rk-bg-secondary'),
                border: `1px solid ${tcss('--rk-border-subtle')}`,
                borderRadius: tcss('--rk-radius-md'),
                padding: 10,
                marginBottom: 8,
              }}>
                <div style={{ fontSize: tcss('--rk-text-sm'), color: tcss('--rk-text-primary'), fontWeight: tcss('--rk-weight-semibold'), marginBottom: 4 }}>
                  修订提案
                </div>
                <div style={{ fontSize: tcss('--rk-text-sm'), color: tcss('--rk-text-secondary'), lineHeight: 1.35, marginBottom: 8 }}>
                  {proposal.summary}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onApplyRevision?.(proposal.id)}
                    style={{ fontSize: tcss('--rk-text-xs'), color: '#fff', background: tcss('--rk-success'), border: 'none', borderRadius: tcss('--rk-radius-sm'), cursor: 'pointer', padding: '4px 8px' }}
                  >应用</button>
                  <button
                    onClick={() => onRejectRevision?.(proposal.id)}
                    style={{ fontSize: tcss('--rk-text-xs'), color: tcss('--rk-error'), background: 'transparent', border: `1px solid ${tcss('--rk-error')}`, borderRadius: tcss('--rk-radius-sm'), cursor: 'pointer', padding: '4px 8px' }}
                  >拒绝</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Annotation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {!hasThreads && annotations.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: tcss('--rk-text-tertiary'), fontSize:tcss('--rk-text-base') }}>
            选中文档中的文字以添加批注
          </div>
        )}
        {hasThreads && threads.map((thread) => {
          const status = reviewStatusLabels[thread.status]
          const firstComment = thread.comments[0]
          const text = thread.anchor.textRange?.selectedText || thread.anchor.label
          return (
            <div
              key={thread.id}
              onClick={() => onClickAnnotation?.({
                id: thread.id,
                threadId: thread.id,
                text,
                note: firstComment?.body || '',
                color: thread.color,
                status: thread.status === 'resolved' ? 'resolved' : thread.status === 'orphaned' ? 'orphaned' : thread.status === 'open' || thread.status === 'rejected' ? 'draft' : 'active',
                createdAt: thread.createdAt,
                updatedAt: thread.updatedAt,
                target: thread.anchor,
                anchor: thread.anchor,
              })}
              style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${tcss('--rk-border-subtle')}`,
                cursor: 'pointer',
                transition: 'background 0.15s',
                opacity: thread.status === 'orphaned' ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-secondary') }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: thread.color, flexShrink: 0 }} />
                <span style={{ fontSize: tcss('--rk-text-xs'), fontWeight: tcss('--rk-weight-medium'), color: status.color, background: status.bg, padding: '1px 6px', borderRadius: tcss('--rk-radius-md') }}>
                  {status.label}
                </span>
                <span style={{ fontSize: tcss('--rk-text-xs'), fontWeight: tcss('--rk-weight-medium'), color: tcss('--rk-accent'), background: tcss('--rk-accent-muted'), padding: '1px 6px', borderRadius: tcss('--rk-radius-md') }}>
                  {thread.anchor.targetType}{thread.anchor.chartDataPoint ? ' › 数据点' : ''}
                </span>
                {thread.comments.length > 1 && (
                  <span style={{ fontSize: tcss('--rk-text-xs'), color: tcss('--rk-text-tertiary') }}>{thread.comments.length} 条</span>
                )}
                <span style={{ fontSize: tcss('--rk-text-xs'), color: tcss('--rk-text-tertiary'), marginLeft: 'auto' }}>
                  {formatTime(thread.createdAt)}
                </span>
              </div>
              <div style={{ fontSize: tcss('--rk-text-sm'), color: tcss('--rk-text-primary'), lineHeight: 1.4, marginBottom: firstComment?.body ? 4 : 0 }}>
                "{text.length > 80 ? text.slice(0, 80) + '...' : text}"
              </div>
              {firstComment?.body && (
                <div style={{ fontSize: tcss('--rk-text-sm'), color: tcss('--rk-text-secondary'), lineHeight: 1.3 }}>
                  {firstComment.body}
                </div>
              )}
              {thread.status === 'orphaned' && (
                <div style={{ fontSize: tcss('--rk-text-xs'), color: tcss('--rk-text-secondary'), lineHeight: 1.35, marginTop: 6 }}>
                  文档修订后找不到原批注文字，可删除或标记解决。
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {thread.status === 'open' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSubmitThread?.(thread.id) }}
                    style={{ fontSize: tcss('--rk-text-xs'), color: tcss('--rk-accent'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >提交</button>
                )}
                {(thread.status === 'submitted' || thread.status === 'proposed' || thread.status === 'rejected') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(thread.id, 'resolved') }}
                    style={{ fontSize: tcss('--rk-text-xs'), color: tcss('--rk-success'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >解决</button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(thread.id) }}
                  style={{ fontSize: tcss('--rk-text-xs'), color: tcss('--rk-error'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >删除</button>
              </div>
            </div>
          )
        })}
        {!hasThreads && annotations.map((ann) => {
          const status = statusLabels[ann.status]
          return (
            <div
              key={ann.id}
              onClick={() => onClickAnnotation?.(ann)}
              style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${tcss('--rk-border-subtle')}`,
                cursor: 'pointer',
                transition: 'background 0.15s',
                opacity: ann.status === 'orphaned' ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = tcss('--rk-bg-secondary')
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {/* Color indicator + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: ann.color,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize:tcss('--rk-text-xs'), fontWeight:tcss('--rk-weight-medium'),
                  color: status.color,
                  background: status.bg,
                  padding: '1px 6px',
                  borderRadius:tcss('--rk-radius-md'),
                }}>
                  {status.label}
                </span>
                {ann.target && (
                  <span style={{
                    fontSize:tcss('--rk-text-xs'), fontWeight:tcss('--rk-weight-medium'),
                    color: tcss('--rk-accent'), background: tcss('--rk-accent-muted'),
                    padding: '1px 6px', borderRadius:tcss('--rk-radius-md'),
                  }}>
                    {ann.target.targetType === 'chart' ? '📊 ' : ''}{ann.target.targetType}
                    {ann.target.chartDataPoint ? ' › 数据点' : ''}
                  </span>
                )}
                <span style={{ fontSize:tcss('--rk-text-xs'), color: tcss('--rk-text-tertiary'), marginLeft: 'auto' }}>
                  {formatTime(ann.createdAt)}
                </span>
              </div>

              {/* Text excerpt */}
              <div style={{
                fontSize:tcss('--rk-text-sm'), color: tcss('--rk-text-primary'), lineHeight: 1.4,
                marginBottom: ann.note ? 4 : 0,
                textDecoration: ann.status === 'orphaned' ? 'line-through' : 'none',
              }}>
                "{ann.text.length > 80 ? ann.text.slice(0, 80) + '...' : ann.text}"
              </div>

              {/* Note */}
              {ann.note && (
                <div style={{ fontSize:tcss('--rk-text-sm'), color: tcss('--rk-text-secondary'), lineHeight: 1.3 }}>
                  {ann.note}
                </div>
              )}
              {ann.status === 'orphaned' && (
                <div style={{ fontSize:tcss('--rk-text-xs'), color: tcss('--rk-text-secondary'), lineHeight: 1.35, marginTop: 6 }}>
                  文档修订后找不到原批注文字，可删除或确认解决。
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {ann.status === 'orphaned' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(ann.id, 'resolved') }}
                    style={{ fontSize:tcss('--rk-text-xs'), color: tcss('--rk-success'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >确认</button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(ann.id) }}
                  style={{ fontSize:tcss('--rk-text-xs'), color: tcss('--rk-error'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >删除</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Format ISO timestamp to a short relative/local time */
function formatTime(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
