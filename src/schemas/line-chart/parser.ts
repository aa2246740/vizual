import Ajv from 'ajv'
import schema from './schema.json'
import type { ParsedSchema } from '../../core/types'

export interface DataPoint { label: string; value: number }
export interface LineDataset { name: string; data: DataPoint[] }
export interface LineChartParsed extends ParsedSchema {
  valid: boolean
  title?: string
  datasets: LineDataset[]
}

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

export function parseLineChart(input: unknown): LineChartParsed {
  const valid = validate(input)
  if (!valid) return { valid: false, datasets: [], originalInput: input }
  const data = input as { title?: string; datasets: LineDataset[] }
  return { valid: true, title: data.title, datasets: data.datasets, originalInput: input }
}
