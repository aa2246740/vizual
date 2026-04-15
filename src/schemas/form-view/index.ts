import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseFormViewSchema } from './parser'
import { renderFormView } from './renderer'

export { parseFormViewSchema } from './parser'
export { renderFormView } from './renderer'

export const FormViewSchema: SchemaHandler = {
  name: 'FormViewSchema',
  parse(input: unknown): ParsedSchema {
    return parseFormViewSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderFormView(parsed)
  },
}
