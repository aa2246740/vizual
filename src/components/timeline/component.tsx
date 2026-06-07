import type { CSSProperties } from 'react'
import type { TimelineProps } from './schema'
import { tcss } from '../../core/theme-colors'

type TimelineEvent = {
  date?: string
  time?: string
  title?: string
  label?: string
  name?: string
  description?: string
  detail?: string
  content?: string
}

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'relative',
    paddingLeft: 24,
    fontFamily: tcss('--rk-font-sans'),
  },
  line: {
    position: 'absolute',
    left: 7,
    top: 8,
    bottom: 8,
    width: 2,
    background: tcss('--rk-border'),
  },
  event: {
    position: 'relative',
    paddingBottom: 20,
    paddingLeft: 20,
  },
  dot: {
    position: 'absolute',
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
    fontWeight:tcss('--rk-weight-semibold'),
    color: tcss('--rk-text-primary'),
    marginBottom: 2,
  },
  description: {
    fontSize:tcss('--rk-text-base'),
    color: tcss('--rk-text-secondary'),
    lineHeight: 1.5,
  },
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined
}

function normalizeEvents(props: TimelineProps | Record<string, unknown>): Array<{ date: string; title: string; description?: string }> {
  const record = props as Record<string, unknown>
  const data = toRecord(record.data)
  const source =
    asArray(record.events) ??
    asArray(record.items) ??
    asArray(data.events) ??
    asArray(data.items) ??
    asArray(data.timeline) ??
    []

  return source
    .map((item): { date: string; title: string; description?: string } | null => {
      const record = toRecord(item) as TimelineEvent
      const date = String(record.date ?? record.time ?? '').trim()
      const title = String(record.title ?? record.label ?? record.name ?? '').trim()
      if (!date || !title) return null
      const description = record.description ?? record.detail ?? record.content
      return {
        date,
        title,
        description: description == null ? undefined : String(description),
      }
    })
    .filter((event): event is { date: string; title: string; description?: string } => Boolean(event))
}

/**
 * Timeline custom component — vertical event flow.
 */
export function Timeline({ props }: { props: TimelineProps | Record<string, unknown> }) {
  const events = normalizeEvents(props)
  return (
    <div style={styles.container}>
      {typeof props.title === 'string' && props.title && (
        <h3 style={{ fontSize:tcss('--rk-text-lg'), fontWeight:tcss('--rk-weight-semibold'), marginBottom: 12, color: tcss('--rk-text-primary') }}>
          {props.title}
        </h3>
      )}
      <div style={{maxHeight:400,overflowY:'auto',position:'relative'}}>
      <div style={styles.line} />
      {events.map((event, i) => (
          <div key={i} style={styles.event}>
            <div style={styles.dot} />
            <div style={styles.date}>{event.date}</div>
            <div style={styles.title}>{event.title}</div>
            {event.description && <div style={styles.description}>{event.description}</div>}
          </div>
      ))}
      </div>
    </div>
  )
}
