# Vizual vNext Cold-Start Acceptance Guide

This guide is for testing whether an Agent that only knows the Vizual skill can use Vizual correctly in a host page. The Agent must behave like a real application Agent: read user input, choose the right Vizual runtime shape, render into the chat page, support follow-up edits, support live controls, support annotations, and export artifacts.

## Environment

Static server:

- Main chat test page: `http://127.0.0.1:8793/validation/vizual-test.html`
- Full component regression: `http://127.0.0.1:8793/validation/eval-full-31.html`
- DocView standalone fallback: `http://127.0.0.1:8793/validation/demo-docview.html`

Preferred browser target:

- Chrome DevTools Protocol: `http://127.0.0.1:9224`

The cold-start Agent should connect to the existing Chrome/CDP target when possible. Do not download or launch a separate Playwright browser unless the existing CDP target is unavailable.

## Cold-Start Rules For The Test Agent

The Agent being tested must follow these constraints:

1. It may read the installed Vizual skill only:
   - `~/.claude/skills/vizual/SKILL.md`
   - component references under `~/.claude/skills/vizual/references/`
2. It must not read Vizual repo source code, validation HTML source, prior QA reports, git history, or this implementation conversation.
3. It must interact with the browser page as a host Agent would, using Chrome DevTools, Playwright over CDP, or equivalent evaluate-script capability.
4. It must not simply paste raw JSON into the chat and call that success. The page must show rendered Vizual UI.
5. It must use page bridge APIs when the host page provides them.
6. It must preserve chat history. Follow-up edits should render a new AI bubble unless explicitly doing temporary preview/debug.
7. It must submit a QA report with evidence, including pass/fail, observed DOM/API state, console errors, and export results.

## One-Shot Prompt To Give Claude Code

Paste this into a fresh Claude Code session:

```text
You are a cold-start QA Agent for Vizual.

Rules:
- You have no prior context about Vizual except the installed skill.
- First read ~/.claude/skills/vizual/SKILL.md.
- Only read referenced files under ~/.claude/skills/vizual/references/ when needed.
- Do not read the Vizual repo source, validation HTML source, git history, previous QA reports, or any implementation conversation.
- Use Chrome DevTools MCP or Playwright connected to the existing browser/CDP target if available: http://127.0.0.1:9224.
- Test this page: http://127.0.0.1:8793/validation/vizual-test.html?cold-start-claude=<timestamp>
- Also test: http://127.0.0.1:8793/validation/eval-full-31.html?cold-start-claude=<timestamp>

Your job:
1. Behave like an Agent embedded in a SaaS/chat product that uses Vizual as its rendering runtime.
2. Use the Vizual skill to decide when to render a static spec, an editable artifact, an interactive bridge, or DocView.
3. Complete all scenarios in this acceptance guide.
4. Do not mark a scenario PASS unless the page visibly renders the correct UI and the host debug APIs confirm the expected state.
5. Write a Markdown report with:
   - scenario id
   - user prompt
   - actions you took
   - APIs used
   - observed result
   - pass/fail
   - screenshots or DOM/debug evidence
   - console errors
   - export filenames/links where applicable

Important host APIs:
- window.getPendingMessage()
- window.createAiMsg()
- window.streamText(id, text)
- window.finishText(id)
- window.renderVizInMsg(id, spec, options?)
- window.renderArtifactInMsg(id, artifact, options?)
- window.updateArtifactInMsg(ref, patches, options?)
- window.renderInteractiveVizInMsg(id, config)
- window.updateInteractiveVizInMsg(ref, patch, options?)
- window.getInteractiveVizState(ref?)
- window.renderDocViewInMsg(id, config)
- window.getVizualConversationState()
- window.getVizualDebugState()
- window.getLastArtifact()
- window.exportArtifact(ref, options)

Do not rely on brittle selectors like .message. Prefer getVizualConversationState() and getVizualDebugState(). If DOM inspection is needed, use data-message-row, data-ai-msg, data-user-msg, data-viz-container, and data-artifact-id.
```

## Required QA Scenarios

### S0. Host Readiness

