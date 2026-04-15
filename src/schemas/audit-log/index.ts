import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseAuditLogSchema } from './parser'
import { renderAuditLog } from './renderer'

export { parseAuditLogSchema } from './parser'
export { renderAuditLog } from './renderer'

export const AuditLogSchema: SchemaHandler = {
  name: 'AuditLogSchema',
  parse(input: unknown): ParsedSchema {
    return parseAuditLogSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderAuditLog(parsed)
  },
}
