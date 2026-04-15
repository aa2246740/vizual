import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseKpiDashboardSchema } from './parser'
import { renderKpiDashboard } from './renderer'

export { parseKpiDashboardSchema } from './parser'
export { renderKpiDashboard } from './renderer'

export const KpiDashboardSchema: SchemaHandler = {
  name: 'KpiDashboardSchema',
  parse(input: unknown): ParsedSchema {
    return parseKpiDashboardSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderKpiDashboard(parsed)
  },
}
