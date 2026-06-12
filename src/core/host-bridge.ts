import { buildVizualActionMessage } from '../chat-adapter'
import type { VizualSpec } from './artifact'

/**
 * A normalized interaction event emitted by a rendered Vizual surface. Every
 * interactive action (form submit, filter, drill-down, location select, plan
 * update, or a custom action) surfaces here through `VizualRenderer`/`renderSpec`
 * `onAction`, so a host has ONE capture point instead of overriding five
 * individual action handlers.
 */
export type VizualAction = {
  type: string
  surfaceId?: string
  toolCallId?: string
  params: Record<string, unknown>
  /** Full live surface state at the moment of the action (if the renderer can read it). */
  state?: Record<string, unknown>
  timestamp?: string
}

/**
 * Actions that, by default, must be sent back to the agent to continue the
 * conversation (the "agent-roundtrip" tier). Pure value edits (slider, text,
 * choice, checkbox, tab switch) bind to local state and re-render in the
 * playground without involving the agent, so they are NOT in this list.
 */
export const VIZUAL_ROUNDTRIP_ACTIONS = [
  'submitForm',
  'applyFilter',
  'drillDown',
  'selectLocation',
  'updatePlan',
] as const

export type VizualHostBridgeOptions = {
  /** Send the built message to the agent and start a new run. The host wires this to its platform (DeerFlow thread.submit, ChatGPT sendMessage, etc.). */
  sendToAgent: (message: string, action: VizualAction) => void | Promise<void>
  surfaceId?: string
  toolCallId?: string
  /** Action types that should round-trip to the agent. Defaults to VIZUAL_ROUNDTRIP_ACTIONS plus any custom action seen. */
  roundtripActions?: string[]
  /** Action types that must stay local (never sent to the agent), even if they would otherwise round-trip. */
  localActions?: string[]
  /** Include the live surface state in the message payload. Default true. */
  includeState?: boolean
  /** Observe every action (local and roundtrip) for analytics/telemetry. */
  onAnyAction?: (action: VizualAction) => void
}

export type VizualHostBridge = {
  /** Pass to VizualRenderer/renderSpec `onAction`. */
  onAction: (action: VizualAction) => void
  /** Whether a given action type round-trips to the agent under this bridge. */
  isRoundtrip: (type: string) => boolean
}

/**
 * The framework-agnostic host bridge. It is the official "complete integration"
 * seam: the host implements only `sendToAgent`, and the bridge turns every
 * roundtrip interaction into a normalized agent message via
 * `buildVizualActionMessage`. Local-only interactions are ignored here and stay
 * in the playground.
 *
 * Example (any chatbot):
 *   const bridge = createVizualHostBridge({
 *     surfaceId, toolCallId,
 *     sendToAgent: (msg) => host.submitUserTurn(msg), // DeerFlow / ChatGPT / custom
 *   })
 *   <VizualRenderer spec={spec} surfaceId={surfaceId} onAction={bridge.onAction} />
 */
