import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import { renderKitCatalog } from '../../catalog'
import { createVizualCatalogManifest } from '../../catalog-manifest'
import { VIZUAL_RENDERABLE_COMPONENTS } from '../../native-core/validate'
import { handlers, registry } from '../../registry'

function galleryFixtureComponentNames(): string[] {
  const source = fs.readFileSync(path.join(process.cwd(), 'validation/specs-31.js'), 'utf8')
  const context: { SPECS?: Array<{ spec?: { elements?: Record<string, { type?: string }> } }> } = {}
  vm.runInNewContext(`${source}\nthis.SPECS = SPECS;`, context)

  const covered = new Set<string>()
  for (const item of context.SPECS ?? []) {
    for (const element of Object.values(item.spec?.elements ?? {})) {
      if (typeof element.type === 'string') covered.add(element.type)
    }
  }
  return [...covered].sort()
}

describe('native core coverage parity', () => {
  it('keeps catalog, manifest, registry, validator, and gallery fixtures in lockstep', () => {
    const catalogComponents = Object.keys(((renderKitCatalog as unknown as { data?: { components?: Record<string, unknown> } }).data?.components) ?? {}).sort()
    const manifestComponents = Object.keys(createVizualCatalogManifest({ includeCompatibilityComponents: true }).components).sort()
    const registryComponents = Object.keys(registry).sort()
    const renderableComponents = [...VIZUAL_RENDERABLE_COMPONENTS].sort()
    const fixtureComponents = galleryFixtureComponentNames()

    expect(catalogComponents).toHaveLength(45)
    expect(manifestComponents).toEqual(catalogComponents)
    expect(registryComponents).toEqual(catalogComponents)
    expect(renderableComponents).toEqual(catalogComponents)
    expect(fixtureComponents).toEqual(catalogComponents)
  })

  it('keeps every manifest function backed by a runtime action handler', () => {
    const manifestActions = Object.keys(createVizualCatalogManifest({ includeCompatibilityComponents: true }).functions).sort()
    const state = {}
    const runtimeHandlers = handlers(
      () => () => undefined,
      () => state,
    )

    expect(Object.keys(runtimeHandlers).sort()).toEqual(manifestActions)
  })
})