Open `vizual-test.html`.

Pass criteria:

- Page loads without console errors.
- `window.Vizual` exists.
- `window.renderVizInMsg` exists.
- `window.updateArtifactInMsg` exists.
- `window.renderInteractiveVizInMsg` exists.
- `window.getVizualConversationState` exists.
- `window.getVizualDebugState` exists.

Useful check:

```js
({
  vizual: !!window.Vizual,
  renderVizInMsg: typeof window.renderVizInMsg,
  updateArtifactInMsg: typeof window.updateArtifactInMsg,
  renderInteractiveVizInMsg: typeof window.renderInteractiveVizInMsg,
  getVizualConversationState: typeof window.getVizualConversationState,
  getVizualDebugState: typeof window.getVizualDebugState,
});
```

### S1. Messy User Input To Static Dashboard

User prompt:

```text
帮我把下面这段乱格式数据做成一个增长分析 dashboard，要有核心指标、趋势图、结构洞察和明细表。

日期    区域   新增用户 active revenue churn ai内容占比
D1 华东 120  980  12000 20  10%
D2 华东 150  1120 13800 22  15%
D3 华东 180  1280 15500 26  20%
D4 华东 210  1450 17300 31  25%
D5 华东 240  1580 18800 38  30%
D6 华东 260  1660 19700 48  35%
D7 华东 275  1690 20100 62  40%
D8 华东 255  1610 19400 78  48%
D9 华东 230  1490 18100 96  55%
D10 华东 205 1360 16600 115 62%
D11 华东 180 1240 15300 132 68%
D12 华东 165 1160 14600 145 72%

注意：不要只复述数据，要指出可能的虚假相关、混杂变量、用户筛选效应。
```

Expected Agent behavior:

- Read relevant references: `GridLayout`, `KpiDashboard`, `ComboChart`, `ScatterChart` or `LineChart`, `DataTable`.
- Use `renderVizInMsg()` or `renderArtifactInMsg()` in a new AI bubble.
- Include narrative text outside the visual bubble.
- Do not choose DocView only because the word "dashboard" appears.
- Do not output raw JSON as the final user-visible result.

Pass criteria:

- New AI bubble appears.
- Bubble contains rendered Vizual UI.
- Dashboard has KPI cards, at least one trend/ComboChart, a relationship chart, and DataTable.
- Analysis mentions:
  - D5-D7 slope/turning-point behavior
  - D7/D8 phase change
  - AI ratio vs churn is correlation, not proven causation
  - possible time trend confounder
  - possible selection effect if ARPPU rises while active users fall
- `getVizualConversationState()` shows at least one AI message with `hasViz: true`.
- `getLastArtifact()` exists and has a target map or editable artifact state.

### S2. Historical Follow-Up Must Create New Bubble

After S1, send follow-up:

```text
把刚才的 dashboard 里主趋势图改成折线图，只看华东区，数据点少一点，然后导出 PDF 和 XLSX。
```

Expected Agent behavior:

- Use `getLastArtifact()` rather than regenerating from memory.
- Use `updateArtifactInMsg()` with typed patches such as `changeChartType`, `filterData`, `limitData`, or `updateElementProps`.
- Generate a new AI bubble by default.
- Export via `exportArtifact()`.

Pass criteria:

- AI message count increases.
- Old artifact/bubble remains visible and unchanged.
- New bubble contains modified chart.
- Chart is line-based or otherwise correctly reflects the requested line transformation.
- Data is filtered to 华东.
- Data points are reduced.
- PDF and XLSX export complete and return usable links/records.
- No `Invalid Vizual artifact` error appears.

Useful check:

```js
const before = window.getVizualConversationState();
// perform follow-up flow
const after = window.getVizualConversationState();
after.messages.filter(m => m.role === 'ai').length > before.messages.filter(m => m.role === 'ai').length;
```

### S3. Container Fit And Bubble Width

Use the S1/S2 charts and inspect layout.

Pass criteria:

- Chart content is horizontally centered or fills the available visual area cleanly.
- No obvious right-side dead padding caused by fixed width.
- Bubble uses reasonable width:
  - ordinary chart: wide
  - full dashboard/layout/table/doc: full
  - small KPI/sparkline: normal/compact if appropriate
