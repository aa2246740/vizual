import {
  previewVizualNativeInput,
  VIZUAL_NATIVE_PREVIEW_MIME,
  type VizualPreviewResult,
  type VizualPreviewOptions,
} from '../native-core/preview'
import type { VizualNativeInput } from '../native-core/types'
import {
  createVizualCatalogManifest,
  createVizualToolInputSchema,
  VIZUAL_CATALOG_ID,
  VIZUAL_CATALOG_MANIFEST_SCHEMA,
  VIZUAL_CATALOG_VERSION,
  type VizualCatalogManifest,
} from '../catalog-manifest'
export {
  assertVizualAgentToolCoverage,
  inferVizualAgentUserIntent,
  VIZUAL_AGENT_CHART_COMPONENTS,
} from './intent'
export type {
  VizualAgentCoverageIssue,
  VizualAgentCoverageResult,
  VizualAgentQAGuidance,
  VizualAgentUserIntent,
} from './intent'

export const VIZUAL_NATIVE_MIME = 'application/vnd.vizual.native+json'
export const VIZUAL_AGENT_ENVELOPE_MIME = 'application/vnd.vizual.agent+json'
export const VIZUAL_AGENT_TOOL_NAME = 'present_vizual_ui'

export type VizualAgentDisplayHint = {
  mode?: 'inline' | 'side-panel' | 'artifact'
  title?: string
  persist?: boolean
}

export type VizualAgentEnvelope = {
  schema: 'vizual.agent.envelope.v1'
  mimeType: typeof VIZUAL_AGENT_ENVELOPE_MIME
  nativeMimeType: typeof VIZUAL_NATIVE_MIME
  toolName: typeof VIZUAL_AGENT_TOOL_NAME
  surfaceId?: string
  fallbackText?: string
  display?: VizualAgentDisplayHint
  input: VizualNativeInput
}

export type VizualAgentRenderResult = {
  ok: boolean
  envelope: VizualAgentEnvelope
  preview: VizualPreviewResult
}

export type VizualAgentToolDefinition = {
  name: typeof VIZUAL_AGENT_TOOL_NAME
  description: string
  inputSchema: Record<string, unknown>
  catalog: {
    schema: typeof VIZUAL_CATALOG_MANIFEST_SCHEMA
    catalogId: typeof VIZUAL_CATALOG_ID
    catalogVersion: typeof VIZUAL_CATALOG_VERSION
  } | VizualCatalogManifest
}

export function createVizualAgentEnvelope(
  input: VizualNativeInput,
  options: {
    surfaceId?: string
    fallbackText?: string
    display?: VizualAgentDisplayHint
  } = {},
): VizualAgentEnvelope {
  return {
    schema: 'vizual.agent.envelope.v1',
    mimeType: VIZUAL_AGENT_ENVELOPE_MIME,
    nativeMimeType: VIZUAL_NATIVE_MIME,
    toolName: VIZUAL_AGENT_TOOL_NAME,
    surfaceId: options.surfaceId,
    fallbackText: options.fallbackText,
    display: options.display,
    input,
  }
}

export function renderVizualAgentInput(
  input: VizualNativeInput,
  options: VizualPreviewOptions & {
    display?: VizualAgentDisplayHint
  } = {},
): VizualAgentRenderResult {
  const preview = previewVizualNativeInput(input, options)
  return {
    ok: preview.ok,
    envelope: createVizualAgentEnvelope(input, {
      surfaceId: preview.surfaceId || options.surfaceId,
      fallbackText: options.fallbackText,
      display: options.display,
    }),
    preview,
  }
}

