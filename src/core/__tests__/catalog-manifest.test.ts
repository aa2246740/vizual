import { describe, expect, it } from 'vitest'
import {
  createVizualAgentPromptExamples,
  createVizualCatalogManifest,
  createVizualToolInputSchema,
} from '../../catalog-manifest'

describe('catalog manifest', () => {
  it('publishes component metadata and compatibility mapping from the native catalog', () => {
    const manifest = createVizualCatalogManifest({ includeCompatibilityComponents: true })

    expect(manifest.nativeCore).toMatchObject({
      toolName: 'present_vizual_ui',
      themeBoundary: 'host-owned',
      validationBoundary: 'contract-only',
    })
    expect(manifest.compatibility.inputLanguages.a2uiMessage).toMatchObject({
      role: 'transport',
      normalizedInto: 'vizual-native-surface',
    })
    expect(manifest.compatibility.inputLanguages.aguiEvent).toMatchObject({
      role: 'transport',
      normalizedInto: 'vizual-native-surface',
    })
    expect(manifest.compatibility.inputLanguages.vizualSpec).toMatchObject({
      role: 'input',
      normalizedInto: 'vizual-native-surface',
    })
    expect(manifest.compatibility.nativeAliases.component).toEqual(['component', 'type', 'componentType'])

    expect(manifest.components.KpiDashboard).toMatchObject({
      kind: 'business',
      agentRole: 'semantic-surface',
      compatibleInputs: expect.arrayContaining(['nativeOperation', 'vizualSpec', 'aguiEvent']),
    })
    expect(manifest.components.LineChart).toMatchObject({
      kind: 'chart',
      tags: expect.arrayContaining(['visualization', 'data-bound']),
      agentGuidance: expect.stringContaining('props.encoding'),
      propsSchema: {
        properties: expect.objectContaining({
          encoding: expect.objectContaining({ type: 'object' }),
          measures: expect.objectContaining({ type: 'array' }),
          seriesBy: expect.objectContaining({ description: expect.stringContaining('Categorical grouping') }),
        }),
      },
    })
    expect((manifest.components.BarChart.propsSchema.required as string[])).not.toContain('x')
    expect((manifest.components.BarChart.propsSchema.required as string[])).not.toContain('y')
    expect(manifest.components.FormBuilder).toMatchObject({
      kind: 'input',
      emits: expect.arrayContaining([{ event: 'submit', description: 'Submits bound form data through submitForm.' }]),
    })
    expect(manifest.components.HeroLayout).toBeUndefined()
  })

  it('keeps capabilities and tool schema derived from catalog components and functions', () => {
    const manifest = createVizualCatalogManifest()
    const componentNames = new Set(Object.keys(manifest.components))
    const functionNames = new Set(Object.keys(manifest.functions))

    for (const capability of manifest.capabilities) {
      expect(capability.boundary).toBe('capability-discovery')
      expect(capability.requiredComponents).toEqual(capability.components.primary)
      expect(capability.optionalComponents ?? []).toEqual(capability.components.supporting ?? [])
      expect(capability.actions ?? []).toEqual(capability.functions ?? [])
      for (const component of [...capability.components.primary, ...(capability.components.supporting ?? [])]) {
        expect(componentNames.has(component), `${capability.id} references missing component ${component}`).toBe(true)
      }
      for (const action of capability.functions ?? []) {
        expect(functionNames.has(action), `${capability.id} references missing function ${action}`).toBe(true)
      }
    }

    expect(manifest.functions.submitForm).toMatchObject({
      kind: 'host-action',
      emittedBy: expect.arrayContaining(['FormBuilder']),
      compatibleInputs: expect.arrayContaining(['nativeOperation', 'vizualSpec', 'a2uiMessage']),
    })
    expect(manifest.functions.requestRevision).toBeUndefined()
    expect(manifest.functions.batchSubmit).toBeUndefined()
    for (const removed of ['DocView', 'Kanban', 'AuditLog', 'GridLayout', 'SplitLayout', 'FreeformHtml', 'Modal', 'HeroLayout']) {
      expect(manifest.components[removed], `${removed} should not be in native core manifest`).toBeUndefined()
    }

    const schema = createVizualToolInputSchema(manifest) as {
      properties: {
        input: { anyOf: Array<{ type?: string }> }
        vizual?: unknown
      }
      $defs: { nativeComponent: { properties: { component: { enum: string[] } } } }
    }
    expect(schema.properties.vizual).toBeUndefined()
    expect(schema.properties.input.anyOf.some(entry => entry.type === 'string')).toBe(false)
    expect(schema.$defs.nativeComponent.properties.component.enum).toEqual(Object.keys(manifest.components).sort())
  })

  it('derives example component and action references from example payloads', () => {
    const examples = createVizualAgentPromptExamples()
    const chainStore = examples.find(example => example.id === 'chain-store-diagnosis')
    const creditCard = examples.find(example => example.id === 'credit-card-cockpit')

    expect(chainStore?.components).toEqual(expect.arrayContaining(['Column', 'KpiDashboard', 'LineChart', 'DataTable', 'FormBuilder']))
    expect(chainStore?.actions).toEqual(['drillDown'])
    expect(creditCard?.components).toEqual(expect.arrayContaining(['Column', 'KpiDashboard', 'ComboChart', 'BarChart', 'DataTable']))
    expect(creditCard?.actions).toEqual([])
  })
})
