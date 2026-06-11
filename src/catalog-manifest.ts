import { renderKitCatalog } from './catalog'

export const VIZUAL_CATALOG_MANIFEST_SCHEMA = 'vizual.catalog.manifest.v1'
export const VIZUAL_CATALOG_ID = 'vizual'
export const VIZUAL_CATALOG_VERSION = 'v1'

export type JsonSchemaObject = Record<string, unknown>

export type VizualCatalogInputLanguage = 'nativeOperation' | 'vizualSpec' | 'a2uiMessage' | 'aguiEvent' | 'agenuiSurface'

export type VizualCatalogComponentKind =
  | 'chart'
  | 'data'
  | 'document'
  | 'business'
  | 'input'
  | 'layout'
  | 'content'
  | 'media'
  | 'primitive'
  | 'escape-hatch'

export type VizualCatalogAgentRole = 'semantic-surface' | 'composition-primitive' | 'host-compatibility' | 'escape-hatch'

export type VizualCatalogComponentManifest = {
  component: string
  description: string
  kind: VizualCatalogComponentKind
  tags: string[]
  agentRole: VizualCatalogAgentRole
  compatibleInputs: VizualCatalogInputLanguage[]
  propsSchema: JsonSchemaObject
  children: { kind: 'ids' | 'none' }
  emits: Array<{ event: string; description: string }>
  status?: 'stable' | 'compatibility' | 'deprecated'
  agentFacing?: boolean
  agentGuidance?: string
}

export type VizualCatalogActionManifest = {
  call: string
  description: string
  kind: 'host-action' | 'review-action' | 'compatibility-event'
  emittedBy: string[]
  compatibleInputs: VizualCatalogInputLanguage[]
  argsSchema: JsonSchemaObject
  returnType?: string
  agentGuidance?: string
}

export type VizualCatalogCapabilityGuidance = {
  discovery: string
  composition?: string
  validation?: string
  nonGoals?: string[]
}

export type VizualCatalogCapabilityComponents = {
  primary: string[]
  supporting?: string[]
}

export type VizualCatalogCapabilityManifest = {
  id: string
  whenToUse: string
  boundary: 'capability-discovery'
  components: VizualCatalogCapabilityComponents
  functions?: string[]
  agentGuidance: VizualCatalogCapabilityGuidance
  /** @deprecated Use components.primary. Kept for older tool consumers. */
  requiredComponents: string[]
  /** @deprecated Use components.supporting. Kept for older tool consumers. */
  optionalComponents?: string[]
  /** @deprecated Use functions. Kept for older tool consumers. */
  actions?: string[]
  guidance: string
}

export type VizualAgentPromptExample = {
  id: string
  title: string
  whenToUse: string
  components: string[]
  actions: string[]
  input: unknown
}

export type VizualCatalogManifest = {
  schema: typeof VIZUAL_CATALOG_MANIFEST_SCHEMA
  catalogId: typeof VIZUAL_CATALOG_ID
  catalogVersion: typeof VIZUAL_CATALOG_VERSION
  protocol: {
    a2ui: string[]
    agui: string[]
    agenui: string[]
  }
  compatibility: {
    inputLanguages: Record<VizualCatalogInputLanguage, {
      role: 'input' | 'transport'
      normalizedInto: 'vizual-native-surface'
      acceptedShapes: string[]
      guidance: string
    }>
    nativeAliases: {
      component: string[]
      action: string[]
      dataBinding: string[]
    }
  }
  nativeCore: {
    surfaceModel: string
    toolName: string
    themeBoundary: 'host-owned'
    validationBoundary: 'contract-only'
  }
  components: Record<string, VizualCatalogComponentManifest>
  capabilities: VizualCatalogCapabilityManifest[]
  functions: Record<string, VizualCatalogActionManifest>
  examples?: VizualAgentPromptExample[]
}

type CatalogData = {
  components?: Record<string, {
    props?: unknown
    description?: string
  }>
  actions?: Record<string, {
    params?: unknown
    description?: string
  }>
}

const DEFAULT_HIDDEN_AGENT_COMPONENTS = new Set<string>()
const AGENT_PRIMITIVE_COMPONENTS = new Set([
  'Row',
  'Column',
  'Card',
  'Text',
  'Image',
  'Icon',
  'List',
  'Divider',
  'Button',
  'CheckBox',
  'TextField',
  'ChoicePicker',
  'Slider',
  'DateTimeInput',
  'Tabs',
])
const MEDIA_COMPONENTS = new Set(['Video', 'AudioPlayer'])
const BUSINESS_COMPONENTS = new Set(['Timeline', 'GanttChart', 'OrgChart', 'KpiDashboard'])
const INPUT_COMPONENTS = new Set(['FormBuilder', 'Button', 'CheckBox', 'TextField', 'ChoicePicker', 'Slider', 'DateTimeInput'])
const LAYOUT_COMPONENTS = new Set(['Container', 'Row', 'Column', 'Card', 'Tabs'])
const DOCUMENT_COMPONENTS = new Set(['Markdown'])
const DATA_COMPONENTS = new Set(['DataTable'])
const ESCAPE_HATCH_COMPONENTS = new Set<string>()

