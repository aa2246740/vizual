import { z } from 'zod'

/**
 * RadarChart schema.
 *
 * Supports two input modes:
 * 1. **Indicator mode** — provide `indicators` (dimension names + max values)
 *    and `series` (arrays of values per dimension). Best for pre-structured data.
 * 2. **Table mode** — provide flat `data` rows with `x` (dimension field)
 *    and `y` (metric fields). The builder auto-extracts indicators and series.
 */
export const RadarChartSchema = z.object({
  type: z.literal('radar'),
  title: z.string().optional(),
  /** Dimension definitions: [{name, max}] */
  indicators: z.array(z.object({
    name: z.string(),
    max: z.number().optional(),
  })).optional(),
  /** One or more data series, each with an array of values matching indicators */
  series: z.array(z.object({
    name: z.string().optional(),
    values: z.array(z.number()),
  })).optional(),
  /** Flat table data (alternative to indicators + series) */
  data: z.array(z.record(z.unknown())).optional(),
  /** Dimension name field (table mode). Default: 'name' */
  x: z.string().optional(),
  /** Metric field(s) (table mode). Default: 'value' */
  y: z.union([z.string(), z.array(z.string())]).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

export type RadarChartProps = z.infer<typeof RadarChartSchema>
