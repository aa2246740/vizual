import {
  applyArtifactPatch,
  cloneJson,
  createExportRecord,
  normalizeArtifact,
  type CreateVizualArtifactInput,
  type VizualArtifact,
  type VizualArtifactPatch,
  type VizualExportFormat,
  type VizualExportRecord,
  type VizualSpec,
} from './artifact'
import {
  exportData,
  exportElement,
  type DataExportOptions,
  type ExportOptions,
  type PDFExportOptions,
} from './export'

export type ArtifactRef = string | VizualArtifact | undefined | null

export type ArtifactListQuery = {
  conversationId?: string
  messageId?: string
  kind?: VizualArtifact['kind']
}

export interface VizualArtifactStore {
  save(artifact: VizualArtifact): Promise<VizualArtifact> | VizualArtifact
  load(id: string): Promise<VizualArtifact | null> | VizualArtifact | null
  list(query?: ArtifactListQuery): Promise<VizualArtifact[]> | VizualArtifact[]
  delete?(id: string): Promise<boolean> | boolean
  clear?(): Promise<void> | void
}

export type HostRenderResult = {
  artifact?: VizualArtifact
  root?: unknown
}

export type HostRenderAdapter = (
  artifact: VizualArtifact,
  container: HTMLElement,
  options?: Record<string, unknown>,
) => Promise<HostRenderResult | void> | HostRenderResult | void

export type HostRuntimeEvent =
  | { type: 'artifactSaved'; artifact: VizualArtifact }
  | { type: 'artifactRendered'; artifact: VizualArtifact; container?: HTMLElement }
  | { type: 'artifactUpdated'; artifact: VizualArtifact; patch: VizualArtifactPatch | VizualArtifactPatch[] }
  | { type: 'artifactExported'; artifact: VizualArtifact; exportRecord: VizualExportRecord }
  | { type: 'artifactError'; artifact?: VizualArtifact; error: Error }

export type HostRuntimeEventHandler = (event: HostRuntimeEvent) => void