const ACTION_METADATA: Record<string, Pick<VizualCatalogActionManifest, 'kind' | 'emittedBy' | 'compatibleInputs' | 'agentGuidance'>> = {
  submitForm: {
    kind: 'host-action',
    emittedBy: ['FormBuilder', 'Button'],
    compatibleInputs: ['nativeOperation', 'vizualSpec', 'a2uiMessage', 'aguiEvent'],
    agentGuidance: 'Bind only when user input or approval should be sent back to the host Agent.',
  },
  applyFilter: {
    kind: 'host-action',
    emittedBy: ['DataTable', 'Button', 'ChoicePicker', 'Slider'],
    compatibleInputs: ['nativeOperation', 'vizualSpec', 'a2uiMessage', 'aguiEvent'],
    agentGuidance: 'Bind when filtering changes a visible surface or host-visible state.',
  },
  drillDown: {
    kind: 'host-action',
    emittedBy: ['BarChart', 'AreaChart', 'LineChart', 'PieChart', 'ScatterChart', 'BubbleChart', 'BoxplotChart', 'HistogramChart', 'WaterfallChart', 'XmrChart', 'SankeyChart', 'FunnelChart', 'HeatmapChart', 'CalendarChart', 'SparklineChart', 'ComboChart', 'DumbbellChart', 'RadarChart', 'DataTable'],
    compatibleInputs: ['nativeOperation', 'vizualSpec', 'a2uiMessage', 'aguiEvent'],
    agentGuidance: 'Bind when a selected point, row, or entity should trigger deeper analysis.',
  },
  selectLocation: {
    kind: 'host-action',
    emittedBy: ['DataTable', 'Button', 'ChoicePicker'],
    compatibleInputs: ['nativeOperation', 'vizualSpec', 'a2uiMessage', 'aguiEvent'],
    agentGuidance: 'Bind when a region, branch, store, or location-like entity is explicitly selectable.',
  },
  updatePlan: {
    kind: 'host-action',
    emittedBy: ['Timeline', 'FormBuilder', 'Button'],
    compatibleInputs: ['nativeOperation', 'vizualSpec', 'a2uiMessage', 'aguiEvent'],
    agentGuidance: 'Bind when interaction updates a host-visible action plan or status.',
  },
}

function componentAgentMetadata(component: string): Pick<VizualCatalogComponentManifest, 'status' | 'agentFacing' | 'agentGuidance'> {
  if (isDataChartComponent(component)) {
    return {
      agentGuidance: 'For charts, prefer props.data plus typed props.encoding and optional props.measures. Use encoding.x/y/value/label/color/source/target/low/high to name fields. Use measures for multiple numeric series or ComboChart layers. Do not use a string series prop as the recommended path; categorical grouping belongs in encoding.color, seriesBy, colorBy, or groupBy, and numeric series belong in measures or explicit series arrays.',
    }
  }
  return {}
}

function isChartComponent(component: string): boolean {
  return /Chart$/u.test(component) || component === 'MermaidDiagram'
}

function isDataChartComponent(component: string): boolean {
  return isChartComponent(component) && component !== 'MermaidDiagram'
}

function componentKind(component: string): VizualCatalogComponentKind {
  if (isChartComponent(component)) return 'chart'
  if (DATA_COMPONENTS.has(component)) return 'data'
  if (DOCUMENT_COMPONENTS.has(component)) return 'document'
  if (BUSINESS_COMPONENTS.has(component)) return 'business'
  if (ESCAPE_HATCH_COMPONENTS.has(component)) return 'escape-hatch'
  if (MEDIA_COMPONENTS.has(component)) return 'media'
  if (INPUT_COMPONENTS.has(component)) return 'input'
  if (LAYOUT_COMPONENTS.has(component)) return 'layout'
  if (AGENT_PRIMITIVE_COMPONENTS.has(component)) return 'primitive'
  return 'content'
}

function componentAgentRole(component: string): VizualCatalogAgentRole {
  if (DEFAULT_HIDDEN_AGENT_COMPONENTS.has(component)) return 'host-compatibility'
  if (ESCAPE_HATCH_COMPONENTS.has(component)) return 'escape-hatch'
  if (AGENT_PRIMITIVE_COMPONENTS.has(component) || component === 'Container') return 'composition-primitive'
  return 'semantic-surface'
}

function componentTags(component: string): string[] {
  const tags = new Set<string>([componentKind(component)])
  if (isChartComponent(component)) {
    tags.add('visualization')
    tags.add('data-bound')
  }
  if (INPUT_COMPONENTS.has(component)) tags.add('interactive')
  if (AGENT_PRIMITIVE_COMPONENTS.has(component)) tags.add('a2ui-compatible')
  if (MEDIA_COMPONENTS.has(component)) tags.add('a2ui-compatible')
  if (DEFAULT_HIDDEN_AGENT_COMPONENTS.has(component)) tags.add('compatibility-only')
  return Array.from(tags)
}

