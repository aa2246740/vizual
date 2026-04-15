import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseCodeBlockSchema } from './parser'
import { renderCodeBlock } from './renderer'

export { parseCodeBlockSchema } from './parser'
export { renderCodeBlock } from './renderer'

export const CodeBlockSchema: SchemaHandler = {
  name: 'CodeBlockSchema',
  parse(input: unknown): ParsedSchema {
    return parseCodeBlockSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderCodeBlock(parsed)
  },
}
