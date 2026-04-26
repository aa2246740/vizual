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

export type VizualStateChange = { path: string; value: unknown }

export type VizualRendererProps = {
  spec: VizualSpec
  initialState?: Record<string, unknown>
  handlers?: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown>
  functions?: Record<string, ComputedFunction>
  onStateChange?: (changes: VizualStateChange[]) => void
  fallback?: ComponentRenderer
}

export type VizualArtifactViewProps = Omit<VizualRendererProps, 'spec'> & {
  artifact: VizualArtifact
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
  fallback,
}: VizualRendererProps) {
  const mergedInitialState = React.useMemo(
    () => ({
      ...((spec.state as StateModel | undefined) ?? {}),
      ...(initialState ?? {}),
    }),
    [initialState, spec],
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

  return (
    <JSONUIProvider
      registry={registry}
      store={store}
      handlers={actionHandlers}
      functions={functions}
      onStateChange={onStateChange}
    >
      <Renderer spec={spec as any} registry={registry} fallback={fallback} />
    </JSONUIProvider>
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