function componentCompatibleInputs(component: string): VizualCatalogInputLanguage[] {
  const inputs: VizualCatalogInputLanguage[] = ['nativeOperation', 'vizualSpec']
  if (AGENT_PRIMITIVE_COMPONENTS.has(component) || MEDIA_COMPONENTS.has(component) || component === 'Container' || component === 'FormBuilder') {
    inputs.push('a2uiMessage')
  }
  if (componentAgentRole(component) !== 'host-compatibility') {
    inputs.push('aguiEvent')
  }
  return inputs
}

function getCatalogData(): CatalogData {
  return ((renderKitCatalog as unknown as { data?: CatalogData }).data ?? {}) as CatalogData
}

function typeName(schema: unknown): string | undefined {
  return (schema as { _def?: { typeName?: string } } | undefined)?._def?.typeName
}

function schemaDef(schema: unknown): Record<string, unknown> {
  return ((schema as { _def?: Record<string, unknown> } | undefined)?._def ?? {}) as Record<string, unknown>
}

function objectShape(def: Record<string, unknown>): Record<string, unknown> {
  const rawShape = def.shape
  return typeof rawShape === 'function'
    ? rawShape()
    : (rawShape && typeof rawShape === 'object' && !Array.isArray(rawShape) ? rawShape as Record<string, unknown> : {})
}

function isOptionalProperty(schema: unknown): boolean {
  const name = typeName(schema)
  return name === 'ZodOptional' || name === 'ZodDefault'
}

function defaultValue(def: Record<string, unknown>) {
  const value = def.defaultValue
  if (typeof value === 'function') {
    try {
      return value()
    } catch {
      return undefined
    }
  }
  return value
}

function literalValue(def: Record<string, unknown>) {
  if ('value' in def) return def.value
  if ('values' in def) return def.values
  return undefined
}

function enumValues(def: Record<string, unknown>): unknown[] {
  const values = def.values ?? def.entries
  if (Array.isArray(values)) return values
  if (values && typeof values === 'object') return Object.values(values)
  return []
}

export function zodToJsonSchema(schema: unknown, seen: WeakSet<object> = new WeakSet()): JsonSchemaObject {
  if (schema && typeof schema === 'object') {
    if (seen.has(schema)) return {}
    seen.add(schema)
  }
  const name = typeName(schema)
  const def = schemaDef(schema)

  switch (name) {
    case 'ZodString':
      return { type: 'string' }
    case 'ZodNumber':
      return { type: 'number' }
    case 'ZodBoolean':
      return { type: 'boolean' }
    case 'ZodNull':
      return { type: 'null' }
    case 'ZodLiteral':
      {
        const value = literalValue(def)
        const valueType = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
        return valueType === 'undefined' ? { const: value } : { type: valueType, const: value }
      }
    case 'ZodEnum':
    case 'ZodNativeEnum':
      return { enum: enumValues(def) }
    case 'ZodArray':
      return { type: 'array', items: zodToJsonSchema(def.type, seen) }
    case 'ZodRecord':
      return {
        type: 'object',
        additionalProperties: zodToJsonSchema(def.valueType, seen),
      }
    case 'ZodUnion':
    case 'ZodDiscriminatedUnion': {
      const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options
      return { anyOf: Array.isArray(options) ? options.map(option => zodToJsonSchema(option, seen)) : [] }
    }
    case 'ZodOptional':
      return zodToJsonSchema(def.innerType, seen)
    case 'ZodNullable': {
      const inner = zodToJsonSchema(def.innerType, seen)
      if (typeof inner.type === 'string') return { ...inner, type: [inner.type, 'null'] }
      return { anyOf: [inner, { type: 'null' }] }
    }
    case 'ZodDefault': {
      const inner = zodToJsonSchema(def.innerType, seen)
      const fallback = defaultValue(def)
      return fallback === undefined ? inner : { ...inner, default: fallback }
    }
    case 'ZodEffects':
      return zodToJsonSchema(def.schema, seen)
    case 'ZodLazy':
      return {}
    case 'ZodObject': {
      const shape = objectShape(def)
      const properties = Object.fromEntries(
        Object.entries(shape).map(([key, child]) => [key, zodToJsonSchema(child, seen)]),
      )
      const required = Object.entries(shape)
        .filter(([, child]) => !isOptionalProperty(child))
        .map(([key]) => key)
      return {
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: def.unknownKeys === 'strict' ? false : true,
      }
    }
    case 'ZodTuple':
      return { type: 'array', prefixItems: Array.isArray(def.items) ? def.items.map(item => zodToJsonSchema(item, seen)) : [] }
    case 'ZodAny':
    case 'ZodUnknown':
    case undefined:
      return {}
    default:
      return {}
  }
}

