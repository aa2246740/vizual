import Ajv from 'ajv'
import schema from './schema.json'
import type { ParsedSchema } from '../../core/types'

export interface GanttTask {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number
  status: 'completed' | 'in-progress' | 'pending' | 'delayed'
  assignee?: string
}

export interface GanttChartParsed extends ParsedSchema {
  valid: boolean
  title?: string
  tasks: GanttTask[]
}

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

export function parseGanttChart(input: unknown): GanttChartParsed {
  const valid = validate(input)
  if (!valid) {
    return { valid: false, tasks: [], originalInput: input }
  }
  const data = input as { title?: string; tasks: GanttTask[] }
  return {
    valid: true,
    title: data.title,
    tasks: data.tasks.map(t => ({
      ...t,
      progress: t.progress ?? 0
    })),
    originalInput: input
  }
}
