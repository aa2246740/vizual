import Ajv from 'ajv'
import schema from './schema.json'
import type { ParsedSchema } from '../../core/types'

export interface PieSegment { label: string; value: number }
export interface PieChartParsed extends ParsedSchema {
  valid: boolean
  title?: string
  donut?: boolean
  segments: PieSegment[]
}

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

export function parsePieChart(input: unknown): PieChartParsed {
  const valid = validate(input)
  if (!valid) return { valid: false, segments: [], originalInput: input }
  const data = input as { title?: string; donut?: boolean; segments: PieSegment[] }
  return {
    valid: true,
    title: data.title,
    donut: data.donut ?? false,
    segments: data.segments,
    originalInput: input
  }
}