- `.viz-wrap` must not force every artifact into a fixed 400px minimum layout.
- Sankey/Radar/FormBuilder are not clipped in normal desktop viewport.

### S4. ComboChart Multi-Series Regression

User prompt:

```text
做一个收入与 ARPPU 的组合图：左轴 revenue，右轴 ARPPU，revenue 用柱状，ARPPU 用折线。不要让第二条线变成 0。

数据：
D1 revenue=12000 paying=300
D2 revenue=13800 paying=320
D3 revenue=15500 paying=340
D4 revenue=17300 paying=360
D5 revenue=18800 paying=370
D6 revenue=19700 paying=365
D7 revenue=20100 paying=350
D8 revenue=19400 paying=320
D9 revenue=18100 paying=285
D10 revenue=16600 paying=245
```

Expected calculation:

- `ARPPU = revenue / paying`

Pass criteria:

- ComboChart renders.
- Second series is not all zeros.
- Tooltip/series values show ARPPU around 40-68, not 0.
- Axis choice is sensible and readable.

### S5. Interactive Controls With Compatible Options

User prompt:

```text
做一个可以实时调参的图表：左边是控制面板，右边是预览。
控制项：
1. 数据点数量 3-15
2. 图表类型：柱状图、折线图、组合图
3. 平滑折线，只在折线图和组合图时有意义
4. 堆叠模式，只在柱状图时有意义
5. 品牌主色

要求控件改动后右边立即变化。不要出现和当前图表类型不兼容的选项误导用户。
```

Expected Agent behavior:

- Use `renderInteractiveVizInMsg(id, config)`.
- Use FormBuilder with `value: { "$bindState": "/controls" }`.
- Use `makeSpec(state)` to regenerate preview.
- Use conditional visibility or disabled logic for incompatible controls.
- Use `applyTheme` or `Vizual.loadDesignMd()` for brand color.

Pass criteria:

- Left side controls render.
- Right side preview renders.
- Slider changes data point count.
- Changing chart type changes preview component or chart config.
- Smooth option only affects line/combo.
- Stacked option only affects bar.
- Brand color change updates the chart theme/color.
- `getInteractiveVizState()` shows current controls and `lastPreviewSpec`.

Stable programmatic test:

```js
const state0 = window.getInteractiveVizState('last');
window.updateInteractiveVizInMsg('last', {
  controls: { points: 9, chartType: 'line', smooth: true, brandColor: '#123456' }
}, { immediate: true });
const state1 = window.getInteractiveVizState('last');
({
  controls: state1.state.controls,
  previewType: state1.lastPreviewSpec?.elements?.chart?.type || state1.lastPreviewSpec?.type,
});
```

### S6. Brand Color And Design.md Contract

User prompt:

```text
把这个 dashboard 套成品牌视觉：主色 #FF6B35，深色背景，不要只改 theme 字段。之后让我可以用颜色选择器实时改主色。
```

Expected Agent behavior:

- Use `Vizual.loadDesignMd()` or interactive `applyTheme`.
- Do not misuse chart `theme` as brand color injection.
- `theme: "dark"` / `theme: "light"` is only preset theme selection.

Pass criteria:

- Initial brand color is visible.
- Changing color picker changes visible chart color.
- Debug state shows interactive state or theme state reflects selected brand color.

### S7. DocView Should Be Used Only For Reviewable Documents

Prompt A:

```text
给我做一个普通的经营分析 dashboard。
```

Pass criteria:

- Agent should not use DocView.
- It should use normal chat text plus GridLayout/charts/tables.

Prompt B:

```text
把刚才的分析变成一份可以批注、可以让 AI 根据批注修订的报告。
```

Pass criteria:

- Agent should now use DocView.
- `showPanel: true`.
- Important sections have stable ids.
- Sections include heading/text/kpi/chart/table/markdown as appropriate.
- It uses `renderDocViewInMsg()` if testing inside `vizual-test.html`.

### S8. DocView Annotation And Revision Loop

