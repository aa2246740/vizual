import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseFeatureTableSchema } from './parser'
import { renderFeatureTable } from './renderer'

export { parseFeatureTableSchema } from './parser'
export { renderFeatureTable } from './renderer'

export const FeatureTableSchema: SchemaHandler = {
  name: 'FeatureTableSchema',
  parse(input: unknown): ParsedSchema {
    return parseFeatureTableSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderFeatureTable(parsed)
  },
}
