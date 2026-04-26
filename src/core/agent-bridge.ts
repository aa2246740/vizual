import {
  applyArtifactPatch,
  cloneJson,
  type VizualArtifact,
  type VizualArtifactPatch,
  type VizualSpec,
} from './artifact'

export type AgentBridgeArtifactRef = string | VizualArtifact | undefined | null

export type AgentBridgeRenderKind =
  | 'static'
  | 'artifact'
  | 'update'
  | 'update-new-message'
  | 'liveControl'
  | 'interactive'
  | 'docview'
  | string

export type AgentBridgeRenderRecord = {
  kind: AgentBridgeRenderKind
  id: string
  at: string
  pendingMessage?: unknown
  artifactId?: string | null
  status?: string
  spec?: VizualSpec | null
  [key: string]: unknown
}

export type AgentBridgeArtifactEvent = {
  kind: string
  artifactId: string | null
  at: string
  [key: string]: unknown
}

export type LiveControlSnapshot = {
  id: string
  state: Record<string, unknown>
  artifact: VizualArtifact | null
  renderCount: number
  pending: boolean
  lastPreviewSpec: VizualSpec | null
  lastPreviewSummary: unknown
  status: string
  error: string | null
  [key: string]: unknown
}

export type InteractiveSnapshot = LiveControlSnapshot

export type LiveControlSessionAdapter = {
  getSnapshot(): LiveControlSnapshot | null
  getArtifact?: () => VizualArtifact | null
}

export type InteractiveSessionAdapter = LiveControlSessionAdapter

export type AgentBridgeSnapshot = {
  lastVizualRender: AgentBridgeRenderRecord | null
  renderHistory: AgentBridgeRenderRecord[]
  artifacts: VizualArtifact[]
  artifactsById: Record<string, VizualArtifact>
  messageArtifacts: Record<string, string>
  messageArtifactSnapshots: Record<string, VizualArtifact>
  artifactMessages: Record<string, string>
  artifactHistory: AgentBridgeArtifactEvent[]
  lastArtifact: VizualArtifact | null
  liveControlIds: string[]
  /** @deprecated use liveControlIds */
  interactiveIds: string[]
}

export type CreateAgentBridgeOptions = {
  maxRenderHistory?: number
  maxArtifactHistory?: number
  now?: () => string
  getPendingMessage?: () => unknown
}

export class VizualAgentBridge {
  private artifacts = new Map<string, VizualArtifact>()
  private messageArtifacts = new Map<string, string>()
  private messageArtifactSnapshots = new Map<string, VizualArtifact>()
  private artifactMessages = new Map<string, string>()
  private artifactHistory: AgentBridgeArtifactEvent[] = []
  private renderHistory: AgentBridgeRenderRecord[] = []
  private liveControlSessions = new Map<string, LiveControlSessionAdapter>()
  private lastArtifactId: string | null = null
  private maxRenderHistory: number
  private maxArtifactHistory: number
  private now: () => string
  private getPendingMessage?: () => unknown

  constructor(options: CreateAgentBridgeOptions = {}) {
    this.maxRenderHistory = options.maxRenderHistory ?? 50
    this.maxArtifactHistory = options.maxArtifactHistory ?? 100
    this.now = options.now ?? (() => new Date().toISOString())
    this.getPendingMessage = options.getPendingMessage
  }

  rememberArtifact(messageId: string | null | undefined, artifact: VizualArtifact | null | undefined): VizualArtifact | null {
    if (!artifact?.id) return artifact ?? null
    const saved = cloneJson(artifact)
    this.artifacts.set(saved.id, saved)
    if (messageId) {
      this.messageArtifacts.set(messageId, saved.id)
      this.messageArtifactSnapshots.set(messageId, cloneJson(saved))
      this.artifactMessages.set(saved.id, messageId)
    }
    this.lastArtifactId = saved.id
    this.recordArtifactEvent('stored', saved, {
      messageId: messageId || null,
      status: saved.status || null,
      targetCount: Array.isArray(saved.targetMap) ? saved.targetMap.length : 0,
    })
    return cloneJson(saved)
  }

  getArtifact(ref: AgentBridgeArtifactRef = 'last'): VizualArtifact | null {
    if (isArtifactObject(ref)) return cloneJson(ref)
    const id = ref || 'last'
    if (id === 'last') {
      return this.lastArtifactId ? cloneJson(this.artifacts.get(this.lastArtifactId) ?? null) : null
    }
    if (this.artifacts.has(id)) return cloneJson(this.artifacts.get(id)!)
    if (this.messageArtifactSnapshots.has(id)) return cloneJson(this.messageArtifactSnapshots.get(id)!)
    const artifactId = this.messageArtifacts.get(id)
    if (artifactId && this.artifacts.has(artifactId)) return cloneJson(this.artifacts.get(artifactId)!)
    return null
  }

  getLastArtifact(): VizualArtifact | null {
    return this.getArtifact('last')
  }

  listArtifacts(): VizualArtifact[] {
    return Array.from(this.artifacts.values()).map(artifact => cloneJson(artifact))
  }

  getMessageIdForArtifactRef(ref: AgentBridgeArtifactRef, artifact?: VizualArtifact | null): string | null {
    if (typeof ref === 'string' && this.messageArtifacts.has(ref)) return ref
    const id = isArtifactObject(ref) ? ref.id : artifact?.id || (typeof ref === 'string' ? ref : null)
    if (id && this.artifactMessages.has(id)) return this.artifactMessages.get(id) || null
    return null
  }

