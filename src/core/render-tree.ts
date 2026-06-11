import type { VizualSpec } from './artifact'
import { withDefaultElementProps } from './spec-validation'

/**
 * A framework-agnostic, fully-resolved render node.
 *
 * Vizual's internal spec is an id-keyed graph (`{ root, elements }`) with data
 * bindings (`"{{rows}}"`) and component aliases. React hosts render it through
 * the bundled `@json-render` renderer, but a Vue / Svelte / vanilla-JS / React
 * Native host has no way to walk that graph. `toVizualRenderTree` flattens the
 * graph into a plain nested tree where:
 *
 *   - `type` is the canonical catalog component name (e.g. `"BarChart"`),
 *   - `props` are fully resolved (data templates applied, aliases normalized),
 *   - `children` is a nested array of the same node shape.
 *
 * Any frontend can then map `type -> its own component` with a small registry
 * and recurse on `children`. This is the seam that lets the same agent output
 * render on web today and on a native mobile renderer later, with no DOM, React,
 * or ECharts dependency in this function.
 */
export type VizualRenderNode = {
  id: string
  type: string
  props: Record<string, unknown>
  children: VizualRenderNode[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function childIds(element: { children?: unknown }): string[] {
  const children = element?.children
  if (Array.isArray(children)) {
    return children.filter((id): id is string => typeof id === 'string')
  }
  // { componentId, path } binding form carries no static child ids.
  return []
}

/**
 * Convert a Vizual spec (or a snapshot's spec) into a resolved render tree.
 * Returns `null` when there is nothing renderable. Cycles and dangling child
 * ids are skipped defensively; the validator is the place that reports them.
 */
export function toVizualRenderTree(spec: VizualSpec | null | undefined): VizualRenderNode | null {
  if (!spec) return null
  const resolved = withDefaultElementProps(spec)
  const elements = resolved.elements
  const root = resolved.root
  if (!elements || !root || !elements[root]) return null

  const build = (id: string, seen: Set<string>): VizualRenderNode | null => {
    if (seen.has(id)) return null
    const element = elements[id]
    if (!element) return null
    const type = typeof element.type === 'string' ? element.type : ''
    if (!type) return null
    const nextSeen = new Set(seen).add(id)
    const props = isRecord(element.props) ? element.props : {}
    const children = childIds(element)
      .map(childId => build(childId, nextSeen))
      .filter((node): node is VizualRenderNode => node !== null)
    return { id, type, props, children }
  }

  return build(root, new Set())
}

/**
 * Depth-first flat list of render nodes (root first). Convenient for hosts that
 * prefer to iterate rather than recurse, or to collect the set of component
 * types a surface needs so a renderer can verify it supports them all.
 */
export function flattenVizualRenderTree(node: VizualRenderNode | null): VizualRenderNode[] {
  if (!node) return []
  const out: VizualRenderNode[] = [node]
  for (const child of node.children) out.push(...flattenVizualRenderTree(child))
  return out
}
