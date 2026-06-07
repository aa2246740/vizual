import type { GanttChartProps } from './schema'
import { tcss } from '../../core/theme-colors'

type GanttTaskRecord = {
  id?: string
  name?: string
  title?: string
  label?: string
  task?: string
  start?: string | number | Date
  startDate?: string | number | Date
  begin?: string | number | Date
  from?: string | number | Date
  date?: string | number | Date
  end?: string | number | Date
  endDate?: string | number | Date
  finish?: string | number | Date
  due?: string | number | Date
  to?: string | number | Date
  duration?: string | number
  progress?: string | number
  status?: string
  color?: string
  dependencies?: string[]
}

type RenderTask = {
  id: string
  name: string
  start: Date
  end: Date
  progress?: number
  color?: string
  dependencies: string[]
}

const DAY_MS = 24 * 60 * 60 * 1000

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function firstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') return record[key]
  }
  return undefined
}

function inferYear(tasks: GanttTaskRecord[]) {
  for (const task of tasks) {
    for (const value of [
      task.start,
      task.startDate,
      task.begin,
      task.from,
      task.date,
      task.end,
      task.endDate,
      task.finish,
      task.due,
      task.to,
    ]) {
      const match = String(value ?? '').match(/\b(20\d{2}|19\d{2})\b/)
      if (match) return Number(match[1])
    }
  }
  return 2000
}

function parseDateValue(value: unknown, fallbackYear: number): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? date : null
  }
  const text = String(value ?? '').trim()
  if (!text) return null

  const compact = text.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compact) return new Date(Number(compact[1]), Number(compact[2]) - 1, Number(compact[3]))

  const yearMonthDay = text.match(/(20\d{2}|19\d{2})\s*[年/.-]\s*(\d{1,2})\s*[月/.-]\s*(\d{1,2})/)
  if (yearMonthDay) return new Date(Number(yearMonthDay[1]), Number(yearMonthDay[2]) - 1, Number(yearMonthDay[3]))

  const monthDay = text.match(/(?:^|\s)(\d{1,2})\s*(?:月|[/.:-])\s*(\d{1,2})(?:日)?(?:\s|$)/)
  if (monthDay) return new Date(fallbackYear, Number(monthDay[1]) - 1, Number(monthDay[2]))

  const parsed = new Date(text)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function parseProgress(value: unknown, status: unknown): number | undefined {
  const numeric = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value.replace('%', '').trim())
      : Number.NaN
  if (Number.isFinite(numeric)) return Math.max(0, Math.min(100, numeric))

  const statusText = String(status ?? '').toLowerCase()
  if (/完成|done|complete|completed|finished/.test(statusText)) return 100
  if (/进行|progress|active|延期|delayed|risk|风险/.test(statusText)) return 50
  if (/未开始|todo|pending|not started/.test(statusText)) return 0
  return undefined
}

function normalizeTasks(props: Record<string, unknown>): RenderTask[] {
  const data = toRecord(props.data)
  const source = Array.isArray(props.tasks)
    ? props.tasks
    : Array.isArray(data.tasks)
      ? data.tasks
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.rows)
          ? data.rows
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(props.data)
              ? props.data
              : Array.isArray(props.items)
                ? props.items
                : Array.isArray(props.rows)
                  ? props.rows
                  : []
  const rawTasks = source.map(item => toRecord(item) as GanttTaskRecord)
  const fallbackYear = inferYear(rawTasks)

  return rawTasks
    .map((task, index): RenderTask | null => {
      const record = task as Record<string, unknown>
      const name = String(
        firstValue(record, ['name', 'title', 'label', 'task', 'activity', 'milestone'])
          ?? `Task ${index + 1}`,
      )
      const id = String(firstValue(record, ['id', 'key', 'taskId']) ?? name ?? `task_${index + 1}`)
      const start = parseDateValue(firstValue(record, ['start', 'startDate', 'begin', 'from', 'date']), fallbackYear)
      if (!start) return null

      const explicitEnd = parseDateValue(firstValue(record, ['end', 'endDate', 'finish', 'due', 'to']), fallbackYear)
      const durationValue = firstValue(record, ['duration', 'days', 'length'])
      const durationDays = typeof durationValue === 'number'
        ? durationValue
        : typeof durationValue === 'string'
          ? Number(durationValue.replace(/[^\d.-]/g, ''))
          : Number.NaN
      let end = explicitEnd
      if (!end && Number.isFinite(durationDays) && durationDays > 0) {
        end = new Date(start.getTime() + Math.max(1, durationDays) * DAY_MS)
      }
      if (!end) end = new Date(start.getTime() + DAY_MS)
      if (end.getTime() <= start.getTime()) end = new Date(start.getTime() + DAY_MS)

      const dependencies = Array.isArray(task.dependencies)
        ? task.dependencies.map(String).filter(Boolean)
        : typeof record.dependency === 'string'
          ? [record.dependency]
          : typeof record.dependsOn === 'string'
            ? [record.dependsOn]
            : []

      return {
        id,
        name,
        start,
        end,
        progress: parseProgress(task.progress ?? record.percent ?? record.completion, task.status),
        color: typeof task.color === 'string' ? task.color : undefined,
        dependencies,
      }
    })
    .filter((task): task is RenderTask => Boolean(task))
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * Gantt chart with task bars and date axis.
 */