function withChartIntentProps(schema: JsonSchemaObject): JsonSchemaObject {
  if (schema.type !== 'object') return schema
  const properties = (schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties))
    ? schema.properties as Record<string, unknown>
    : {}
  const required = Array.isArray(schema.required)
    ? schema.required.filter(item => typeof item !== 'string' || !['x', 'y', 'label', 'value', 'dateField', 'valueField', 'xField', 'yField'].includes(item))
    : schema.required

  return {
    ...schema,
    ...(required ? { required } : {}),
    properties: {
      ...properties,
      encoding: {
        type: 'object',
        additionalProperties: true,
        description: 'Preferred chart intent mapping. Use field references such as {x:{field:"month",type:"temporal"}, y:{field:"revenue",type:"quantitative"}, color:{field:"branch",type:"nominal"}}. Vizual compiles this into renderer props.',
        properties: {
          x: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          y: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }, { type: 'array', items: {} }] },
          value: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          label: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          color: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          size: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          date: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          source: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          target: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          low: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
          high: { anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }] },
        },
      },
      measures: {
        type: 'array',
        description: 'Preferred numeric measure list for multiple series or ComboChart layers. Each item should include field plus optional label, mark bar/line/scatter, axis left/right, and size.',
        items: {
          type: 'object',
          additionalProperties: true,
          required: ['field'],
          properties: {
            field: { type: 'string' },
            label: { type: 'string' },
            name: { type: 'string' },
            mark: { enum: ['bar', 'line', 'scatter'] },
            axis: { enum: ['left', 'right', 'primary', 'secondary'] },
            yAxisIndex: { type: 'number' },
            size: { type: 'string' },
          },
        },
      },
      seriesBy: {
        anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }],
        description: 'Categorical grouping field for long-form chart data. Prefer encoding.color; do not use string series for this in new Agent outputs.',
      },
      colorBy: {
        anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }],
        description: 'Alias for categorical grouping field in long-form chart data.',
      },
      groupBy: {
        anyOf: [{ type: 'string' }, { type: 'object', additionalProperties: true }],
        description: 'Alias for categorical grouping field in long-form chart data.',
      },
    },
  }
}

function inferChildrenKind(component: string): { kind: 'ids' | 'none' } {
  return /^(Container|Row|Column|Card|Tabs)$/u.test(component)
    ? { kind: 'ids' }
    : { kind: 'none' }
}

function inferEmits(component: string): Array<{ event: string; description: string }> {
  if (component === 'FormBuilder') {
    return [{ event: 'submit', description: 'Submits bound form data through submitForm.' }]
  }
  if (component === 'Button') {
    return [
      { event: 'press', description: 'Button was pressed.' },
      { event: '<props.action>', description: 'Optional named action for host or Agent callbacks.' },
    ]
  }
  if (isChartComponent(component)) {
    return [{ event: 'drillDown', description: 'Optional chart data point click action when bound by the host spec.' }]
  }
  return []
}

function createVizualCompatibilityMapping(): VizualCatalogManifest['compatibility'] {
  return {
    inputLanguages: {
      nativeOperation: {
        role: 'input',
        normalizedInto: 'vizual-native-surface',
        acceptedShapes: ['createSurface', 'updateDataModel', 'updateComponents', 'appendDataModel', 'patchSurface', 'deleteSurface'],
        guidance: 'Native operations are the canonical structured UI output path for Agent-authored Vizual surfaces.',
      },
      vizualSpec: {
        role: 'input',
        normalizedInto: 'vizual-native-surface',
        acceptedShapes: ['{ root, elements, state? } flat spec', 'element.type/component/componentType aliases'],
        guidance: 'Vizual flat specs are accepted as compatibility input and normalized to the same native component catalog.',
      },
      a2uiMessage: {
        role: 'transport',
        normalizedInto: 'vizual-native-surface',
        acceptedShapes: ['v0.9 message array', 'v0.10 createSurface/updateDataModel/updateComponents messages'],
        guidance: 'A2UI is a transport language for surface lifecycle and primitive controls; it does not own a separate component truth.',
      },
      aguiEvent: {
        role: 'transport',
        normalizedInto: 'vizual-native-surface',
        acceptedShapes: ['message events', 'tool/function call events', 'state/activity/run/step/reasoning events', 'custom/raw Vizual payload events'],
        guidance: 'AG-UI events carry Agent or tool state that may include Vizual payloads; normalized output still uses the native catalog.',
      },
      agenuiSurface: {
        role: 'transport',
        normalizedInto: 'vizual-native-surface',
        acceptedShapes: ['catalog component references', 'custom component references', 'interactive surface descriptors'],
        guidance: 'AgenUI-style surface descriptors are compatibility input and should resolve to native components or explicit catalog gaps.',
      },
    },
    nativeAliases: {
      component: ['component', 'type', 'componentType'],
      action: ['action', 'onClick', 'onPress', 'onSubmit', 'onChange', 'submitAction'],
      dataBinding: ['data', 'dataPath', 'dataKey', '$bindState', 'value'],
    },
  }
}

