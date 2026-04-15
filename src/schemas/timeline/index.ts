import type { SchemaHandler, ParsedSchema } from '../../core/types'
import { parseTimelineSchema } from './parser'
import { renderTimeline } from './renderer'

export { parseTimelineSchema } from './parser'
export { renderTimeline } from './renderer'

export const TimelineSchema: SchemaHandler = {
  name: 'TimelineSchema',
  parse(input: unknown): ParsedSchema {
    return parseTimelineSchema(input)
  },
  render(parsed: ParsedSchema): HTMLElement {
    return renderTimeline(parsed)
  },
}
