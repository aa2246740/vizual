/**
 * Standalone spec validator — inlines all Zod schemas, no project imports.
 *
 * Usage: npx tsx vizual-skill-workspace/validate-standalone.ts
 *
 * Validates all 12 specs (6 with-skill + 6 without-skill) in iteration-1.
 */
import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'

const ROOT = path.resolve(__dirname, '..')
const ITER = path.resolve(__dirname, 'iteration-1')

// ─── Inlined schemas (copied from source schema.ts files) ────────

const BarChartSchema = z.object({
  type: z.literal('bar'),
  title: z.string().optional(),
  x: z.string(),
  y: z.union([z.string(), z.array(z.string())]),
  data: z.array(z.record(z.unknown())),
  stacked: z.boolean().optional(),
  horizontal: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

const ComboChartSchema = z.object({
  type: z.literal('combo'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]),
  data: z.array(z.record(z.unknown())),
  series: z.array(z.object({ type: z.enum(["bar","line"]), y: z.string() })).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

const FunnelChartSchema = z.object({
  type: z.literal('funnel'),
  title: z.string().optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  data: z.array(z.record(z.unknown())),
  value: z.string().optional(), label: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

const RadarChartSchema = z.object({
  type: z.literal('radar'),
  title: z.string().optional(),
  indicators: z.array(z.object({
    name: z.string(),
    max: z.number().optional(),
  })).optional(),
  series: z.array(z.object({
    name: z.string().optional(),
    values: z.array(z.number()),
  })).optional(),
  data: z.array(z.record(z.unknown())).optional(),
  x: z.string().optional(),
  y: z.union([z.string(), z.array(z.string())]).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  height: z.number().optional(),
})

const DataTableSchema = z.object({
  type: z.literal('table'),
  title: z.string().optional(),
  columns: z.array(z.object({ key: z.string(), label: z.string().optional(), align: z.enum(['left','center','right']).optional() })).optional(),
  data: z.array(z.record(z.unknown())),
  striped: z.boolean().optional(),
  compact: z.boolean().optional(),
})

const KpiDashboardSchema = z.object({
  type: z.literal('kpi_dashboard'),
  title: z.string().optional(),
  metrics: z.array(z.object({
    label: z.string(), value: z.union([z.string(), z.number()]),
    prefix: z.string().optional(), suffix: z.string().optional(),
    trend: z.enum(['up','down','flat']).optional(), trendValue: z.string().optional(),
    color: z.string().optional(),
  })),
  columns: z.number().optional(),
})

const KanbanSchema = z.object({
  type: z.literal('kanban'),
  title: z.string().optional(),
  columns: z.array(z.object({
    id: z.string(), title: z.string(), color: z.string().optional(),
    cards: z.array(z.object({
      id: z.string(), title: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      assignee: z.string().optional(),
      priority: z.enum(['low','medium','high']).optional(),
    })),
  })),
})

const FormBuilderSchema = z.object({
  type: z.literal('form_builder'),
  title: z.string().optional(),
  columns: z.number().optional(),
  submitLabel: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    label: z.string().optional(),
    type: z.enum([
      'text', 'email', 'password', 'number', 'url', 'tel',
      'select', 'file', 'textarea',
      'radio', 'checkbox', 'switch', 'slider', 'color', 'date', 'datetime', 'time', 'rating',
    ]),
    placeholder: z.string().optional(),
    required: z.boolean().optional(),
    disabled: z.boolean().optional(),
    description: z.string().optional(),
    options: z.array(z.union([
      z.string(),
      z.object({ label: z.string(), value: z.union([z.string(), z.number()]) }),
    ])).optional(),
    accept: z.string().optional(),
    multiple: z.boolean().optional(),
    defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    dependsOn: z.string().optional(),
    showWhen: z.union([z.string(), z.number()]).optional(),
    validation: z.array(z.object({
      rule: z.enum(['required', 'email', 'minLength', 'maxLength', 'pattern', 'min', 'max', 'url']),
      value: z.union([z.string(), z.number()]).optional(),
      message: z.string().optional(),
    })).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
  })),
})

const GridLayoutSchema = z.object({
  columns: z.number().min(1).max(12).optional().default(2),
  gap: z.number().optional().default(12),
  columnWidths: z.array(z.string()).optional(),
})

const InteractivePlaygroundSchema = z.object({
  type: z.literal('interactive_playground'),
  title: z.string().optional(),
  component: z.record(z.unknown()),
  controls: z.array(z.object({
    type: z.enum(['slider', 'select', 'toggle', 'color', 'text', 'number', 'buttonGroup']),
    name: z.string(),
    label: z.string().optional(),
    defaultValue: z.unknown().optional(),
    targetProp: z.string().optional(),
    options: z.array(z.unknown()).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
  })).optional(),
  layout: z.enum(['side-by-side', 'stacked', 'compact']).optional(),
})

// ─── Schema lookup ─────────────────────────────────────────

const elementSchemaMap: Record<string, z.ZodTypeAny> = {
  BarChart: BarChartSchema,
  LineChart: BarChartSchema._def.schema ? BarChartSchema : BarChartSchema, // reuse bar schema shape for line
  ComboChart: ComboChartSchema,
  FunnelChart: FunnelChartSchema,
  RadarChart: RadarChartSchema,
  DataTable: DataTableSchema,
  KpiDashboard: KpiDashboardSchema,
  Kanban: KanbanSchema,
  KanbanBoard: KanbanSchema,
  FormBuilder: FormBuilderSchema,
  GridLayout: GridLayoutSchema,
  InteractivePlayground: InteractivePlaygroundSchema,
}

// ─── Validation ────────────────────────────────────────────

interface ValidationResult {
  evalName: string
  mode: 'with_skill' | 'without_skill'
  elements: {
    id: string
    type: string
    passed: boolean
    error?: string
  }[]
  overallPass: boolean
  structuralPass: boolean // has root/elements/children
}

function validateSpec(specPath: string, evalName: string, mode: 'with_skill' | 'without_skill'): ValidationResult {
  const raw = fs.readFileSync(specPath, 'utf-8')
  let spec: any
  try {
    spec = JSON.parse(raw)
  } catch {
    return {
      evalName, mode,
      elements: [{ id: 'parse', type: 'JSON', passed: false, error: 'Invalid JSON' }],
      overallPass: false, structuralPass: false,
    }
  }

  // Structural checks
  const hasRoot = typeof spec.root === 'string'
  const hasElements = spec.elements && typeof spec.elements === 'object'
  const elements = (hasElements ? Object.entries(spec.elements) : []) as [string, any][]

  // Check children arrays
  let childrenOk = true
  for (const [id, el] of elements) {
    if (!Array.isArray(el.children)) {
      childrenOk = false
      break
    }
  }

  const structuralPass = hasRoot && hasElements && childrenOk

  // Schema validation per element
  const results: ValidationResult['elements'] = []

  for (const [id, el] of elements) {
    const elemType = el.type
    const props = el.props || {}
    const schemaType = props.type || elemType

    // Find schema
    const schema = elementSchemaMap[elemType]
    if (!schema) {
      results.push({ id, type: elemType, passed: false, error: `No schema for element type "${elemType}"` })
      continue
    }

    try {
      schema.parse(props)
      results.push({ id, type: elemType, passed: true })
    } catch (e: any) {
      const issues = e.issues || []
      const detail = issues.slice(0, 5).map((i: any) =>
        `${i.path.join('.')}: ${i.message}`
      ).join('; ')
      results.push({ id, type: elemType, passed: false, error: detail || e.message })
    }
  }

  const allPassed = results.every(r => r.passed) && structuralPass

  return { evalName, mode, elements: results, overallPass: allPassed, structuralPass }
}

// ─── Main ──────────────────────────────────────────────────

const evalDirs = [
  'eval-1-combo-chart',
  'eval-2-sales-dashboard',
  'eval-3-interactive-radar',
  'eval-4-sales-funnel',
  'eval-5-project-kanban',
  'eval-6-feedback-form',
]

const allResults: ValidationResult[] = []

for (const evalDir of evalDirs) {
  for (const mode of ['with_skill', 'without_skill'] as const) {
    const specPath = path.join(ITER, evalDir, mode, 'outputs', 'spec.json')
    if (!fs.existsSync(specPath)) {
      allResults.push({
        evalName: evalDir, mode,
        elements: [{ id: '-', type: '-', passed: false, error: 'spec.json not found' }],
        overallPass: false, structuralPass: false,
      })
      continue
    }
    const result = validateSpec(specPath, evalDir, mode)
    allResults.push(result)
  }
}

// ─── Output ────────────────────────────────────────────────

// Also write JSON results for generate_review.py
const outputPath = path.join(__dirname, 'validation-results.json')
fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2))