export function createVizualActionDefinitions(): Record<string, VizualCatalogActionManifest> {
  const actions = getCatalogData().actions ?? {}
  return Object.fromEntries(
    Object.entries(actions).map(([name, action]) => [
      name,
      {
        call: name,
        description: action.description ?? '',
        kind: ACTION_METADATA[name]?.kind ?? 'host-action',
        emittedBy: ACTION_METADATA[name]?.emittedBy ?? [],
        compatibleInputs: ACTION_METADATA[name]?.compatibleInputs ?? ['nativeOperation', 'vizualSpec', 'a2uiMessage', 'aguiEvent'],
        argsSchema: zodToJsonSchema(action.params),
        returnType: 'host-defined',
        ...(ACTION_METADATA[name]?.agentGuidance ? { agentGuidance: ACTION_METADATA[name]?.agentGuidance } : {}),
      },
    ]),
  )
}

function defineCapability(input: {
  id: string
  whenToUse: string
  components: VizualCatalogCapabilityComponents
  functions?: string[]
  agentGuidance: VizualCatalogCapabilityGuidance
}): VizualCatalogCapabilityManifest {
  const guidance = [
    input.agentGuidance.discovery,
    input.agentGuidance.composition,
    input.agentGuidance.validation,
    ...(input.agentGuidance.nonGoals ?? []).map(nonGoal => `Not a hard requirement: ${nonGoal}`),
  ].filter(Boolean).join(' ')

  return {
    id: input.id,
    whenToUse: input.whenToUse,
    boundary: 'capability-discovery',
    components: input.components,
    ...(input.functions?.length ? { functions: input.functions } : {}),
    agentGuidance: input.agentGuidance,
    requiredComponents: input.components.primary,
    ...(input.components.supporting?.length ? { optionalComponents: input.components.supporting } : {}),
    ...(input.functions?.length ? { actions: input.functions } : {}),
    guidance,
  }
}

export function createVizualCapabilityManifest(): VizualCatalogCapabilityManifest[] {
  return [
    defineCapability({
      id: 'business-dashboard',
      whenToUse: 'The user asks for a dashboard, cockpit, KPI board, scorecard, or one-page business situation view.',
      components: {
        primary: ['KpiDashboard'],
        supporting: ['ComboChart', 'LineChart', 'BarChart', 'PieChart', 'DataTable', 'Markdown'],
      },
      functions: ['drillDown', 'applyFilter'],
      agentGuidance: {
        discovery: 'KpiDashboard is the native metric-card surface for compact business status.',
        composition: 'Pair metrics with charts, tables, and concise risk/action narrative when the user provides enough data.',
        validation: 'Validate contract facts such as non-empty data, real fields, and bound interactions; do not reject only because a different composition could be nicer.',
      },
    }),
    defineCapability({
      id: 'mixed-or-dual-axis-chart',
      whenToUse: 'The user asks for dual axes, mixed bar/line/scatter layers, bubble size, dense trend comparison, or multiple metrics in one chart.',
      components: {
        primary: ['ComboChart'],
        supporting: ['ScatterChart', 'BubbleChart', 'LineChart', 'DataTable'],
      },
      functions: ['drillDown', 'applyFilter'],
      agentGuidance: {
        discovery: 'ComboChart is the native surface for mixed chart layers and dual-axis comparisons.',
        composition: 'Use nearby tables or notes when the chart alone would hide the source rows.',
        validation: 'Preserve numeric fields and units from user data; validate that chart data is non-empty and not accidentally all zero.',
      },
    }),
    defineCapability({
      id: 'table-or-detail-analysis',
      whenToUse: 'The user asks to inspect rows, compare entities, rank items, reconcile values, or show detailed structured data.',
      components: {
        primary: ['DataTable'],
        supporting: ['KpiDashboard', 'BarChart', 'Markdown'],
      },
      functions: ['applyFilter', 'drillDown'],
      agentGuidance: {
        discovery: 'DataTable is the native row/column inspection surface.',
        composition: 'Charts can summarize, and tables preserve concrete rows when ranking or reconciliation matters.',
        validation: 'Check visible columns, row data, and action bindings when filters or drill-downs are advertised.',
      },
    }),
    defineCapability({
      id: 'structured-input-or-approval',
      whenToUse: 'The user needs to provide missing information, submit a decision, fill a form, approve an action, or send data back to the agent.',
      components: {
        primary: ['FormBuilder'],
        supporting: ['Button', 'ChoicePicker', 'TextField', 'CheckBox', 'DateTimeInput'],
      },
      functions: ['submitForm', 'updatePlan'],
      agentGuidance: {
        discovery: 'FormBuilder is the native structured input and approval surface.',
        composition: 'Use forms when the user needs to provide missing data, approve a plan, or submit a decision.',
        validation: 'A submitted form must have a real submit action path; demo-only buttons are not useful interactions.',
        nonGoals: ['Do not infer that every analysis request needs an input form.'],
      },
    }),
    defineCapability({
      id: 'long-form-analysis',
      whenToUse: 'The user asks for a report, long-form analysis, structured explanation, or mixed text/chart/table content.',
      components: {
        primary: ['Markdown'],
        supporting: ['KpiDashboard', 'DataTable', 'LineChart', 'BarChart'],
      },
      functions: ['updatePlan'],
      agentGuidance: {
        discovery: 'Markdown is the native structured prose surface. Pair it with semantic charts, KPI cards, and tables instead of a product-level document viewer.',
        composition: 'Keep ordinary prose in assistant text when no persistent visual surface is needed.',
        validation: 'Do not invent annotation or revision workflows unless the host product provides them outside native core.',
      },
    }),
    defineCapability({
      id: 'a2ui-basic-primitives',
      whenToUse: 'The agent needs native basic UI controls or media as part of an interactive surface.',
      components: {
        primary: ['Column', 'Row'],
        supporting: ['Text', 'Image', 'Button', 'CheckBox', 'TextField', 'ChoicePicker', 'Slider', 'DateTimeInput', 'Tabs', 'Video', 'AudioPlayer'],
      },
      functions: ['submitForm', 'applyFilter'],
      agentGuidance: {
        discovery: 'A2UI primitives normalize into native Vizual components for composition, controls, and media.',
        composition: 'Use primitives around semantic surfaces; they can also support direct control workflows.',
        validation: 'Primitive use is valid when it renders and its advertised interactions are backed by real actions.',
      },
    }),
  ]
}

