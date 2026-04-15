import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseKanbanSchema } from './parser'
import { renderKanban } from './renderer'

export { parseKanbanSchema } from './parser'
export { renderKanban } from './renderer'

export const KanbanSchema: SchemaHandler = {
  name: 'KanbanSchema',
  parse(input: unknown): ParsedSchema {
    return parseKanbanSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderKanban(parsed)
  },
}
