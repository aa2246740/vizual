#!/usr/bin/env node

/**
 * AI RenderKit Spec Validator
 *
 * Validates a JSON spec against the 31-component catalog + 3 layout components.
 * Usage:
 *   node scripts/validate-spec.js < spec.json
 *   node scripts/validate-spec.js path/to/spec.json
 *   echo '{"root":"main","elements":{...}}' | node scripts/validate-spec.js
 */

const fs = require('fs')
const path = require('path')

// Component type → props type literal mapping
// Matches the 31 registered components in src/catalog.ts
const COMPONENT_TYPES = {
  // Charts (19) — mviz bridge
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
  // UI (1) — mviz bridge
  DataTable: 'table',
  // Business components (6)
  Timeline: 'timeline',
  Kanban: 'kanban',
  GanttChart: 'gantt',
  OrgChart: 'org_chart',
  KpiDashboard: 'kpi_dashboard',
  AuditLog: 'audit_log',
  // Input components (1)
  FormBuilder: 'form_builder',
  // DocView (1)
  DocView: 'doc_view',
}

// Layout components (no type literal in props)
const LAYOUT_TYPES = ['GridLayout', 'SplitLayout', 'HeroLayout']

const ALL_TYPES = new Set([...Object.keys(COMPONENT_TYPES), ...LAYOUT_TYPES])

function validate(spec) {
  const errors = []
  const warnings = []

  // Check top-level structure
  if (!spec.root) errors.push('Missing "root" field')
  if (!spec.elements || typeof spec.elements !== 'object') {
    errors.push('Missing or invalid "elements" object')
    return { errors, warnings }
  }

  // Check root element exists
  if (spec.root && !spec.elements[spec.root]) {
    errors.push(`Root element "${spec.root}" not found in elements`)
  }

  // Check each element
  for (const [id, el] of Object.entries(spec.elements)) {
    if (!el.type) {
      errors.push(`Element "${id}": missing "type" field`)
      continue
    }

    if (!ALL_TYPES.has(el.type)) {
      errors.push(`Element "${id}": unknown component type "${el.type}"`)
      continue
    }

    // Check props type literal for non-layout components
    if (COMPONENT_TYPES[el.type]) {
      const expectedType = COMPONENT_TYPES[el.type]
      if (!el.props) {
        errors.push(`Element "${id}": missing "props"`)
      } else if (el.props.type !== expectedType) {
        errors.push(
          `Element "${id}": props.type should be "${expectedType}" for ${el.type}, got "${el.props.type}"`
        )
      }
    }

    // Check children
    if (!Array.isArray(el.children)) {
      errors.push(`Element "${id}": "children" must be an array`)
    } else {
      for (const childId of el.children) {
        if (!spec.elements[childId]) {
          errors.push(`Element "${id}": child "${childId}" not found in elements`)
        }
      }
    }

    // Chart-specific checks
    if (['BarChart', 'LineChart', 'AreaChart', 'ScatterChart', 'BubbleChart',
         'BoxplotChart', 'HistogramChart', 'HeatmapChart', 'CalendarChart',
         'RadarChart'].includes(el.type)) {
      if (el.props && !el.props.data) {
        warnings.push(`Element "${id}": ${el.type} usually needs a "data" array`)
      }
    }
  }

  return { errors, warnings }
}

function main() {
  let input

  if (process.argv.length > 2) {
    const filePath = path.resolve(process.argv[2])
    input = fs.readFileSync(filePath, 'utf-8')
  } else {
    input = fs.readFileSync(0, 'utf-8')
  }

  let spec
  try {
    spec = JSON.parse(input)
  } catch (e) {
    console.error('❌ Invalid JSON:', e.message)
    process.exit(1)
  }

  const { errors, warnings } = validate(spec)

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:')
    warnings.forEach(w => console.log(`   ${w}`))
    console.log()
  }

  if (errors.length === 0) {
    const componentNames = Object.values(spec.elements)
      .map(el => el.type)
      .filter(t => COMPONENT_TYPES[t])
    console.log(`✅ Valid spec! ${componentNames.length} component(s): ${componentNames.join(', ')}`)
  } else {
    console.error('❌ Validation failed:')
    errors.forEach(e => console.error(`   ${e}`))
    process.exit(1)
  }
}

main()