type VizualAgentPromptExampleDraft = Omit<VizualAgentPromptExample, 'components' | 'actions'>

function knownComponentNames(): Set<string> {
  return new Set(Object.keys(getCatalogData().components ?? {}))
}

function knownActionNames(): Set<string> {
  return new Set(Object.keys(getCatalogData().actions ?? {}))
}

function walkJsonLike(value: unknown, visit: (record: Record<string, unknown>) => void) {
  if (Array.isArray(value)) {
    value.forEach(item => walkJsonLike(item, visit))
    return
  }
  if (!value || typeof value !== 'object') return
  const record = value as Record<string, unknown>
  visit(record)
  Object.values(record).forEach(child => walkJsonLike(child, visit))
}

function extractExampleComponents(input: unknown): string[] {
  const knownComponents = knownComponentNames()
  const components = new Set<string>()
  walkJsonLike(input, record => {
    for (const key of ['component', 'type', 'componentType']) {
      const value = record[key]
      if (typeof value === 'string' && knownComponents.has(value)) components.add(value)
    }
  })
  return Array.from(components)
}

function extractExampleActions(input: unknown): string[] {
  const knownActions = knownActionNames()
  const actions = new Set<string>()
  walkJsonLike(input, record => {
    for (const key of ['action', 'onClick', 'onPress', 'onSubmit', 'onChange', 'submitAction']) {
      const value = record[key]
      if (typeof value === 'string' && knownActions.has(value)) actions.add(value)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nestedAction = (value as Record<string, unknown>).action
        if (typeof nestedAction === 'string' && knownActions.has(nestedAction)) actions.add(nestedAction)
      }
    }
  })
  return Array.from(actions)
}

function defineExample(draft: VizualAgentPromptExampleDraft): VizualAgentPromptExample {
  return {
    ...draft,
    components: extractExampleComponents(draft.input),
    actions: extractExampleActions(draft.input),
  }
}

