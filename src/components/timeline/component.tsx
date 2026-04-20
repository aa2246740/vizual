import type { TimelineProps } from './schema'
import { tc } from '../../core/theme-colors'

const styles = {
  container: {
    position: 'relative' as const,
    paddingLeft: 24,
    fontFamily: tc('--rk-font-sans'),
  },
  line: {
    position: 'absolute' as const,
    left: 7,
    top: 8,
    bottom: 8,
    width: 2,
    background: tc('--rk-border'),
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
    background: tc('--rk-accent'),
    border: `2px solid ${tc('--rk-bg-primary')}`,
  },
  date: {
    fontSize: 12,
    color: tc('--rk-text-secondary'),
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: tc('--rk-text-primary'),
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: tc('--rk-text-secondary'),
    lineHeight: 1.5,
  },
}

/**
 * Timeline custom component — vertical event flow
 */
export function Timeline({ props }: { props: TimelineProps }) {
  return (
    <div style={styles.container}>
      {props.title && (
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: tc('--rk-text-primary') }}>
          {props.title}
        </h3>
      )}
      <div style={styles.line} />
      {props.events.map((event, i) => (
        <div key={i} style={styles.event}>
          <div style={styles.dot} />
          <div style={styles.date}>{event.date}</div>
          <div style={styles.title}>{event.title}</div>
          {event.description && <div style={styles.description}>{event.description}</div>}
        </div>
      ))}
    </div>
  )
}
