import type { Annotation, AnnotationStatus } from './types'
import { tc } from '../core/theme-colors'

export interface AnnotationPanelProps {
  /** Current annotations to display */
  annotations: Annotation[]
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
}

const statusLabels: Record<AnnotationStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#fbbf24', bg: '#fbbf2420' },
  active: { label: '已提交', color: tc('--rk-accent'), bg: '#3b82f620' },
  resolved: { label: '已解决', color: tc('--rk-success'), bg: '#22c55e20' },
  orphaned: { label: '孤立', color: tc('--rk-text-secondary'), bg: '#88888820' },
}

const panelContainer: React.CSSProperties = {
  background: tc('--rk-bg-primary'),
  borderLeft: `1px solid ${tc('--rk-border-subtle')}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
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
  onDelete,
  onUpdateStatus,
  onClickAnnotation,
  position = 'right',
  drafts = [],
  orphans = [],
  onSubmitAllDrafts,
}: AnnotationPanelProps) {
  const panelStyle: React.CSSProperties = {
    ...panelContainer,
    width: position === 'bottom' ? '100%' : 320,
    height: position === 'bottom' ? 240 : 'auto',
    maxHeight: position === 'bottom' ? '40vh' : '100%',
    borderLeft: position === 'right' ? `1px solid ${tc('--rk-border-subtle')}` : undefined,
    borderRight: position === 'left' ? `1px solid ${tc('--rk-border-subtle')}` : undefined,
    borderTop: position === 'bottom' ? `1px solid ${tc('--rk-border-subtle')}` : undefined,
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${tc('--rk-border-subtle')}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: tc('--rk-text-primary') }}>
            批注
          </span>
          <span style={{ fontSize: 12, color: tc('--rk-text-secondary'), marginLeft: 8 }}>
            {annotations.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {drafts.length > 0 && (
            <span style={{ fontSize: 11, color: '#fbbf24', background: '#fbbf2420', padding: '2px 8px', borderRadius: 10 }}>
              {drafts.length} 草稿
            </span>
          )}
          {orphans.length > 0 && (
            <span style={{ fontSize: 11, color: tc('--rk-text-secondary'), background: '#88888820', padding: '2px 8px', borderRadius: 10 }}>
              {orphans.length} 孤立
            </span>
          )}
        </div>
      </div>

      {/* Batch submit button */}
      {drafts.length > 0 && (
        <div style={{ padding: '8px 16px', borderBottom: `1px solid ${tc('--rk-border-subtle')}` }}>
          <button
            onClick={onSubmitAllDrafts}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500,
              background: tc('--rk-accent'), color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tc('--rk-accent-hover') }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = tc('--rk-accent') }}
          >
            批量提交 ({drafts.length})
          </button>
        </div>
      )}

      {/* Annotation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {annotations.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: tc('--rk-text-tertiary'), fontSize: 13 }}>
            选中文档中的文字以添加批注
          </div>
        )}
        {annotations.map((ann) => {
          const status = statusLabels[ann.status]
          return (
            <div
              key={ann.id}
              onClick={() => onClickAnnotation?.(ann)}
              style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${tc('--rk-border-subtle')}`,
                cursor: 'pointer',
                transition: 'background 0.15s',
                opacity: ann.status === 'orphaned' ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = tc('--rk-bg-secondary')
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
                  fontSize: 10, fontWeight: 500,
                  color: status.color,
                  background: status.bg,
                  padding: '1px 6px',
                  borderRadius: 8,
                }}>
                  {status.label}
                </span>
                {ann.target && (
                  <span style={{
                    fontSize: 10, fontWeight: 500,
                    color: '#a855f7', background: '#a855f720',
                    padding: '1px 6px', borderRadius: 8,
                  }}>
                    {ann.target.targetType === 'chart' ? '📊 ' : ''}{ann.target.targetType}
                    {ann.target.chartDataPoint ? ' › 数据点' : ''}
                  </span>
                )}
                <span style={{ fontSize: 10, color: tc('--rk-text-tertiary'), marginLeft: 'auto' }}>
                  {formatTime(ann.createdAt)}
                </span>
              </div>

              {/* Text excerpt */}
              <div style={{
                fontSize: 12, color: tc('--rk-text-primary'), lineHeight: 1.4,
                marginBottom: ann.note ? 4 : 0,
                textDecoration: ann.status === 'orphaned' ? 'line-through' : 'none',
              }}>
                "{ann.text.length > 80 ? ann.text.slice(0, 80) + '...' : ann.text}"
              </div>

              {/* Note */}
              {ann.note && (
                <div style={{ fontSize: 12, color: tc('--rk-text-secondary'), lineHeight: 1.3 }}>
                  {ann.note}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {ann.status === 'orphaned' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(ann.id, 'resolved') }}
                    style={{ fontSize: 11, color: tc('--rk-success'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >确认</button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(ann.id) }}
                  style={{ fontSize: 11, color: tc('--rk-error'), background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