export function createVizualAgentPromptExamples(): VizualAgentPromptExample[] {
  return [
    defineExample({
      id: 'chain-store-diagnosis',
      title: '连锁门店经营诊断',
      whenToUse: '用户给出多门店经营数据，需要同时展示判断、图表、明细和整改表单。',
      input: [
        { version: 'v0.10', createSurface: { surfaceId: 'chain-store-diagnosis', catalogId: VIZUAL_CATALOG_ID } },
        {
          version: 'v0.10',
          updateDataModel: {
            surfaceId: 'chain-store-diagnosis',
            path: '/',
            value: {
              kpis: [],
              stores: [],
              trend: [],
              actionDraft: {},
            },
          },
        },
        {
          version: 'v0.10',
          updateComponents: {
            surfaceId: 'chain-store-diagnosis',
            components: [
              { id: 'root', component: 'Column', children: ['kpis', 'trend', 'stores', 'actionForm'] },
              { id: 'kpis', component: 'KpiDashboard', data: { path: '/kpis' } },
              {
                id: 'trend',
                component: 'LineChart',
                data: { path: '/trend' },
                encoding: { x: { field: 'date', type: 'temporal' } },
                measures: [
                  { field: 'revenue', label: '收入', mark: 'line' },
                  { field: 'traffic', label: '客流', mark: 'line' },
                ],
                action: 'drillDown',
              },
              { id: 'stores', component: 'DataTable', data: { path: '/stores' } },
              { id: 'actionForm', component: 'FormBuilder', value: { $bindState: '/actionDraft' }, fields: [] },
            ],
          },
        },
      ],
    }),
    defineExample({
      id: 'credit-card-cockpit',
      title: '全国信用卡经营驾驶舱',
      whenToUse: '用户给出经营趋势、区域、客群、活动数据，需要一页 dashboard 给管理层快速判断。',
      input: {
        root: 'root',
        elements: {
          root: { component: 'Column', children: ['kpi', 'trend', 'region', 'actions'] },
          kpi: {
            component: 'KpiDashboard',
            props: {
              title: '核心经营指标',
              metrics: [
                { label: '当月消费', value: '305亿元', trend: 'up', trendValue: '+41.9%' },
                { label: '不良率', value: '1.42%', trend: 'down', trendValue: '+0.21pp' },
              ],
            },
          },
          trend: {
            component: 'ComboChart',
            props: {
              title: '月度经营趋势',
              data: [{ month: '6月', spending: 305, installment: 115, npl: 1.42 }],
              encoding: { x: { field: 'month', type: 'ordinal' } },
              measures: [
                { field: 'spending', label: '消费金额', mark: 'bar', axis: 'left' },
                { field: 'installment', label: '分期金额', mark: 'bar', axis: 'left' },
                { field: 'npl', label: '不良率', mark: 'line', axis: 'right' },
              ],
            },
          },
          region: {
            component: 'BarChart',
            props: {
              title: '区域消费对比',
              data: [{ branch: '深圳', spending: 55 }],
              encoding: {
                x: { field: 'branch', type: 'nominal' },
                y: { field: 'spending', type: 'quantitative' },
              },
            },
          },
          actions: {
            component: 'DataTable',
            props: {
              title: '营销活动效率',
              columns: [{ key: 'campaign', label: '活动' }, { key: 'cpc', label: '获客成本' }],
              data: [{ campaign: '推荐有礼', cpc: 126.8 }],
            },
          },
        },
      },
    }),
    defineExample({
      id: 'engineering-dual-axis-chart',
      title: '研发投入与报错率双轴关联',
      whenToUse: '用户要求在一张图里混合柱状、折线、散点或气泡，并控制双 Y 轴。',
      input: {
        root: 'chart',
        elements: {
          chart: {
            component: 'ComboChart',
            props: {
              title: '研发投入与产品质量关联',
              data: [{ week: 'W6', hours: 820, crashRate: 8.5, churnRate: 3.8 }],
              encoding: { x: { field: 'week', type: 'ordinal' } },
              measures: [
                { field: 'hours', label: '研发投入工时', mark: 'bar', axis: 'left' },
                { field: 'crashRate', label: '系统崩溃率', mark: 'line', axis: 'right' },
                { field: 'churnRate', label: '用户流失率', mark: 'scatter', axis: 'right', size: 'churnRate' },
              ],
            },
          },
        },
      },
    }),
    defineExample({
      id: 'missing-data-intake',
      title: '缺失数据采集表单',
      whenToUse: '用户想分析但没有给足指标、时间范围、维度或明细数据。',
      input: {
        root: 'intake',
        elements: {
          intake: {
            component: 'FormBuilder',
            props: {
              title: '补充分析数据',
              fields: [
                { name: 'metric', label: '核心指标', type: 'text', required: true },
                { name: 'period', label: '时间范围', type: 'text', required: true },
                { name: 'rawData', label: '明细数据', type: 'textarea', required: true },
              ],
              submitLabel: '提交分析数据',
            },
          },
        },
      },
    }),
  ]
}

export function createVizualCatalogManifest(options: { includeExamples?: boolean; includeCompatibilityComponents?: boolean } = {}): VizualCatalogManifest {
  const components = getCatalogData().components ?? {}
  const manifestComponents = Object.fromEntries(
    Object.entries(components)
      .filter(([component]) => options.includeCompatibilityComponents || !DEFAULT_HIDDEN_AGENT_COMPONENTS.has(component))
      .map(([component, definition]) => [
        component,
        {
          component,
          description: definition.description ?? '',
          kind: componentKind(component),
          tags: componentTags(component),
          agentRole: componentAgentRole(component),
          compatibleInputs: componentCompatibleInputs(component),
          propsSchema: isDataChartComponent(component)
            ? withChartIntentProps(zodToJsonSchema(definition.props))
            : zodToJsonSchema(definition.props),
          children: inferChildrenKind(component),
          emits: inferEmits(component),
          ...componentAgentMetadata(component),
        },
      ]),
  )

  return {
    schema: VIZUAL_CATALOG_MANIFEST_SCHEMA,
    catalogId: VIZUAL_CATALOG_ID,
    catalogVersion: VIZUAL_CATALOG_VERSION,
    protocol: {
      a2ui: ['v0.9', 'v0.10'],
      agui: ['message', 'tool', 'state', 'activity', 'run', 'step', 'reasoning', 'custom/raw'],
      agenui: ['catalog-components', 'custom-components', 'interactive-surfaces'],
    },
    compatibility: createVizualCompatibilityMapping(),
    nativeCore: {
      surfaceModel: 'createSurface + updateDataModel + updateComponents + append/patch/delete',
      toolName: 'present_vizual_ui',
      themeBoundary: 'host-owned',
      validationBoundary: 'contract-only',
    },
    components: manifestComponents,
    capabilities: createVizualCapabilityManifest(),
    functions: createVizualActionDefinitions(),
    ...(options.includeExamples ? { examples: createVizualAgentPromptExamples() } : {}),
  }
}

