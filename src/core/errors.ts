export class SchemaNotFoundError extends Error {
  public readonly schemaId: string

  constructor(schemaId: string) {
    super(`Schema not found: "${schemaId}"`)
    this.name = 'SchemaNotFoundError'
    this.schemaId = schemaId
  }
}
