import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseJsonViewerSchema } from './parser'
import { renderJsonViewer } from './renderer'

export { parseJsonViewerSchema } from './parser'
export { renderJsonViewer } from './renderer'

export const JsonViewerSchema: SchemaHandler = {
  name: 'JsonViewerSchema',
  parse(input: unknown): ParsedSchema {
    return parseJsonViewerSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderJsonViewer(parsed)
  },
}
