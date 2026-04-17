import type { Annotation, AnnotationStatus } from './types'

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
  draft: { label: 'Draft', color: '#fbbf24', bg: '#fbbf2420' },
  active: { label: 'Active', color: '#3b82f6', bg: '#3b82f620' },
  resolved: { label: 'Resolved', color: '#22c55e', bg: '#22c55e20' },
  orphaned: { label: 'Orphaned', color: '#888', bg: '#88888820' },
}

const panelContainer: React.CSSProperties = {
  background: '#111118',
  borderLeft: '1px solid #2a2a4a',
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
    borderLeft: position === 'right' ? '1px solid #2a2a4a' : undefined,
    borderRight: position === 'left' ? '1px solid #2a2a4a' : undefined,
    borderTop: position === 'bottom' ? '1px solid #2a2a4a' : undefined,
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #2a2a4a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e5e5' }}>
            Annotations
          </span>
          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
            {annotations.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {drafts.length > 0 && (
            <span style={{ fontSize: 11, color: '#fbbf24', background: '#fbbf2420', padding: '2px 8px', borderRadius: 10 }}>
              {drafts.length} draft
            </span>
          )}
          {orphans.length > 0 && (
            <span style={{ fontSize: 11, color: '#888', background: '#88888820', padding: '2px 8px', borderRadius: 10 }}>
              {orphans.length} orphaned
            </span>
          )}
        </div>
      </div>

      {/* Batch submit button */}
      {drafts.length > 0 && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #2a2a4a' }}>
          <button
            onClick={onSubmitAllDrafts}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500,
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#2563eb' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#3b82f6' }}
          >
            Submit All Drafts ({drafts.length})
          </button>
        </div>
      )}

      {/* Annotation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {annotations.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#666', fontSize: 13 }}>
            Select text in the document to add annotations.
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
                borderBottom: '1px solid #1a1a2e',
                cursor: 'pointer',
                transition: 'background 0.15s',
                opacity: ann.status === 'orphaned' ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#1a1a2e'
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
                    {ann.target.targetType}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#555', marginLeft: 'auto' }}>
                  {formatTime(ann.createdAt)}
                </span>
              </div>

              {/* Text excerpt */}
              <div style={{
                fontSize: 12, color: '#ccc', lineHeight: 1.4,
                marginBottom: ann.note ? 4 : 0,
                textDecoration: ann.status === 'orphaned' ? 'line-through' : 'none',
              }}>
                "{ann.text.length > 80 ? ann.text.slice(0, 80) + '...' : ann.text}"
              </div>

              {/* Note */}
              {ann.note && (
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.3 }}>
                  {ann.note}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {ann.status === 'draft' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(ann.id, 'active') }}
                    style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >Submit</button>
                )}
                {ann.status === 'orphaned' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(ann.id, 'resolved') }}
                    style={{ fontSize: 11, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >Resolve</button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(ann.id) }}
                  style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >Delete</button>
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