export function createVizualHostBridge(options: VizualHostBridgeOptions): VizualHostBridge {
  const roundtrip = new Set(options.roundtripActions ?? VIZUAL_ROUNDTRIP_ACTIONS)
  const local = new Set(options.localActions ?? [])
  const includeState = options.includeState !== false

  const isRoundtrip = (type: string): boolean => {
    if (local.has(type)) return false
    // Known roundtrip actions always go back; unknown custom actions default to
    // roundtrip too (a custom action the agent declared is almost always meant
    // to continue the conversation), unless explicitly marked local.
    return roundtrip.has(type) || !isPureValueEdit(type)
  }

  const onAction = (action: VizualAction): void => {
    options.onAnyAction?.(action)
    if (!isRoundtrip(action.type)) return
    const message = buildVizualActionMessage({
      presentation: { surfaceId: action.surfaceId ?? options.surfaceId, toolCallId: action.toolCallId ?? options.toolCallId },
      action: action.type,
      params: action.params,
      currentState: includeState ? action.state : undefined,
    })
    void options.sendToAgent(message, action)
  }

  return { onAction, isRoundtrip }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionHandler = (...args: any[]) => any

/**
 * Wrap a registry's action handlers so every action also invokes `onAction`
 * with a normalized {@link VizualAction}. The original local-state handler still
 * runs first (so in-playground behavior is preserved); `onAction` then gives the
 * host one place to observe/forward the interaction.
 */
export function wrapActionHandlersWithOnAction(
  handlers: Record<string, ActionHandler>,
  options: {
    onAction: (action: VizualAction) => void
    surfaceId?: string
    toolCallId?: string
    getState?: () => Record<string, unknown>
    now?: () => string
  },
): Record<string, ActionHandler> {
  const wrapped: Record<string, ActionHandler> = {}
  for (const [type, handler] of Object.entries(handlers)) {
    wrapped[type] = async (params?: Record<string, unknown>, setState?: unknown, state?: Record<string, unknown>) => {
      const result = await handler?.(params, setState, state)
      try {
        options.onAction({
          type,
          surfaceId: options.surfaceId,
          toolCallId: options.toolCallId,
          params: (params as Record<string, unknown>) ?? {},
          state: options.getState ? options.getState() : (state as Record<string, unknown> | undefined),
          timestamp: options.now ? options.now() : new Date().toISOString(),
        })
      } catch {
        // never let an onAction observer break the in-surface interaction
      }
      return result
    }
  }
  return wrapped
}

const PURE_VALUE_EDIT_ACTIONS = new Set([
  'setValue',
  'setState',
  'setData',
  'updateValue',
  'changeValue',
  'switchTab',
  'selectTab',
])

function isPureValueEdit(type: string): boolean {
  return PURE_VALUE_EDIT_ACTIONS.has(type)
}

const INTERACTIVE_COMPONENT_TYPES = new Set([
  'FormBuilder', 'Button', 'CheckBox', 'TextField', 'ChoicePicker', 'Slider',
  'DateTimeInput', 'Tabs',
])

export type VizualInteractivitySummary = {
  /** The surface contains at least one interactive control. */
  interactive: boolean
  /** The surface has at least one action wired back to the agent (roundtrip tier). */
  agentRoundtrip: boolean
  /** Interactive controls that have no wired action and no value binding — they collect input that goes nowhere. */
  deadControls: Array<{ elementId: string; type: string }>
  /** Distinct action names wired across the surface. */
  actions: string[]
}

/**
 * Inspect a (already-normalized) spec and report which tiers of the integration
 * contract it satisfies: Renderable (validated elsewhere), Interactive, and
 * Agent-roundtrip. Hosts and acceptance tests use this to verify that an
 * interactive surface is actually wired, not just visible.
 */
export function summarizeVizualInteractivity(spec: VizualSpec | null | undefined): VizualInteractivitySummary {
  const elements = spec?.elements ?? {}
  const actions = new Set<string>()
  const deadControls: Array<{ elementId: string; type: string }> = []
  let interactive = false

  for (const [elementId, element] of Object.entries(elements)) {
    const type = typeof element?.type === 'string' ? element.type : ''
    const on = element?.on && typeof element.on === 'object' ? element.on as Record<string, unknown> : {}
    for (const binding of Object.values(on)) {
      const list = Array.isArray(binding) ? binding : [binding]
      for (const b of list) {
        const name = b && typeof b === 'object' ? (b as { action?: unknown }).action : undefined
        if (typeof name === 'string') actions.add(name)
      }
    }
    if (!INTERACTIVE_COMPONENT_TYPES.has(type)) continue
    interactive = true
    const props = (element?.props && typeof element.props === 'object' ? element.props : {}) as Record<string, unknown>
    const hasAction = Object.keys(on).length > 0
    const hasBinding = isBindStateValue(props.value) || isBindStateValue(props.checked)
    if (!hasAction && !hasBinding) deadControls.push({ elementId, type })
  }

  return {
    interactive,
    agentRoundtrip: Array.from(actions).some(name => !isPureValueEdit(name)),
    deadControls,
    actions: Array.from(actions),
  }
}

function isBindStateValue(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && typeof (value as { $bindState?: unknown }).$bindState === 'string')
}
