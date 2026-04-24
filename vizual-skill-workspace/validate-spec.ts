/**
 * Vizual spec 验证器
 * 用 Zod schema 自动验证 AI 生成的 JSON spec 是否合法
 *
 * 用法: npx tsx vizual-skill-workspace/validate-spec.ts <spec.json>
 */
import * as fs from 'fs';
import * as path from 'path';

// 动态 import 所有 schema
const ROOT = path.resolve(__dirname, '..');

async function main() {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error('Usage: npx tsx validate-spec.ts <spec.json>');
    process.exit(1);
  }

  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

  // 动态导入 registry 获取 schema map
  const catalogModule = await import(path.resolve(ROOT, 'src/catalog'));
  const registryModule = await import(path.resolve(ROOT, 'src/registry'));

  // 构建 type → schema 映射
  const typeToSchema: Record<string, any> = {};

  // 从各 schema 文件导入
  const schemaImports = [
    { file: 'src/mviz-bridge/bar-chart/schema', name: 'BarChartSchema', type: 'bar' },
    { file: 'src/mviz-bridge/line/schema', name: 'LineChartSchema', type: 'line' },
    { file: 'src/mviz-bridge/area/schema', name: 'AreaChartSchema', type: 'area' },
    { file: 'src/mviz-bridge/pie/schema', name: 'PieChartSchema', type: 'pie' },
    { file: 'src/mviz-bridge/scatter/schema', name: 'ScatterChartSchema', type: 'scatter' },
    { file: 'src/mviz-bridge/bubble/schema', name: 'BubbleChartSchema', type: 'bubble' },
    { file: 'src/mviz-bridge/boxplot/schema', name: 'BoxplotChartSchema', type: 'boxplot' },
    { file: 'src/mviz-bridge/histogram/schema', name: 'HistogramChartSchema', type: 'histogram' },
    { file: 'src/mviz-bridge/waterfall/schema', name: 'WaterfallChartSchema', type: 'waterfall' },
    { file: 'src/mviz-bridge/xmr/schema', name: 'XmrChartSchema', type: 'xmr' },
    { file: 'src/mviz-bridge/sankey/schema', name: 'SankeyChartSchema', type: 'sankey' },
    { file: 'src/mviz-bridge/funnel/schema', name: 'FunnelChartSchema', type: 'funnel' },
    { file: 'src/mviz-bridge/heatmap/schema', name: 'HeatmapChartSchema', type: 'heatmap' },
    { file: 'src/mviz-bridge/calendar/schema', name: 'CalendarChartSchema', type: 'calendar' },
    { file: 'src/mviz-bridge/sparkline/schema', name: 'SparklineChartSchema', type: 'sparkline' },
    { file: 'src/mviz-bridge/combo/schema', name: 'ComboChartSchema', type: 'combo' },
    { file: 'src/mviz-bridge/dumbbell/schema', name: 'DumbbellChartSchema', type: 'dumbbell' },
    { file: 'src/mviz-bridge/radar/schema', name: 'RadarChartSchema', type: 'radar' },
    { file: 'src/mviz-bridge/mermaid/schema', name: 'MermaidSchema', type: 'mermaid' },
    { file: 'src/mviz-bridge/table/schema', name: 'DataTableSchema', type: 'table' },
    { file: 'src/components/kpi-dashboard/schema', name: 'KpiDashboardSchema', type: 'kpi_dashboard' },
    { file: 'src/components/timeline/schema', name: 'TimelineSchema', type: 'timeline' },
    { file: 'src/components/kanban/schema', name: 'KanbanSchema', type: 'kanban' },
    { file: 'src/components/gantt/schema', name: 'GanttChartSchema', type: 'gantt' },
    { file: 'src/components/org-chart/schema', name: 'OrgChartSchema', type: 'org_chart' },
    { file: 'src/components/audit-log/schema', name: 'AuditLogSchema', type: 'audit_log' },
    { file: 'src/inputs/form-builder/schema', name: 'FormBuilderSchema', type: 'form_builder' },
    { file: 'src/docview/schema', name: 'DocViewSchema', type: 'doc_view' },
    { file: 'src/components/grid-layout/schema', name: 'GridLayoutSchema', type: 'GridLayout' },
    { file: 'src/components/split-layout/schema', name: 'SplitLayoutSchema', type: 'SplitLayout' },
    { file: 'src/components/hero-layout/schema', name: 'HeroLayoutSchema', type: 'HeroLayout' },
  ];

  for (const s of schemaImports) {
    try {
      const mod = await import(path.resolve(ROOT, s.file));
      typeToSchema[s.type] = mod[s.name];
    } catch (e) {
      // skip
    }
  }

  // 验证 spec
  const results: { element: string; type: string; passed: boolean; error?: string }[] = [];

  if (!spec.root || !spec.elements) {
    console.error('FAIL: spec missing root or elements');
    process.exit(1);
  }

  for (const [id, element] of Object.entries(spec.elements)) {
    const el = element as any;
    const elemType = el.type;
    const props = el.props || {};

    // 确定 schema type key
    const schemaType = props.type || elemType;
    const schema = typeToSchema[schemaType];

    if (!schema) {
      results.push({ element: id, type: elemType, passed: false, error: `No schema found for type "${schemaType}"` });
      continue;
    }

    try {
      schema.parse(props);
      results.push({ element: id, type: elemType, passed: true });
    } catch (e: any) {
      const issues = e.issues || [];
      const errorDetail = issues.map((i: any) =>
        `${i.path.join('.')}: ${i.message}`
      ).join('; ');
      results.push({ element: id, type: elemType, passed: false, error: errorDetail || e.message });
    }
  }

  // 输出结果
  console.log('\n=== Schema Validation Results ===');
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.element} (${r.type})${r.error ? ': ' + r.error : ''}`);
    if (!r.passed) allPassed = false;
  }

  console.log(`\n${results.length} elements, ${results.filter(r => r.passed).length} passed`);
  process.exit(allPassed ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
