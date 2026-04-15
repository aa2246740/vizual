export interface SchemaHandler {
  readonly name: string
  parse(input: unknown): ParsedSchema
  render(parsed: ParsedSchema): HTMLElement
}

export interface ParsedSchema {
  valid: boolean
  data: unknown
  fallback?: boolean
  originalInput?: unknown
}
