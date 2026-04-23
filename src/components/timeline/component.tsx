import type { TimelineProps } from './schema'
import { tcss, tc } from '../../core/theme-colors'
import { useAnnotationContext } from '../../docview/annotation-context'

const styles = {
  container: {
    position: 'relative' as const,
    paddingLeft: 24,
    fontFamily: tcss('--rk-font-sans'),
  },
  line: {
    position: 'absolute' as const,
    left: 7,
    top: 8,
    bottom: 8,
    width: 2,
    background: tcss('--rk-border'),
  },
  event: {
    position: 'relative' as const,
    paddingBottom: 20,
    paddingLeft: 20,
  },
  dot: {
    position: 'absolute' as const,
    left: -20,
    top: 6,
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: tcss('--rk-accent'),
    border: `2px solid ${tcss('--rk-bg-primary')}`,
  },
  date: {
    fontSize:tcss('--rk-text-sm'),
    color: tcss('--rk-text-secondary'),
    marginBottom: 2,
  },
  title: {
    fontSize:tcss('--rk-text-md'),
    fontWeight:tcss('--rk-weight-semibold') as const,
    color: tcss('--rk-text-primary'),
    marginBottom: 2,
  },
  description: {
    fontSize:tcss('--rk-text-base'),
    color: tcss('--rk-text-secondary'),
    lineHeight: 1.5,
  },
}

/**
 * Timeline custom component — vertical event flow.
 * 在 DocView 内时，每个事件支持独立批注。
 */
export function Timeline({ props }: { props: TimelineProps }) {
  const ctx = useAnnotationContext()
  return (
    <div style={styles.container}>
      {props.title && (
        <h3 style={{ fontSize:tcss('--rk-text-lg'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 12, color: tcss('--rk-text-primary') }}>
          {props.title}
        </h3>
      )}
      <div style={{maxHeight:400,overflowY:'auto',position:'relative'}}>
      <div style={styles.line} />
      {props.events.map((event, i) => {
        const eventAnnotationProps = ctx ? {
          'data-docview-target': `timeline-${ctx.sectionIndex}-${i}`,
          'data-section-index': ctx.sectionIndex,
          'data-target-type': 'component',
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation()
            ctx.onTargetClick?.({
              sectionIndex: ctx.sectionIndex,
              targetType: 'component',
              label: `${event.date} - ${event.title}`,
              targetId: `timeline-${ctx.sectionIndex}-${i}`,
            }, e.currentTarget as HTMLElement)
          },
          style: { ...styles.event, cursor: 'pointer' as const },
        } : { style: styles.event }
        return (
          <div key={i} {...eventAnnotationProps}>
            <div style={styles.dot} />
            <div style={styles.date}>{event.date}</div>
            <div style={styles.title}>{event.title}</div>
            {event.description && <div style={styles.description}>{event.description}</div>}
          </div>
        )
      })}
      </div>
    </div>
  )
}