export function createVizualToolInputSchema(manifest: VizualCatalogManifest = createVizualCatalogManifest()): JsonSchemaObject {
  const componentNames = Object.keys(manifest.components).sort()
  const actionNames = Object.keys(manifest.functions).sort()
  const componentNameSchema = {
    enum: componentNames,
    description: 'Native Vizual component name from vizual_catalog. Use semantic components such as KpiDashboard, chart components, DataTable, and FormBuilder instead of invented View/Card/Text-only dashboards.',
  }
  return {
    type: 'object',
    additionalProperties: false,
    required: ['input'],
    properties: {
      catalogId: {
        type: 'string',
        const: VIZUAL_CATALOG_ID,
        description: 'Catalog id advertised by Vizual native runtime.',
      },
      surfaceId: {
        type: 'string',
        description: 'Stable surface id for follow-up updates. Reuse it when updating the same UI.',
      },
      fallbackText: {
        type: 'string',
        description: 'Concise plain text summary shown when the host cannot render Vizual.',
      },
      display: {
        type: 'object',
        additionalProperties: true,
        properties: {
          mode: { enum: ['inline', 'side-panel', 'artifact'] },
          title: { type: 'string' },
          persist: { type: 'boolean' },
        },
      },
      requireRenderable: {
        type: 'boolean',
        description: 'When true, validate/preview must produce a visible renderable surface.',
      },
      input: {
        description: 'Vizual native operation(s), A2UI messages, AG-UI events, or a Vizual flat spec. Ordinary prose must stay outside this JSON. Do not pass Chart.js datasets, ECharts options, HTML, React, or CSS.',
        anyOf: [
          {
            type: 'array',
            items: { anyOf: [{ $ref: '#/$defs/a2uiMessage' }, { $ref: '#/$defs/aguiEvent' }, { $ref: '#/$defs/nativeOperation' }] },
          },
          { $ref: '#/$defs/a2uiMessage' },
          { $ref: '#/$defs/nativeOperation' },
          { $ref: '#/$defs/vizualSpec' },
          { $ref: '#/$defs/aguiEvent' },
        ],
      },
    },
    $defs: {
      a2uiMessage: {
        type: 'object',
        additionalProperties: true,
        properties: {
          version: { enum: ['v0.9', 'v0.10'] },
          createSurface: { type: 'object' },
          updateDataModel: { type: 'object' },
          updateComponents: {
            type: 'object',
            additionalProperties: true,
            properties: {
              surfaceId: { type: 'string' },
              components: {
                type: 'array',
                items: { $ref: '#/$defs/nativeComponent' },
              },
            },
          },
          appendDataModel: { type: 'object' },
          patchSurface: { type: 'object' },
          deleteSurface: { type: 'object' },
        },
      },
      aguiEvent: {
        type: 'object',
        additionalProperties: true,
        properties: {
          type: { type: 'string' },
          event: { type: 'string' },
          messageId: { type: 'string' },
          toolCallId: { type: 'string' },
        },
      },
      nativeOperation: {
        type: 'object',
        additionalProperties: true,
        properties: {
          type: { type: 'string' },
          surfaceId: { type: 'string' },
          components: {
            type: 'array',
            items: { $ref: '#/$defs/nativeComponent' },
          },
          value: {},
        },
      },
      nativeComponent: {
        type: 'object',
        additionalProperties: true,
        required: ['id', 'component'],
        properties: {
          id: {
            type: 'string',
            description: 'Stable component id. Reuse ids for follow-up updates and targetable artifacts.',
          },
          component: componentNameSchema,
          children: {
            anyOf: [
              { type: 'array', items: { type: 'string' } },
              {
                type: 'object',
                additionalProperties: true,
                properties: {
                  componentId: { type: 'string' },
                  path: { type: 'string' },
                },
              },
            ],
          },
          data: {
            description: 'Either inline rows/objects or a binding such as { "path": "/rows" } after updateDataModel.',
          },
          props: { type: 'object', additionalProperties: true },
          title: { type: 'string' },
        },
      },
      vizualSpec: {
        type: 'object',
        required: ['root', 'elements'],
        additionalProperties: true,
        properties: {
          root: { type: 'string' },
          elements: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              additionalProperties: true,
              properties: {
                type: componentNameSchema,
                component: componentNameSchema,
                componentType: componentNameSchema,
                props: { type: 'object' },
                children: { type: 'array', items: { type: 'string' } },
                on: {
                  type: 'object',
                  additionalProperties: true,
                  description: `Event bindings may call supported actions: ${actionNames.join(', ')}`,
                },
              },
            },
          },
          state: { type: 'object', additionalProperties: true },
        },
      },
    },
  }
}