console.log('\n╔════════════════════════════════════════════════════════════════════════╗')
console.log('║  Vizual Skill Eval — Iteration 1 Validation Results                  ║')
console.log('╚════════════════════════════════════════════════════════════════════════╝\n')

// Summary table
console.log('Eval                          | with_skill | without_skill | Delta')
console.log('──────────────────────────────|────────────|───────────────|──────')

let wsPass = 0, woPass = 0

for (const evalDir of evalDirs) {
  const ws = allResults.find(r => r.evalName === evalDir && r.mode === 'with_skill')!
  const wo = allResults.find(r => r.evalName === evalDir && r.mode === 'without_skill')!

  const wsIcon = ws.overallPass ? '✅ PASS' : '❌ FAIL'
  const woIcon = wo.overallPass ? '✅ PASS' : '❌ FAIL'

  if (ws.overallPass) wsPass++
  if (wo.overallPass) woPass++

  const label = evalDir.replace('eval-', '').padEnd(29)
  console.log(`${label}| ${wsIcon}    | ${woIcon}      |`)
}

console.log('──────────────────────────────|────────────|───────────────|──────')
console.log(`${'TOTAL'.padEnd(29)}| ${wsPass}/6        | ${woPass}/6           | skill +${wsPass - woPass}`)

// Detailed errors
const failures = allResults.filter(r => !r.overallPass)
if (failures.length > 0) {
  console.log('\n── Detailed Failures ──\n')
  for (const f of failures) {
    console.log(`[${f.mode}] ${f.evalName}:`)
    if (!f.structuralPass) {
      console.log('  ⚠️  Structural issue (missing root/elements/children)')
    }
    for (const e of f.elements) {
      if (!e.passed) {
        console.log(`  ❌ ${e.id} (${e.type}): ${e.error}`)
      }
    }
    console.log()
  }
}

console.log(`\nResults written to: ${outputPath}`)
process.exit(failures.length > 0 ? 1 : 0)