In the DocView from S7, select this kind of paragraph:

```text
下一步行动：对 AI 占比 30% vs 40% 做为期 7 天的 A/B 对照实验；分群分析流失用户画像；监控用户内容反馈 NPS。
```

Add annotation:

```text
写详细一点，给出负责人、优先级、验收指标。
```

Expected Agent behavior:

- Annotation is submitted with section/target metadata.
- It is not orphaned if the selected text belongs to a section.
- Agent reads the submitted annotation thread.
- Agent proposes or applies a revision.
- Revision updates the DocView content.

Pass criteria:

- Annotation can be submitted.
- It appears in the panel with selected text and target context.
- Revision produces updated detailed text.
- Old highlight/annotation marker does not pollute the revised content.
- If render fails, error message has a visible background and actionable text.

### S9. Export Surfaces

Test exports from a normal chart/dashboard and a DocView artifact.

Required formats:

- PNG
- PDF
- CSV
- XLSX

Pass criteria:

- Exports return usable links or records.
- PNG/PDF include the rendered visual surface.
- PDF should not have large unexplained top/bottom white margins.
- CSV/XLSX contain the underlying rows/columns when tabular data exists.
- Exporting should not mutate the original artifact content.

### S10. Error Handling

Force an invalid artifact or invalid spec during QA, then observe UI.

Pass criteria:

- Error is visible and has a clear background.
- Error text says what failed.
- Page does not crash.
- Later valid renders still work.

### S11. Full 31-Component Regression

Open:

```text
http://127.0.0.1:8793/validation/eval-full-31.html?cold-start=<timestamp>
```

Pass criteria:

- Header shows `31 PASS`, `0 FAIL`, `0 PENDING`.
- MermaidDiagram is not blank.
- HeatmapChart has meaningful non-zero color/value variation.
- CalendarChart is visually compatible with dark UI and not an accidental white block.
- ComboChart second series is not a zero line.
- No console errors.

### S12. Host API Robustness

The Agent should inspect host state via APIs instead of fragile DOM scraping.

Pass criteria:

- Uses `getVizualConversationState()` for message/artifact state.
- Uses `getVizualDebugState()` for runtime/debug state.
- Uses `getPendingMessage()` for raw pasted user input.
- Does not rely on `.message`, `.bubble`, or innerText scraping when a host API exists.

## Negative Tests

The Agent should explicitly avoid these mistakes:

- Do not use `InteractivePlayground`; it was removed.
- Do not mention LiveKit for Vizual interaction.
- Do not use DocView just because the user says "report".
- Do not mutate old chat bubbles for historical follow-up edits.
- Do not assume a raw JSON spec is enough for live interactivity.
- Do not use `theme` as a brand color injection mechanism.
- Do not expose controls that make no sense for the current chart.
- Do not produce an all-zero secondary ComboChart series.
- Do not leave empty Mermaid/Heatmap/Calendar visuals and call them PASS.

## Required Final QA Report Format

The cold-start Agent should save a report like:

```markdown
# Vizual Cold-Start QA Report

Target page:
Skill files read:
Browser/CDP target:
Date/time:

## Summary

| Result | Count |
| --- | ---: |
| PASS | |
| FAIL | |
| SKIP | |

## Scenarios

| ID | Scenario | Result | Evidence |
| --- | --- | --- | --- |
| S0 | Host readiness | PASS/FAIL | |

## Findings

### F1. Title

- Severity:
- Scenario:
- Repro:
- Expected:
- Actual:
- Evidence:
- Suspected owner: skill / host bridge / runtime component / test script

## Console Errors

## Export Records

## Screenshots
```

## Stop/Success Standard

The vNext cold-start acceptance is considered successful only if:

- S0-S12 are all PASS, or any SKIP is justified by missing browser capability rather than Vizual behavior.
- No P0/P1 findings remain.
- Follow-up edits create new bubbles.
- Interactive controls update preview and state.
- DocView annotation/revision loop works.
- Exports work for at least one chart/dashboard artifact and one DocView artifact.
- eval-full-31 shows 31 PASS.

