import type { ParsedSchema } from '../../core/types'

export type FeaturePriority = 'high' | 'medium' | 'low'
export type FeatureStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled'

export interface Feature {
  id: string
  name: string
  priority: FeaturePriority
  status: FeatureStatus
  description: string
  assignee: string
}

export interface FeatureTableParsed extends ParsedSchema {
  features: Feature[]
}

const VALID_PRIORITIES: FeaturePriority[] = ['high', 'medium', 'low']
const VALID_STATUSES: FeatureStatus[] = ['planned', 'in-progress', 'completed', 'cancelled']

export function parseFeatureTableSchema(input: unknown): FeatureTableParsed {
  if (!input || typeof input !== 'object') {
    return { valid: false, features: [], fallback: true, originalInput: input }
  }

  const obj = input as Record<string, unknown>

  if (!Array.isArray(obj.features) || obj.features.length === 0) {
    return { valid: false, features: [], fallback: true, originalInput: input }
  }

  const features: Feature[] = obj.features
    .filter((f: unknown) => f && typeof f === 'object')
    .map((f: Record<string, unknown>) => ({
      id: typeof f.id === 'string' ? f.id : '',
      name: typeof f.name === 'string' ? f.name : '',
      priority: VALID_PRIORITIES.includes(f.priority as FeaturePriority) ? (f.priority as FeaturePriority) : 'medium',
      status: VALID_STATUSES.includes(f.status as FeatureStatus) ? (f.status as FeatureStatus) : 'planned',
      description: typeof f.description === 'string' ? f.description : '',
      // 支持 owner（别名） 和 assignee 两种字段名
      assignee: (typeof f.assignee === 'string' ? f.assignee : '') || (typeof f.owner === 'string' ? f.owner : ''),
    }))
    .filter(f => f.name)  // id is optional, name is required

  if (features.length === 0) {
    return { valid: false, features: [], fallback: true, originalInput: input }
  }

  return { valid: true, features }
}
