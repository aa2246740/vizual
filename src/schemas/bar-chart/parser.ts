import Ajv from 'ajv'
import schema from './schema.json'
import type { ParsedSchema } from '../../core/types'

export interface BarDataset { name: string; labels: string[]; values: number[] }
export interface BarChartParsed extends ParsedSchema {
  valid: boolean
  title?: string
  horizontal?: boolean
  datasets: BarDataset[]
}

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

export function parseBarChart(input: unknown): BarChartParsed {
  const valid = validate(input)
  if (!valid) return { valid: false, datasets: [], originalInput: input }
  const data = input as { title?: string; horizontal?: boolean; datasets: BarDataset[] }
  return {
    valid: true,
    title: data.title,
    horizontal: data.horizontal ?? false,
    datasets: data.datasets,
    originalInput: input
  }
}
