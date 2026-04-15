import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseFunnelChart } from './parser'
import { renderFunnelChart } from './renderer'
export { parseFunnelChart as parseFunnelChartSchema } from './parser'
export { renderFunnelChart }
export const FunnelChartSchema: SchemaHandler = {
  name: 'FunnelChartSchema',
  parse(input: unknown): ParsedSchema { return parseFunnelChart(input) },
  render(parsed: ParsedSchema): HTMLElement { return renderFunnelChart(parsed) },
}