export type RenderMessageArtifactInput = {
  messageId?: string
  conversationId?: string
  prompt?: string
  artifact?: VizualArtifact | CreateVizualArtifactInput
  spec?: VizualSpec
  container?: HTMLElement
  renderOptions?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type ExportArtifactInput = {
  ref?: ArtifactRef
  format: VizualExportFormat
  element?: HTMLElement
  rows?: Array<Record<string, unknown>>
  filename?: string
  options?: ExportOptions | PDFExportOptions | DataExportOptions
}

export function createMemoryArtifactStore(initialArtifacts: VizualArtifact[] = []): VizualArtifactStore {
  const artifacts = new Map<string, VizualArtifact>()
  initialArtifacts.forEach(artifact => artifacts.set(artifact.id, cloneJson(artifact)))

  return {
    save(artifact) {
      const saved = cloneJson(artifact)
      artifacts.set(saved.id, saved)
      return cloneJson(saved)
    },
    load(id) {
      const artifact = artifacts.get(id)
      return artifact ? cloneJson(artifact) : null
    },
    list(query) {
      return Array.from(artifacts.values())
        .filter(artifact => !query?.conversationId || artifact.source?.conversationId === query.conversationId)
        .filter(artifact => !query?.messageId || artifact.source?.messageId === query.messageId)
        .filter(artifact => !query?.kind || artifact.kind === query.kind)
        .map(artifact => cloneJson(artifact))
    },
    delete(id) {
      return artifacts.delete(id)
    },
    clear() {
      artifacts.clear()
    },
  }
}

export function createLocalStorageArtifactStore(
  key = 'vizual:artifacts',
  storage: Storage | undefined = typeof localStorage !== 'undefined' ? localStorage : undefined,
): VizualArtifactStore {
  if (!storage) {
    return createMemoryArtifactStore()
  }

  const readAll = (): VizualArtifact[] => {
    const raw = storage.getItem(key)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  const writeAll = (artifacts: VizualArtifact[]) => {
    storage.setItem(key, JSON.stringify(artifacts))
  }

  return {
    save(artifact) {
      const artifacts = readAll().filter(item => item.id !== artifact.id)
      const saved = cloneJson(artifact)
      artifacts.push(saved)
      writeAll(artifacts)
      return cloneJson(saved)
    },
    load(id) {
      const artifact = readAll().find(item => item.id === id)
      return artifact ? cloneJson(artifact) : null
    },
    list(query) {
      return readAll()
        .filter(artifact => !query?.conversationId || artifact.source?.conversationId === query.conversationId)
        .filter(artifact => !query?.messageId || artifact.source?.messageId === query.messageId)
        .filter(artifact => !query?.kind || artifact.kind === query.kind)
        .map(artifact => cloneJson(artifact))
    },
    delete(id) {
      const before = readAll()
      const after = before.filter(item => item.id !== id)
      writeAll(after)
      return before.length !== after.length
    },
    clear() {
      storage.removeItem(key)
    },
  }
}

export class VizualHostRuntime {
  private store: VizualArtifactStore
  private renderAdapter?: HostRenderAdapter
  private listeners = new Set<HostRuntimeEventHandler>()
  private lastArtifactId: string | null = null

  constructor(options: {
    store?: VizualArtifactStore
    renderArtifact?: HostRenderAdapter
    onEvent?: HostRuntimeEventHandler
  } = {}) {
    this.store = options.store || createMemoryArtifactStore()
    this.renderAdapter = options.renderArtifact
    if (options.onEvent) this.listeners.add(options.onEvent)
  }

  onEvent(handler: HostRuntimeEventHandler) {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  }

  async saveArtifact(input: VizualArtifact | CreateVizualArtifactInput | VizualSpec): Promise<VizualArtifact> {
    const artifact = normalizeArtifact(input as VizualArtifact | CreateVizualArtifactInput | VizualSpec)
    const saved = await this.store.save(artifact)
    this.lastArtifactId = saved.id
    this.emit({ type: 'artifactSaved', artifact: saved })
    return saved
  }

  async renderMessageArtifact(input: RenderMessageArtifactInput): Promise<VizualArtifact> {
    const artifactInput = input.artifact || input.spec
    if (!artifactInput) throw new Error('renderMessageArtifact requires artifact or spec')

    let artifact = normalizeArtifact(artifactInput as VizualArtifact | CreateVizualArtifactInput | VizualSpec, {
      source: {
        messageId: input.messageId,
        conversationId: input.conversationId,
        prompt: input.prompt,
      },
      metadata: input.metadata,
    })

    if (input.messageId || input.conversationId || input.prompt) {
      artifact.source = {
        ...(artifact.source || {}),
        messageId: input.messageId || artifact.source?.messageId,
        conversationId: input.conversationId || artifact.source?.conversationId,
        prompt: input.prompt || artifact.source?.prompt,
      }
    }

    if (input.container && this.renderAdapter) {
      const rendered = await this.renderAdapter(artifact, input.container, input.renderOptions)
      if (rendered?.artifact) artifact = rendered.artifact
      this.emit({ type: 'artifactRendered', artifact, container: input.container })
    }

    return this.saveArtifact(artifact)
  }

  async getArtifact(ref?: ArtifactRef): Promise<VizualArtifact | null> {
    if (isArtifactObject(ref)) return cloneJson(ref)
    const id = ref || this.lastArtifactId
    if (!id) return null
    return this.store.load(id)
  }

  async listArtifacts(query?: ArtifactListQuery): Promise<VizualArtifact[]> {
    return this.store.list(query)
  }

  async updateArtifact(ref: ArtifactRef, patch: VizualArtifactPatch | VizualArtifactPatch[]): Promise<VizualArtifact> {
    const artifact = await this.getArtifact(ref)
    if (!artifact) throw new Error('Cannot update missing Vizual artifact')
    const updated = applyArtifactPatch(artifact, patch)
    const saved = await this.store.save(updated)
    this.lastArtifactId = saved.id
    this.emit({ type: 'artifactUpdated', artifact: saved, patch })
    return saved
  }

  async renderArtifact(
    ref: ArtifactRef,
    container: HTMLElement,
    options?: Record<string, unknown>,
  ): Promise<VizualArtifact> {
    const artifact = await this.getArtifact(ref)
    if (!artifact) throw new Error('Cannot render missing Vizual artifact')
    if (!this.renderAdapter) throw new Error('VizualHostRuntime render adapter is not configured')
    const rendered = await this.renderAdapter(artifact, container, options)
    const next = rendered?.artifact || artifact
    const saved = await this.store.save(next)
    this.lastArtifactId = saved.id
    this.emit({ type: 'artifactRendered', artifact: saved, container })
    return saved
  }

  async exportArtifact(input: ExportArtifactInput): Promise<{ blob: Blob; record: VizualExportRecord; artifact: VizualArtifact }> {
    const artifact = await this.getArtifact(input.ref)
    if (!artifact) throw new Error('Cannot export missing Vizual artifact')
    const filename = input.filename || artifact.id
    let blob: Blob

    if (input.format === 'png' || input.format === 'pdf') {
      if (!input.element) throw new Error(`${input.format} export requires an HTMLElement`)
      blob = await exportElement(input.element, input.format, {
        ...(input.options as ExportOptions | PDFExportOptions | undefined),
        filename,
      })
    } else if (input.format === 'csv' || input.format === 'xlsx') {
      const rows = input.rows || extractFirstRows(artifact)
      blob = await exportData(rows, input.format, input.options as DataExportOptions | undefined)
    } else {
      throw new Error(`Unsupported export format: ${input.format}`)
    }

    const record = createExportRecord(artifact, {
      format: input.format,
      filename,
      status: 'success',
      meta: {
        size: blob.size,
        type: blob.type,
      },
    })
    const updated = applyArtifactPatch(artifact, { type: 'addExportRecord', export: record })
    const saved = await this.store.save(updated)
    this.lastArtifactId = saved.id
    this.emit({ type: 'artifactExported', artifact: saved, exportRecord: record })
    return { blob, record, artifact: saved }
  }

  private emit(event: HostRuntimeEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch {
        // Host event handlers should not break runtime state.
      }
    }
  }
}

export function createHostRuntime(options?: ConstructorParameters<typeof VizualHostRuntime>[0]) {
  return new VizualHostRuntime(options)
}

function isArtifactObject(value: ArtifactRef): value is VizualArtifact {
  return typeof value === 'object' && value !== null && 'id' in value && 'spec' in value
}

function extractFirstRows(artifact: VizualArtifact): Array<Record<string, unknown>> {
  const elements = Object.values(artifact.spec.elements || {})
  for (const element of elements) {
    const data = element.props?.data
    if (Array.isArray(data) && data.every(row => typeof row === 'object' && row !== null && !Array.isArray(row))) {
      return data as Array<Record<string, unknown>>
    }
  }
  if (Array.isArray(artifact.data) && artifact.data.every(row => typeof row === 'object' && row !== null && !Array.isArray(row))) {
    return artifact.data as Array<Record<string, unknown>>
  }
  return []
}
