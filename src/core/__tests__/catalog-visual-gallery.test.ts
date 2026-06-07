import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import { createVizualCatalogManifest } from '../../catalog-manifest'

describe('catalog visual gallery', () => {
  it('covers every current catalog component with a browser-renderable fixture', () => {
    const manifest = createVizualCatalogManifest({ includeCompatibilityComponents: true })
    const source = fs.readFileSync(path.join(process.cwd(), 'validation/specs-31.js'), 'utf8')
    const context: { SPECS?: Array<{ spec?: { elements?: Record<string, { type?: string }> } }> } = {}
    vm.runInNewContext(`${source}\nthis.SPECS = SPECS;`, context)

    const covered = new Set<string>()
    for (const item of context.SPECS ?? []) {
      for (const element of Object.values(item.spec?.elements ?? {})) {
        if (typeof element.type === 'string') covered.add(element.type)
      }
    }

    const expected = Object.keys(manifest.components).sort()
    const missing = expected.filter(component => !covered.has(component))
    expect(missing).toEqual([])
  })
})