export function GanttChart({ props }: { props: GanttChartProps | Record<string, unknown> }) {
  const tasks = normalizeTasks(props as Record<string, unknown>)
  if (tasks.length === 0) {
    return <div style={{ color: tcss('--rk-text-secondary'), fontSize: tcss('--rk-text-base') }}>No tasks</div>
  }

  const minTime = Math.min(...tasks.map(task => task.start.getTime()))
  const maxTime = Math.max(...tasks.map(task => task.end.getTime()))
  const range = Math.max(maxTime - minTime, DAY_MS)
  const labelWidth = 156
  const chartWidth = 760
  const rowHeight = 34
  const top = 32
  const bottom = 24
  const height = top + tasks.length * rowHeight + bottom
  const width = labelWidth + chartWidth + 24
  const barColors = [
    tcss('--rk-accent'),
    tcss('--rk-success'),
    tcss('--rk-warning'),
    tcss('--rk-error'),
    tcss('--rk-accent-strong'),
  ]
  const xForTime = (time: number) => labelWidth + ((time - minTime) / range) * chartWidth
  const ticks = Array.from({ length: 5 }, (_, index) => new Date(minTime + (range * index) / 4))
  const byId = new Map(tasks.map((task, index) => [task.id, { task, index }]))

  return (
    <div style={{ width: '100%' }}>
      {typeof props.title === 'string' && props.title && (
        <h3 style={{ fontSize: tcss('--rk-text-md'), fontWeight: tcss('--rk-weight-semibold'), marginBottom: 12 }}>
          {props.title}
        </h3>
      )}
      <div style={{ overflowX: 'auto', maxHeight: 440, overflowY: 'auto' }}>
        <svg
          role="img"
          aria-label={typeof props.title === 'string' ? props.title : 'Gantt chart'}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block', minWidth: '100%' }}
        >
          <g aria-hidden="true">
            {ticks.map((tick, index) => {
              const x = xForTime(tick.getTime())
              return (
                <g key={index}>
                  <line x1={x} x2={x} y1={top - 18} y2={height - bottom + 4} stroke={tcss('--rk-border-subtle')} />
                  <text x={x} y={16} textAnchor="middle" fill={tcss('--rk-text-secondary')} fontSize="12">
                    {formatMonthDay(tick)}
                  </text>
                </g>
              )
            })}
          </g>
          {tasks.map((task, index) => {
            const y = top + index * rowHeight
            const x = xForTime(task.start.getTime())
            const barWidth = Math.max(8, xForTime(task.end.getTime()) - x)
            const color = task.color ?? barColors[index % barColors.length]
            const progressWidth = task.progress == null ? 0 : Math.max(0, Math.min(barWidth, barWidth * task.progress / 100))
            return (
              <g key={task.id}>
                <text x="0" y={y + 19} fill={tcss('--rk-text-secondary')} fontSize="13">
                  {task.name}
                </text>
                <rect x={labelWidth} y={y + 7} width={chartWidth} height="18" rx="6" fill={tcss('--rk-bg-primary')} />
                <rect x={x} y={y + 7} width={barWidth} height="18" rx="6" fill={color} opacity="0.35" />
                {progressWidth > 0 && <rect x={x} y={y + 7} width={progressWidth} height="18" rx="6" fill={color} opacity="0.9" />}
                <text x={Math.min(x + barWidth + 6, width - 92)} y={y + 20} fill={tcss('--rk-text-secondary')} fontSize="11">
                  {formatMonthDay(task.start)} - {formatMonthDay(task.end)}
                </text>
                {task.dependencies.map(dependencyId => {
                  const dependency = byId.get(dependencyId)
                  if (!dependency) return null
                  const fromX = xForTime(dependency.task.end.getTime())
                  const fromY = top + dependency.index * rowHeight + 16
                  const toY = y + 16
                  return (
                    <path
                      key={dependencyId}
                      d={`M ${fromX} ${fromY} C ${fromX + 18} ${fromY}, ${x - 18} ${toY}, ${x} ${toY}`}
                      fill="none"
                      stroke={tcss('--rk-border')}
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
