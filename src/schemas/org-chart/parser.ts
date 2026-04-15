import type { ParsedSchema } from '../../core/types'

export interface OrgPerson {
  id: string
  name: string
  title: string
  department: string
  children: OrgPerson[]
}

export interface OrgChartParsed extends ParsedSchema {
  root: OrgPerson
}

function isValidPerson(p: unknown): p is Record<string, unknown> {
  return !!p && typeof p === 'object' && typeof (p as Record<string, unknown>).name === 'string'
}

function parsePerson(p: unknown): OrgPerson | null {
  if (!isValidPerson(p)) return null

  const obj = p as Record<string, unknown>
  const children: OrgPerson[] = Array.isArray(obj.children)
    ? obj.children.map((c: unknown) => parsePerson(c)).filter((c: OrgPerson | null): c is OrgPerson => c !== null)
    : []

  return {
    id: typeof obj.id === 'string' ? obj.id : '',
    name: obj.name as string,
    title: typeof obj.title === 'string' ? obj.title : '',
    department: typeof obj.department === 'string' ? obj.department : '',
    children,
  }
}

/**
 * 支持两种数据结构：
 * 1. 嵌套结构：{ root: { name, title, department, children: [...] } }
 * 2. 平铺结构：{ root: {...}, people: [...] } 其中每个人有 reports: [id, ...]
 */
function buildTreeFromFlat(root: Record<string, unknown>, people: Record<string, unknown>[]): OrgPerson | null {
  if (!root || !root.name) return null

  const nodeMap = new Map<string, OrgPerson>()
  // First pass: create all nodes
  for (const p of people) {
    if (!isValidPerson(p)) continue
    const obj = p as Record<string, unknown>
    nodeMap.set(obj.id as string, {
      id: obj.id as string,
      name: obj.name as string,
      title: typeof obj.title === 'string' ? obj.title : '',
      department: typeof obj.department === 'string' ? obj.department : '',
      children: [],
    })
  }

  // Second pass: link children via reports
  for (const p of people) {
    if (!isValidPerson(p)) continue
    const obj = p as Record<string, unknown>
    const reports = obj.reports
    const node = nodeMap.get(obj.id as string)
    if (!node) continue
    if (Array.isArray(reports)) {
      node.children = (reports as string[])
        .map((rid: string) => nodeMap.get(rid))
        .filter((c): c is OrgPerson => c !== undefined)
    }
  }

  // Find root node (the one whose id matches root.id or is not referenced as child)
  const rootId = root.id as string
  if (rootId && nodeMap.has(rootId)) {
    return nodeMap.get(rootId)!
  }

  // Fallback: return first node with no parent
  const childIds = new Set<string>()
  for (const p of people) {
    const obj = p as Record<string, unknown>
    const reports = obj.reports
    if (Array.isArray(reports)) {
      for (const rid of reports) childIds.add(rid)
    }
  }
  for (const [id, node] of nodeMap) {
    if (!childIds.has(id)) return node
  }

  return nodeMap.values().next().value ?? null
}

export function parseOrgChartSchema(input: unknown): OrgChartParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, root: { id: '', name: '', title: '', department: '', children: [] }, fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  // Nested children structure
  if (typeof obj.root === 'object' && obj.root !== null) {
    const nestedRoot = parsePerson(obj.root)
    if (nestedRoot) {
      return { valid: true, root: nestedRoot }
    }
  }

  // Flat structure with reports
  if (Array.isArray(obj.people) && obj.people.length > 0) {
    const people = obj.people as unknown[]
    const root = buildTreeFromFlat(obj.root as Record<string, unknown>, people as Record<string, unknown>[])
    if (root) {
      return { valid: true, root }
    }
  }

  return { valid: false, root: { id: '', name: '', title: '', department: '', children: [] }, fallback: true, originalInput: input }
}
