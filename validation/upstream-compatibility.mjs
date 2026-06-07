#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const a2uiRepo = process.env.A2UI_REPO || '/Users/wu/Documents/vizual-research/a2ui'
const aguiRepo = process.env.AG_UI_REPO || '/Users/wu/Documents/vizual-research/ag-ui'
const failures = []
const checks = []

function check(name, ok, details = {}) {
  checks.push({ name, ok: Boolean(ok), ...details })
  if (!ok) failures.push(name)
}

function gitShow(repo, ref) {
  return execFileSync('git', ['-C', repo, 'show', ref], { encoding: 'utf8' })
}

function readProject(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function propertySchema(catalog, componentName, propertyName) {
  const component = catalog.components?.[componentName]
  const blocks = Array.isArray(component?.allOf) ? component.allOf : []
  for (const block of blocks) {
    const properties = block?.properties
    if (properties && Object.prototype.hasOwnProperty.call(properties, propertyName)) {
      return properties[propertyName]
    }
  }
  return undefined
}

check('A2UI repo exists', existsSync(a2uiRepo), { repo: a2uiRepo })
check('AG-UI repo exists', existsSync(aguiRepo), { repo: aguiRepo })

if (existsSync(a2uiRepo)) {
  const catalogText = gitShow(a2uiRepo, 'origin/main:specification/v0_10/catalogs/basic/catalog.json')
  const catalog = JSON.parse(catalogText)
  check('A2UI v0.10 Slider.steps present upstream', Boolean(propertySchema(catalog, 'Slider', 'steps')))
  check('A2UI v0.10 TextField.placeholder present upstream', Boolean(propertySchema(catalog, 'TextField', 'placeholder')))
  check('A2UI v0.10 Video.url present upstream', Boolean(propertySchema(catalog, 'Video', 'url')))
  check('A2UI v0.10 Video.posterUrl present upstream', Boolean(propertySchema(catalog, 'Video', 'posterUrl')))

  const agentGuide = gitShow(a2uiRepo, 'origin/main:agent_sdks/agent_sdk_guide.md')
  const mcpGuide = gitShow(a2uiRepo, 'origin/main:docs/guides/a2ui_over_mcp.md')
  check('A2UI current MIME is application/a2ui+json', agentGuide.includes('application/a2ui+json') && mcpGuide.includes('application/a2ui+json'))
}

if (existsSync(aguiRepo)) {
  const toolSource = gitShow(aguiRepo, 'origin/main:middlewares/a2ui-middleware/src/tools.ts')
  const toolObject = toolSource.match(/properties:\s*\{([\s\S]*?)\n\s*\},\n\s*required:/)?.[1] ?? ''
  check('AG-UI render_a2ui keeps catalog owned by host', !toolObject.includes('catalogId') && toolSource.includes('catalog id is set by the host'))
  check('AG-UI render_a2ui still requires surfaceId and components', toolSource.includes('required: ["surfaceId", "components"]'))
}

const nativeCore = readProject('src/native-core/core.ts')
check('Vizual accepts current A2UI MIME', nativeCore.includes('application/a2ui+json'))
check('Vizual keeps deprecated A2UI MIME compatibility', nativeCore.includes('application/json+a2ui'))
check('Vizual native core extracts MCP resources recursively', nativeCore.includes('parsed.resource') && nativeCore.includes('mimeType'))
check('Vizual accepts AG-UI render_a2ui structured args without model catalogId', nativeCore.includes('a2uiMessagesFromRenderToolArgs') && nativeCore.includes('defaultCatalogId'))

const sliderSchema = readProject('src/components/a2ui-slider/schema.ts')
const sliderComponent = readProject('src/components/a2ui-slider/component.tsx')
check('Vizual Slider accepts A2UI v0.10 steps', sliderSchema.includes('steps:') && sliderComponent.includes('props.steps'))

const videoSchema = readProject('src/components/a2ui-video/schema.ts')
const videoComponent = readProject('src/components/a2ui-video/component.tsx')
check('Vizual Video accepts A2UI v0.10 url/posterUrl', videoSchema.includes('url:') && videoSchema.includes('posterUrl:') && videoComponent.includes('props.url') && videoComponent.includes('props.posterUrl'))

const result = {
  pass: checks.filter(item => item.ok).length,
  fail: failures.length,
  checks,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exit(1)
