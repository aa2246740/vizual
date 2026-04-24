#!/usr/bin/env python3
"""
Vizual Skill Eval Review Generator
Reads validation-results.json and generates a markdown comparison report.

Usage: python3 vizual-skill-workspace/generate_review.py [--html]
"""
import json
import sys
import os
from pathlib import Path

RESULTS_FILE = Path(__file__).parent / 'validation-results.json'
EVALS_FILE = Path(__file__).parent / 'evals' / 'evals.json'

def load_results():
    with open(RESULTS_FILE) as f:
        return json.load(f)

def load_evals():
    with open(EVALS_FILE) as f:
        return json.load(f)

def render_markdown(results, evals_data):
    evals_by_id = {e['id']: e for e in evals_data['evals']}

    lines = []
    lines.append('# Vizual Skill Eval — Iteration 1 Report')
    lines.append('')
    lines.append('## Summary')
    lines.append('')

    ws_pass = sum(1 for r in results if r['mode'] == 'with_skill' and r['overallPass'])
    wo_pass = sum(1 for r in results if r['mode'] == 'without_skill' and r['overallPass'])
    total = 6

    lines.append(f'| Metric | with_skill | without_skill | Delta |')
    lines.append(f'|--------|-----------|--------------|-------|')
    lines.append(f'| **Schema Pass** | {ws_pass}/{total} | {wo_pass}/{total} | {"+" if ws_pass - wo_pass >= 0 else ""}{ws_pass - wo_pass} |')

    ws_struct = sum(1 for r in results if r['mode'] == 'with_skill' and r['structuralPass'])
    wo_struct = sum(1 for r in results if r['mode'] == 'without_skill' and r['structuralPass'])
    lines.append(f'| **Structural Pass** | {ws_struct}/{total} | {wo_struct}/{total} | {"+" if ws_struct - wo_struct >= 0 else ""}{ws_struct - wo_struct} |')

    lines.append('')
    lines.append('## Per-Eval Results')
    lines.append('')

    eval_dirs = [
        ('eval-1-combo-chart', 1),
        ('eval-2-sales-dashboard', 2),
        ('eval-3-interactive-radar', 3),
        ('eval-4-sales-funnel', 4),
        ('eval-5-project-kanban', 5),
        ('eval-6-feedback-form', 6),
    ]

    for eval_dir, eval_id in eval_dirs:
        eval_info = evals_by_id.get(eval_id, {})
        prompt = eval_info.get('prompt', '')[:80] + '...' if eval_info else ''
        expected = eval_info.get('expected_output', '')[:80] + '...' if eval_info else ''

        ws = next((r for r in results if r['evalName'] == eval_dir and r['mode'] == 'with_skill'), None)
        wo = next((r for r in results if r['evalName'] == eval_dir and r['mode'] == 'without_skill'), None)

        lines.append(f'### Eval {eval_id}: {eval_dir.replace("eval-", "").replace("-", " ").title()}')
        lines.append('')
        lines.append(f'**Prompt:** {prompt}')
        lines.append('')
        lines.append(f'| Aspect | with_skill | without_skill |')
        lines.append(f'|--------|-----------|--------------|')

        ws_icon = '✅ PASS' if ws and ws['overallPass'] else '❌ FAIL'
        wo_icon = '✅ PASS' if wo and wo['overallPass'] else '❌ FAIL'
        lines.append(f'| **Overall** | {ws_icon} | {wo_icon} |')

        ws_s = '✅' if ws and ws['structuralPass'] else '❌'
        wo_s = '✅' if wo and wo['structuralPass'] else '❌'
        lines.append(f'| Structure | {ws_s} | {wo_s} |')

        # Element-level results
        ws_elem_str = 'N/A'
        wo_elem_str = 'N/A'
        if ws:
            ws_elem_count = len(ws['elements'])
            ws_elem_pass = sum(1 for e in ws['elements'] if e['passed'])
            ws_elem_str = f'{ws_elem_pass}/{ws_elem_count} pass'
        if wo:
            wo_elem_count = len(wo['elements'])
            wo_elem_pass = sum(1 for e in wo['elements'] if e['passed'])
            wo_elem_str = f'{wo_elem_pass}/{wo_elem_count} pass'
        lines.append(f'| Elements | {ws_elem_str} | {wo_elem_str} |')

        lines.append('')

        # Error details for failures
        for r in [ws, wo]:
            if r and not r['overallPass']:
                label = 'with_skill' if r['mode'] == 'with_skill' else 'without_skill'
                failures = [e for e in r['elements'] if not e['passed']]
                if failures:
                    lines.append(f'**{label} errors:**')
                    for f in failures[:5]:
                        lines.append(f'- `{f["id"]}` ({f["type"]}): {f["error"]}')
                    if len(failures) > 5:
                        lines.append(f'- ... and {len(failures) - 5} more errors')
                    lines.append('')

        lines.append('---')
        lines.append('')

    lines.append('## Common Failure Patterns (without_skill)')
    lines.append('')
    lines.append('1. **Wrong `type` literal**: Using PascalCase or wrong values in props.type (e.g., `"ComboChart"` instead of `"combo"`)')
    lines.append('2. **Wrong prop names**: Using non-existent props like `barSeries`/`lineSeries` instead of `y` array')
    lines.append('3. **Wrong element types**: Using non-existent elements like `KanbanColumn`, `KanbanCard`, `Flex`, `Badge`, `Text`')
    lines.append('4. **Wrong field types**: Using `TextInput` instead of `text`, `TextArea` instead of `textarea`')
    lines.append('5. **Missing required fields**: Forgetting `name` on form fields, `columns` on Kanban, `metrics` on KpiDashboard')
    lines.append('')
    lines.append('*Generated by generate_review.py*')

    return '\n'.join(lines)


