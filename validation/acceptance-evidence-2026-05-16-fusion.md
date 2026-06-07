# Vizual Fusion Runtime 验收证据

日期：2026-05-16  
分支：`feature/a2ui-protocol`  
目标：AG-UI × A2UI × Vizual 统一运行时，真实 daemon/browser 全量覆盖测试。

## 结论

最新完整长测通过：

```text
/tmp/vizual-core-validation/od-daemon-real-agent-20260516-fusion-full-r2.json
pass: 4
fail: 0
```

## 覆盖场景

| 场景 | 结果 | 核心证据 |
|---|---:|---|
| OD1 dashboard | PASS | 3 张图、11 行表、KPI、DocView，overflow 0，blankBottomRatio 0.03 |
| OD2 follow-up/export | PASS | 折线图、9 行表，PDF success，XLSX success，XLSX rows 6 |
| OD3 A2UI interactions | PASS | 文本输入、滑块、下拉、复选框、Tabs、按钮真实操作成功 |
| OD4 DocView review | PASS | 10 个 sections，1 个 thread，1 个 proposal，revisionApplied |

## 关键修复

- 新增 `VizualFusionRuntime`，支持 A2UI messages、AG-UI activity snapshot/delta、tool result、state snapshot/delta、Vizual spec、artifact 和 QA finding。
- `A2UIBridge` 兼容入口委托到 `VizualFusionRuntime`。
- 移除隐藏布局门禁：不再按表单/图表/子元素数量自动改 GridLayout。
- daemon 不可用时不再展示固定 fallback 图表。
- 修复真实 Agent 的 `payload.data` dataModel 根路径兼容。
- 修复 `/report/sections/4/rows` 这类数组路径绑定。
- 修复复合 artifact 中嵌套 DocView 的 review controller 注册。
- `tcss()` 改为带 fallback 的 CSS var，保障 standalone 页面主题变量缺失时仍可见。

## 命令证据

```bash
npm test
# 35 files passed, 253 tests passed

npm run build
# ESM + CJS + types + standalone build passed

node validation/od-daemon-real-agent-runner.mjs \
  --base http://127.0.0.1:8794 \
  --run 20260516-fusion-full-r2 \
  --max-scenarios 4 \
  --reasoning medium
# pass 4 / fail 0
```

## 人工验收入口

```text
http://127.0.0.1:8794/validation/daemon-vizual-chat.html?fusion=20260516-full-r2
```

页面应显示：

```text
daemon 0.5.0 ready · Codex CLI codex-cli 0.130.0
```

人工验收时重点看：

- Agent 是否真实回复，不是固定样例。
- artifact 是否有足够信息密度、层级、留白和可读性。
- 图表、表格、KPI、DocView、A2UI 控件是否都显示。
- 输入、滑块、下拉、复选框、Tabs、按钮是否可操作。
- PDF/XLSX 导出是否成功。
- DocView 是否能创建批注、生成修订并应用。
- 失败时是否明确报错，而不是展示隐藏 fallback。
