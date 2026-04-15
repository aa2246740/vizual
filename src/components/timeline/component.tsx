import type { TimelineProps } from './schema'

const styles = {
  container: {
    position: 'relative' as const,
    paddingLeft: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  line: {
    position: 'absolute' as const,
    left: 7,
    top: 8,
    bottom: 8,
    width: 2,
    background: 'var(--rk-border, #e2e8f0)',
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
    background: 'var(--rk-primary, #3b82f6)',
    border: '2px solid var(--rk-bg-primary, #fff)',
  },
  date: {
    fontSize: 12,
    color: 'var(--rk-text-secondary, #64748b)',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: 'var(--rk-text-primary, #1e293b)',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: 'var(--rk-text-secondary, #64748b)',
    lineHeight: 1.5,
  },
}

/**
 * Timeline custom component — vertical event flow
 */
export function Timeline(props: TimelineProps) {
  return (
    <div style={styles.container}>
      {props.title && (
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--rk-text-primary, #1e293b)' }}>
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