def render_html(results, evals_data):
    md = render_markdown(results, evals_data)
    # Simple markdown to HTML
    html_lines = ['<!DOCTYPE html>', '<html><head><meta charset="utf-8"><title>Vizual Eval Report</title>',
                  '<style>body{font-family:system-ui;max-width:900px;margin:0 auto;padding:24px;background:#0f1117;color:#e2e8f0;}',
                  'table{border-collapse:collapse;width:100%;margin:12px 0;}th,td{border:1px solid #2d3148;padding:8px 12px;text-align:left;}',
                  'th{background:#1e293b;}code{background:#252836;padding:2px 6px;border-radius:4px;}',
                  'h2,h3{color:#667eea;}hr{border:none;border-top:1px solid #2d3148;}</style></head><body>']

    for line in md.split('\n'):
        if line.startswith('# '):
            html_lines.append(f'<h1>{line[2:]}</h1>')
        elif line.startswith('## '):
            html_lines.append(f'<h2>{line[3:]}</h2>')
        elif line.startswith('### '):
            html_lines.append(f'<h3>{line[4:]}</h3>')
        elif line.startswith('| ') and '---' not in line:
            cells = [c.strip() for c in line.split('|')[1:-1]]
            row = ''.join(f'<td>{c}</td>' for c in cells)
            html_lines.append(f'<tr>{row}</tr>')
        elif line.startswith('|---'):
            pass  # skip separator
        elif line.startswith('- '):
            html_lines.append(f'<li>{line[2:]}</li>')
        elif line.startswith('**') and line.endswith('**'):
            html_lines.append(f'<p><strong>{line[2:-2]}</strong></p>')
        elif line == '---':
            html_lines.append('<hr>')
        elif line.strip():
            html_lines.append(f'<p>{line}</p>')

    html_lines.append('</body></html>')
    return '\n'.join(html_lines)


def main():
    if not RESULTS_FILE.exists():
        print(f'Error: {RESULTS_FILE} not found. Run validate-standalone.ts first.')
        sys.exit(1)

    results = load_results()
    evals_data = load_evals()

    use_html = '--html' in sys.argv

    if use_html:
        output = render_html(results, evals_data)
        out_path = Path(__file__).parent / 'review.html'
    else:
        output = render_markdown(results, evals_data)
        out_path = Path(__file__).parent / 'review.md'

    with open(out_path, 'w') as f:
        f.write(output)

    print(output)
    print(f'\n---\nWritten to: {out_path}')


if __name__ == '__main__':
    main()
