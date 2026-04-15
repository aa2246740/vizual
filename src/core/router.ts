import { SchemaNotFoundError } from './errors'
import type { SchemaHandler } from './types'

const schemaRegistry = new Map<string, SchemaHandler>()

export function registerSchema(id: string, handler: SchemaHandler): void {
  schemaRegistry.set(id, handler)
}

export function resolveSchema(id: string): SchemaHandler {
  const handler = schemaRegistry.get(id)
  if (!handler) {
    throw new SchemaNotFoundError(id)
  }
  return handler
}

export function getRegisteredSchemaIds(): string[] {
  return Array.from(schemaRegistry.keys())
}
