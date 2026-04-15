import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseOrgChartSchema } from './parser'
import { renderOrgChart } from './renderer'

export { parseOrgChartSchema } from './parser'
export { renderOrgChart } from './renderer'

export const OrgChartSchema: SchemaHandler = {
  name: 'OrgChartSchema',
  parse(input: unknown): ParsedSchema {
    return parseOrgChartSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderOrgChart(parsed)
  },
}
