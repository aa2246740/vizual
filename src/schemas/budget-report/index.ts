import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseBudgetReportSchema } from './parser'
import { renderBudgetReport } from './renderer'

export { parseBudgetReportSchema } from './parser'
export { renderBudgetReport } from './renderer'

export const BudgetReportSchema: SchemaHandler = {
  name: 'BudgetReportSchema',
  parse(input: unknown): ParsedSchema {
    return parseBudgetReportSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderBudgetReport(parsed)
  },
}
