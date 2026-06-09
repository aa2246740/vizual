import * as React from 'react'
import {
  JSONUIProvider,
  Renderer,
  createStateStore,
  type ComponentRenderer,
  type StateModel,
} from '@json-render/react'
import type { ComputedFunction } from '@json-render/core'
import { registry, handlers as createVizualHandlers } from '../registry'
import type { VizualArtifact, VizualSpec } from './artifact'
import { collectVizualRenderEvidence, type VizualRenderReceipt } from './render-evidence'
import { assertNoCyclicChildren, withDefaultElementProps } from './spec-validation'

export type VizualStateChange = { path: string; value: unknown }

export type VizualRendererProps = {
  spec: VizualSpec
  initialState?: Record<string, unknown>
  handlers?: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown>
  functions?: Record<string, ComputedFunction>
  onStateChange?: (changes: VizualStateChange[]) => void
  onRenderReceipt?: (receipt: VizualRenderReceipt) => void
  renderEvidenceDelayMs?: number
  fallback?: ComponentRenderer
}

export type VizualArtifactViewProps = Omit<VizualRendererProps, 'spec'> & {
  artifact: VizualArtifact
}

function splitStatePath(path: string) {
  return path.replace(/^\/+/, '').split('/').filter(Boolean)
}

function readAtStatePath(value: unknown, path: string) {
  let cursor = value as any
  for (const part of splitStatePath(path)) {
    if (cursor == null || typeof cursor !== 'object') return undefined
    cursor = cursor[part]
  }
  return cursor
}

export function applyVizualStateChanges<T extends Record<string, unknown>>(
  previous: T,
  changes: VizualStateChange[],
): T {
  const next = structuredClone(previous) as Record<string, unknown>
  for (const change of changes) {
    const parts = splitStatePath(change.path)
    if (!parts.length) continue
    let cursor: any = next
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index]
      if (cursor[part] == null || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
        cursor[part] = {}
      }
      cursor = cursor[part]
    }
    cursor[parts[parts.length - 1]] = change.value
  }
  return next as T
}

export function getVizualStateValue<T>(
  changes: VizualStateChange[],
  path: string,
  fallback: T,
): T {
  for (const change of changes) {
    if (change.path === path) return change.value as T
  }
  const patched = applyVizualStateChanges({}, changes)
  const value = readAtStatePath(patched, path)
  return value === undefined ? fallback : value as T
}

function createObservableStateStore(
  initialState: StateModel,
  onStateChange?: VizualRendererProps['onStateChange'],
) {
  const store = createStateStore(initialState)
  if (!onStateChange) return store

  return {
    ...store,
    set(path: string, value: unknown) {
      const before = store.get(path)
      store.set(path, value)
      const after = store.get(path)
      if (before !== after) onStateChange([{ path, value: after }])
    },
    update(updates: Record<string, unknown>) {
      const before = Object.fromEntries(
        Object.keys(updates).map(path => [path, store.get(path)]),
      )
      store.update(updates)
      const changes = Object.entries(updates)
        .map(([path]) => ({ path, value: store.get(path) }))
        .filter(change => before[change.path] !== change.value)
      if (changes.length) onStateChange(changes)
    },
  }
}

function createStoreBackedSetState(store: ReturnType<typeof createStateStore>) {
  return (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
    const prev = store.getSnapshot() as Record<string, unknown>
    const next = updater(prev)
    const updates: Record<string, unknown> = {}
    for (const key of new Set([...Object.keys(prev), ...Object.keys(next)])) {
      updates[`/${key}`] = next[key]
    }
    store.update(updates)
  }
}

export function VizualRenderer({
  spec,
  initialState,
  handlers,
  functions,
  onStateChange,
  onRenderReceipt,
  renderEvidenceDelayMs = 450,
  fallback,
}: VizualRendererProps) {
  assertNoCyclicChildren(spec)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const [receipt, setReceipt] = React.useState<VizualRenderReceipt | null>(null)
  const rendererSpec = React.useMemo(() => withDefaultElementProps(spec), [spec])

  const mergedInitialState = React.useMemo(
    () => ({
      ...((rendererSpec.state as StateModel | undefined) ?? {}),
      ...(initialState ?? {}),
    }),
    [initialState, rendererSpec],
  )

  const store = React.useMemo(
    () => createObservableStateStore(mergedInitialState, onStateChange),
    [mergedInitialState, onStateChange],
  )

  const actionHandlers = React.useMemo(() => {
    const setState = createStoreBackedSetState(store)
    return {
      ...createVizualHandlers(() => setState, () => store.getSnapshot()),
      ...(handlers ?? {}),
    }
  }, [handlers, store])

  const auditRender = React.useCallback(() => {
    const next = collectVizualRenderEvidence(rootRef.current, rendererSpec)
    setReceipt(next)
    onRenderReceipt?.(next)
    return next
  }, [onRenderReceipt, rendererSpec])

  React.useEffect(() => {
    let cancelled = false
    const timers = new Set<number>()
    const frames = new Set<number>()
    const maxAttempts = 4
    const scheduleAudit = (delay: number, attempt = 0) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer)
        if (cancelled) return
        const frame = requestAnimationFrame(() => {
          frames.delete(frame)
          if (cancelled) return
          const next = auditRender()
          const expectedCharts = next.evidence.metrics.expectedEChartsCount
          if (!next.painted && expectedCharts > 0 && attempt < maxAttempts - 1) {
            scheduleAudit(Math.max(renderEvidenceDelayMs, 250), attempt + 1)
          }
        })
        frames.add(frame)
      }, delay)
      timers.add(timer)
    }
    const run = () => scheduleAudit(50)
    scheduleAudit(renderEvidenceDelayMs)
    const root = rootRef.current
    root?.addEventListener('vizual-chart-finished', run)
    root?.addEventListener('vizual-render-request-audit', run)
    return () => {
      cancelled = true
      timers.forEach(timer => window.clearTimeout(timer))
      frames.forEach(frame => cancelAnimationFrame(frame))
      root?.removeEventListener('vizual-chart-finished', run)
      root?.removeEventListener('vizual-render-request-audit', run)
    }
  }, [auditRender, renderEvidenceDelayMs])

  return (
    <div
      ref={rootRef}
      data-vizual-render-root="true"
      data-vizual-render-status={receipt?.status ?? 'mounted'}
      data-vizual-render-painted={receipt?.painted ? 'true' : 'false'}
      data-vizual-render-chart-painted={receipt?.chartPainted === undefined ? undefined : receipt.chartPainted ? 'true' : 'false'}
      style={{ width: '100%', minWidth: 0 }}
    >
      <JSONUIProvider
        registry={registry}
        store={store}
        handlers={actionHandlers}
        functions={functions}
        onStateChange={onStateChange}
      >
        <Renderer spec={rendererSpec as any} registry={registry} fallback={fallback} />
      </JSONUIProvider>
    </div>
  )
}

export function VizualArtifactView({
  artifact,
  initialState,
  ...props
}: VizualArtifactViewProps) {
  return (
    <VizualRenderer
      {...props}
      spec={artifact.spec}
      initialState={{
        ...(artifact.state ?? {}),
        ...(initialState ?? {}),
      }}
    />
  )
}
