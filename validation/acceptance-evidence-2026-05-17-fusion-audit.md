# Vizual Fusion Runtime 复审验收证据

日期：2026-05-17  
分支：`feature/a2ui-protocol`  
目标：复审当前 Fusion 方案里仍可能造假的路径，修复后用真实浏览器、真实 daemon、真实页面输入再跑一轮。

## 结论

本轮最终通过：

```text
npm test: 35 files passed, 256 tests passed
npm run build: ESM + CJS + types + standalone build passed

/tmp/vizual-core-validation/browser-acceptance-20260517-fusion-audit-r1.json
coldStart: 14 pass / 0 fail
fusionRuntimeAGUI: ok true
a2uiFull: 28 pass / 0 fail
adversarial: 20 pass / 0 fail
full31: 31 pass / 0 fail

/tmp/vizual-core-validation/od-daemon-real-agent-20260517-fusion-audit-full-r2.json
daemon real agent: 4 pass / 0 fail

/tmp/vizual-core-validation/daemon-chat-page-20260517-daemon-chat-page-r3.json
daemon chat page: ok true
```

## 本轮先失败后修复的问题

1. `A2UIBridge` 仍保留旧私有实现。  
   修复：改成薄兼容外壳，状态、A2UI、AG-UI、artifact、action 全部委托 `VizualFusionRuntime`。

2. `VizualFusionRuntime.process()` 会把 `{ type: "createSurface" }` 这类宽松 A2UI 消息误判成普通 AG-UI 事件。  
   修复：先识别 A2UI 消息，再进入通用 AG-UI event 分支。

3. dataModel nested array 写入不完整。  
   修复：`/report/sections/1/rows`、`/rows/1/revenue` 这类路径现在能穿过数组写入，不会把数组覆盖成对象。

4. 真实 Agent 曾用 4 行阶段汇总表冒充逐日明细。  
   修复：daemon 验收 prompt 和 raw/browser audit 收紧，要求逐日明细保留原始行数据。

5. 真实 Agent 曾把多个 card 直接塞进 12 列 `GridLayout`，导致页面竖排、窄列、overflow。  
   修复：验收 prompt 和 raw audit 增加布局质量约束：root 优先 `Column`，宽列 `GridLayout` 必须给直接子项明确 `colSpan/gridColumn`，长文本/DataTable/DocView 必须全宽。

6. 用户可见 `daemon-vizual-chat.html` 页面在 `renderSpec()` 后立即做视觉 QA，React 还没 commit 时会误报 `blank-render`。  
   修复：等待浏览器渲染帧和真实 DOM 内容后再审计。

7. 聊天页渲染容器缺少统一可审计标记。  
   修复：渲染目标增加 `data-viz-container="true"`、`data-fusion-surface-id`、`data-vizual-surface-id`。

## 真实浏览器证据

```text
/tmp/vizual-core-validation/fusion-runtime-agui-20260517-fusion-audit-r1.png
/tmp/vizual-core-validation/od-daemon-real-agent-20260517-fusion-audit-full-r2-OD1-daemon-dashboard.png
/tmp/vizual-core-validation/od-daemon-real-agent-20260517-fusion-audit-full-r2-OD2-daemon-followup-export.png
/tmp/vizual-core-validation/od-daemon-real-agent-20260517-fusion-audit-full-r2-OD3-daemon-a2ui-interactions.png
/tmp/vizual-core-validation/od-daemon-real-agent-20260517-fusion-audit-full-r2-OD4-daemon-docview-review.png
/tmp/vizual-core-validation/daemon-chat-page-20260517-daemon-chat-page-r3.png
```

## 最新人工验收入口

```text
http://127.0.0.1:8794/validation/daemon-vizual-chat.html?final-audit=20260517-fusion-full-r2
```

页面应显示：

```text
daemon 0.5.0 ready · Codex CLI codex-cli 0.130.0
```

## 可复跑命令

```bash
cd /Users/wu/Documents/vizual-research/vizual-compare

npm test
npm run build

node validation/cdp-browser-acceptance.mjs \
  --base http://127.0.0.1:8794 \
  --run 20260517-fusion-audit-r1 \
  --port 9361 \
  --headless true

node validation/od-daemon-real-agent-runner.mjs \
  --base http://127.0.0.1:8794 \
  --run 20260517-fusion-audit-full-r2 \
  --max-scenarios 4 \
  --reasoning medium

node validation/daemon-chat-page-cdp-acceptance.mjs \
  --base http://127.0.0.1:8794 \
  --run 20260517-daemon-chat-page-r3 \
  --headless true
```

## 剩余边界

- 不能声称数学意义的 100%。真实 Agent 输出仍有随机性，所以验收必须保留 raw audit、browser audit 和页面级 QA。
- Codex in-app browser 在等待长 daemon 回复时触发过 120 秒 browser bridge timeout；本轮最终证据使用真实 Chrome/CDP 完成页面输入、点击、等待和截图。
- 当前分支仍应留在 `feature/a2ui-protocol`，不要合入主分支，直到人工验收确认。