export function createVizualAgentToolDefinition(options: {
  includeCatalogManifest?: boolean
} = {}): VizualAgentToolDefinition {
  const manifest = createVizualCatalogManifest({ includeExamples: options.includeCatalogManifest })
  const capabilitySummary = manifest.capabilities
    .map(capability => `${capability.id}: ${capability.components.primary.join('+')}`)
    .join('; ')
  return {
    name: VIZUAL_AGENT_TOOL_NAME,
    description: [
      'Render a persistent Vizual rich UI part in the host chat.',
      'Use this tool when you decide the current answer would be clearer or more actionable as an inline Vizual surface, or when the user explicitly asks for a host-rendered Vizual surface.',
      'Keep ordinary prose in assistant text and put only the structured UI payload in this tool call.',
      'Do not call this tool for greetings, short text-only answers, ordinary conceptual Q&A, explicit creative requests such as webpages/games/custom HTML/code artifacts, or vague requests that only ask whether analysis is possible without data or a UI need.',
      'If you are unsure which component to use, inspect the Vizual catalog first, then use the closest native component or report optional catalog-gap metadata when the catalog cannot express the task cleanly.',
      'Keep ordinary prose in the assistant text and pass the structured UI input here.',
      `Use catalog "${VIZUAL_CATALOG_ID}" ${VIZUAL_CATALOG_VERSION}; do not invent component names outside the advertised catalog.`,
      `Capability discovery map: ${capabilitySummary}. These are discovery hints, not creative gates or mandatory component bundles.`,
      'Do not pass Chart.js configs, ECharts option objects, HTML, React code, CSS, or app scaffolds as input. External agents speak Vizual native input; Vizual may use renderer libraries internally.',
      'Prefer semantic Vizual components when they fit the task, such as metric, chart, table, form, document, or primitive controls from the live catalog, instead of hand-built Text/View/Card imitations that lose render, state, export, or action semantics.',
      'If the user explicitly asks to prove, support, or show conclusions with charts/图表, include at least one native chart component using the supplied data. DataTable may support details, but a table or action list alone does not satisfy chart evidence.',
      'For charts, prefer props.data plus typed props.encoding and optional props.measures. Use encoding.x/y/value/label/color/source/target/low/high to name source data fields; use measures for multiple numeric series or ComboChart bar/line/scatter layers. Do not use a string series prop as the recommended path: categorical grouping belongs in encoding.color, seriesBy, colorBy, or groupBy; numeric series belong in measures or explicit series arrays.',
      'Use input controls when collecting missing user data, parameter choices, or action approvals, and wire actions such as submitForm, drillDown, applyFilter, selectLocation, or updatePlan only when the interaction is meaningful and the host can receive it.',
      'Charts and tables must have non-empty data. Reuse the same surfaceId for follow-up updates to the same UI.',
      'Do not invent dates, years, YoY/year-over-year labels, or baseline comparisons that are not present in the user data.',
      'Do not invent regulatory thresholds, warning lines, industry averages, benchmark values, or risk scoring standards unless the user supplied them.',
      'Forbidden unless present in the source data: 行业警戒线, 监管预警线, 预警线, 红线, 阈值, 行业均值, 1.5% warning line. For risk prompts, say only relative facts such as “provided rows show the highest/lowest value” or “the provided monthly series is rising”.',
      'The host QA report may flag UI input that contains unsupplied external benchmark/threshold phrases. If that happens, remove or qualify the benchmark claim and call the tool again.',
      'Charts are hydrated with real drillDown actions by the Vizual runtime. For non-chart interactions such as filters, submit buttons, approvals, or plan updates, do not claim interactivity unless the Vizual input includes a real action/function call/control for that behavior.',
      'Do not claim validation passed or failed in assistant prose; the host runtime reports validation status.',
      'If the user only provides month labels such as 1月-6月 without a year, title the UI as 月度/截至6月/1-6月 and never infer the current year.',
      'Do not use Vizual as a theme or layout gate: host and Agent own visual style, while Vizual owns native rendering, state, validation, and action transport.',
      'Default to semantic components plus simple Column/Row composition. Page-level layout widgets are not native core components unless they appear in the live catalog.',
      'For FormBuilder, do not prefill editable fields unless the user already supplied the exact value; use clear labels, placeholders, and select/radio options.',
    ].join(' '),
    inputSchema: createVizualToolInputSchema(manifest),
    catalog: options.includeCatalogManifest
      ? manifest
      : {
          schema: VIZUAL_CATALOG_MANIFEST_SCHEMA,
          catalogId: VIZUAL_CATALOG_ID,
          catalogVersion: VIZUAL_CATALOG_VERSION,
        },
  }
}

export function isVizualAgentEnvelope(value: unknown): value is VizualAgentEnvelope {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && (value as Record<string, unknown>).schema === 'vizual.agent.envelope.v1'
    && (value as Record<string, unknown>).mimeType === VIZUAL_AGENT_ENVELOPE_MIME,
  )
}

export function vizualEnvelopeToMcpEmbeddedResource(
  envelope: VizualAgentEnvelope,
  uri = `vizual://surface/${encodeURIComponent(envelope.surfaceId ?? 'surface')}`,
) {
  return {
    type: 'resource' as const,
    resource: {
      uri,
      mimeType: VIZUAL_AGENT_ENVELOPE_MIME,
      text: JSON.stringify(envelope),
    },
  }
}

export function vizualPreviewToMcpEmbeddedResource(
  preview: VizualPreviewResult,
  uri = `vizual://preview/${encodeURIComponent(preview.surfaceId || 'surface')}`,
) {
  return {
    type: 'resource' as const,
    resource: {
      uri,
      mimeType: VIZUAL_NATIVE_PREVIEW_MIME,
      text: JSON.stringify(preview),
    },
  }
}
