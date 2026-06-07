#!/usr/bin/env node

/**
 * Vizual Spec Validator
 *
 * Validates a flat Vizual JSON spec against the current native core catalog.
 * Usage:
 *   node scripts/validate-spec.js < spec.json
 *   node scripts/validate-spec.js path/to/spec.json
 */

const fs = require('fs')
const path = require('path')

// Components with a required props.type literal.
const TYPED_COMPONENTS = {
  // Charts (19)
  BarChart: 'bar',
  LineChart: 'line',
  AreaChart: 'area',
  PieChart: 'pie',
  ScatterChart: 'scatter',
  BubbleChart: 'bubble',
  BoxplotChart: 'boxplot',
  HistogramChart: 'histogram',
  WaterfallChart: 'waterfall',
  XmrChart: 'xmr',
  SankeyChart: 'sankey',
  FunnelChart: 'funnel',
  HeatmapChart: 'heatmap',
  CalendarChart: 'calendar',
  SparklineChart: 'sparkline',
  ComboChart: 'combo',
  DumbbellChart: 'dumbbell',
  MermaidDiagram: 'mermaid',
  RadarChart: 'radar',

  // Data, business, input
  DataTable: 'table',
  Timeline: 'timeline',
  GanttChart: 'gantt',
  OrgChart: 'org_chart',
  KpiDashboard: 'kpi_dashboard',
  FormBuilder: 'form_builder',
}

// Components without a props.type literal.
const UNTYPED_COMPONENTS = new Set([
  'Markdown',
  'Container',
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
  'Video',
  'AudioPlayer',
])

// Runtime compatibility only. Do not generate for new Agent UI.
const COMPATIBILITY_COMPONENTS = new Set(['HeroLayout'])

const REMOVED_COMPONENTS = new Set([
  'DocView',
  'GridLayout',
  'SplitLayout',
  'FreeformHtml',
  'Modal',
  'Kanban',
  'AuditLog',
])

const ALL_TYPES = new Set([
  ...Object.keys(TYPED_COMPONENTS),
  ...UNTYPED_COMPONENTS,
  ...COMPATIBILITY_COMPONENTS,
])

const DATA_COMPONENTS = new Set([
  'BarChart',
  'LineChart',
  'AreaChart',
  'ScatterChart',
  'BubbleChart',
  'BoxplotChart',
  'HistogramChart',
  'HeatmapChart',
  'CalendarChart',
  'RadarChart',
])

function validate(spec) {
  const errors = []
  const warnings = []

  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    return { errors: ['Spec must be a JSON object'], warnings }
  }

  if (!spec.root) errors.push('Missing "root" field')
  if (!spec.elements || typeof spec.elements !== 'object' || Array.isArray(spec.elements)) {
    errors.push('Missing or invalid "elements" object')
    return { errors, warnings }
  }

  if (spec.root && !spec.elements[spec.root]) {
    errors.push(`Root element "${spec.root}" not found in elements`)
  }

  for (const [id, el] of Object.entries(spec.elements)) {
    if (!el || typeof el !== 'object' || Array.isArray(el)) {
      errors.push(`Element "${id}": must be an object`)
      continue
    }

    if (!el.type) {
      errors.push(`Element "${id}": missing "type" field`)
      continue
    }

    if (REMOVED_COMPONENTS.has(el.type)) {
      errors.push(`Element "${id}": "${el.type}" was removed from native core and is not supported`)
      continue
    }

    if (!ALL_TYPES.has(el.type)) {
      errors.push(`Element "${id}": unknown component type "${el.type}"`)
      continue
    }

    if (COMPATIBILITY_COMPONENTS.has(el.type)) {
      warnings.push(`Element "${id}": ${el.type} is runtime compatibility only; do not generate it for new Agent UI`)
    }

    const expectedType = TYPED_COMPONENTS[el.type]
    if (expectedType) {
      if (!el.props || typeof el.props !== 'object' || Array.isArray(el.props)) {
        errors.push(`Element "${id}": missing or invalid "props"`)
      } else if (el.props.type !== expectedType) {
        errors.push(`Element "${id}": props.type should be "${expectedType}" for ${el.type}, got "${el.props.type}"`)
      }
    }

    if (!Array.isArray(el.children)) {
      errors.push(`Element "${id}": "children" must be an array`)
    } else {
      for (const childId of el.children) {
        if (!spec.elements[childId]) {
          errors.push(`Element "${id}": child "${childId}" not found in elements`)
        }
      }
    }

    if (DATA_COMPONENTS.has(el.type) && el.props && !el.props.data) {
      warnings.push(`Element "${id}": ${el.type} usually needs a "data" array`)
    }
  }

  return { errors, warnings }
}

function main() {
  let input

  if (process.argv.length > 2) {
    input = fs.readFileSync(path.resolve(process.argv[2]), 'utf-8')
  } else {
    input = fs.readFileSync(0, 'utf-8')
  }

  let spec
  try {
    spec = JSON.parse(input)
  } catch (e) {
    console.error('Invalid JSON:', e.message)
    process.exit(1)
  }

  const { errors, warnings } = validate(spec)

  if (warnings.length > 0) {
    console.log('Warnings:')
    warnings.forEach(w => console.log(`  ${w}`))
    console.log()
  }

  if (errors.length === 0) {
    const componentNames = Object.values(spec.elements)
      .map(el => el.type)
      .filter(type => ALL_TYPES.has(type))
    console.log(`Valid spec. ${componentNames.length} component(s): ${componentNames.join(', ')}`)
  } else {
    console.error('Validation failed:')
    errors.forEach(e => console.error(`  ${e}`))
    process.exit(1)
  }
}

main()
