import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseDataTableSchema } from './parser'
import { renderDataTable } from './renderer'

export { parseDataTableSchema } from './parser'
export { renderDataTable } from './renderer'

export const DataTableSchema: SchemaHandler = {
  name: 'DataTableSchema',
  parse(input: unknown): ParsedSchema {
    return parseDataTableSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderDataTable(parsed)
  },
}
