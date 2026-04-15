import Ajv from 'ajv'
import schema from './schema.json'
import type { ParsedSchema } from '../../core/types'

export interface FunnelStep { label: string; value: number }
export interface FunnelChartParsed extends ParsedSchema {
  valid: boolean
  title?: string
  steps: FunnelStep[]
}

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

export function parseFunnelChart(input: unknown): FunnelChartParsed {
  const valid = validate(input)
  if (!valid) return { valid: false, steps: [], originalInput: input }
  const data = input as { title?: string; steps: FunnelStep[] }
  return { valid: true, title: data.title, steps: data.steps, originalInput: input }
}