  updateArtifact(ref: AgentBridgeArtifactRef, patch: VizualArtifactPatch | VizualArtifactPatch[]): VizualArtifact | null {
    const artifact = this.getArtifact(ref)
    if (!artifact) return null
    const updated = applyArtifactPatch(artifact, patch)
    return this.rememberArtifact(this.getMessageIdForArtifactRef(ref, artifact), updated)
  }

  recordRender(kind: AgentBridgeRenderKind, id: string, details: Record<string, unknown> = {}): AgentBridgeRenderRecord {
    const record: AgentBridgeRenderRecord = {
      kind,
      id,
      at: this.now(),
      pendingMessage: this.getPendingMessage?.(),
      ...cloneJson(details),
    }
    this.renderHistory.push(record)
    if (this.renderHistory.length > this.maxRenderHistory) {
      this.renderHistory.splice(0, this.renderHistory.length - this.maxRenderHistory)
    }
    return cloneJson(record)
  }

  recordArtifactEvent(kind: string, artifact: VizualArtifact | null | undefined, details: Record<string, unknown> = {}): AgentBridgeArtifactEvent {
    const event: AgentBridgeArtifactEvent = {
      kind,
      artifactId: artifact?.id || null,
      at: this.now(),
      ...cloneJson(details),
    }
    this.artifactHistory.push(event)
    if (this.artifactHistory.length > this.maxArtifactHistory) {
      this.artifactHistory.splice(0, this.artifactHistory.length - this.maxArtifactHistory)
    }
    return cloneJson(event)
  }

  registerLiveControlSession(id: string, session: LiveControlSessionAdapter) {
    this.liveControlSessions.set(id, session)
  }

  /** @deprecated use registerLiveControlSession */
  registerInteractiveSession(id: string, session: InteractiveSessionAdapter) {
    this.registerLiveControlSession(id, session)
  }

  unregisterLiveControlSession(id: string) {
    this.liveControlSessions.delete(id)
  }

  /** @deprecated use unregisterLiveControlSession */
  unregisterInteractiveSession(id: string) {
    this.unregisterLiveControlSession(id)
  }

  resolveLiveControlSession(ref: AgentBridgeArtifactRef = 'last'): { id: string; session: LiveControlSessionAdapter } | null {
    if (typeof ref === 'string' && ref !== 'last' && this.liveControlSessions.has(ref)) {
      return { id: ref, session: this.liveControlSessions.get(ref)! }
    }
    const artifact = this.getArtifact(ref)
    const messageId = artifact?.source?.messageId || this.getMessageIdForArtifactRef(ref, artifact)
    if (messageId && this.liveControlSessions.has(messageId)) {
      return { id: messageId, session: this.liveControlSessions.get(messageId)! }
    }
    if (!ref || ref === 'last') {
      for (let i = this.renderHistory.length - 1; i >= 0; i -= 1) {
        const record = this.renderHistory[i]
        if ((record.kind === 'liveControl' || record.kind === 'interactive') && this.liveControlSessions.has(record.id)) {
          return { id: record.id, session: this.liveControlSessions.get(record.id)! }
        }
      }
      const ids = Array.from(this.liveControlSessions.keys())
      const id = ids[ids.length - 1]
      return id ? { id, session: this.liveControlSessions.get(id)! } : null
    }
    return null
  }

  /** @deprecated use resolveLiveControlSession */
  resolveInteractiveSession(ref: AgentBridgeArtifactRef = 'last'): { id: string; session: InteractiveSessionAdapter } | null {
    return this.resolveLiveControlSession(ref)
  }

  getLiveControlSnapshot(ref: AgentBridgeArtifactRef = 'last'): LiveControlSnapshot | null {
    const resolved = this.resolveLiveControlSession(ref)
    return resolved?.session.getSnapshot?.() || null
  }

  /** @deprecated use getLiveControlSnapshot */
  getInteractiveSnapshot(ref: AgentBridgeArtifactRef = 'last'): InteractiveSnapshot | null {
    return this.getLiveControlSnapshot(ref)
  }

  snapshot(): AgentBridgeSnapshot {
    const artifactsById = Object.fromEntries(
      Array.from(this.artifacts.entries()).map(([id, artifact]) => [id, cloneJson(artifact)]),
    )
    return {
      lastVizualRender: this.renderHistory.length ? cloneJson(this.renderHistory[this.renderHistory.length - 1]) : null,
      renderHistory: this.renderHistory.map(record => cloneJson(record)),
      artifacts: this.listArtifacts(),
      artifactsById,
      messageArtifacts: Object.fromEntries(this.messageArtifacts),
      messageArtifactSnapshots: Object.fromEntries(
        Array.from(this.messageArtifactSnapshots.entries()).map(([id, artifact]) => [id, cloneJson(artifact)]),
      ),
      artifactMessages: Object.fromEntries(this.artifactMessages),
      artifactHistory: this.artifactHistory.map(event => cloneJson(event)),
      lastArtifact: this.getLastArtifact(),
      liveControlIds: Array.from(this.liveControlSessions.keys()),
      interactiveIds: Array.from(this.liveControlSessions.keys()),
    }
  }
}

export function createAgentBridge(options?: CreateAgentBridgeOptions) {
  return new VizualAgentBridge(options)
}

function isArtifactObject(value: AgentBridgeArtifactRef): value is VizualArtifact {
  return typeof value === 'object' && value !== null && 'id' in value && 'spec' in value
}
