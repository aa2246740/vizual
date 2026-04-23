# Session State — 2026/04/23

## 正在做的事

**合并 LiveKit → Vizual，删除 InteractivePlayground 组件**

用户希望 Vizual skill 支持类似 Claude Design Tweaks 面板的体验（生成 HTML + 实时控件）。LiveKit 的 theme-level 能力合并进 vizual skill，InteractivePlayground 组件删除（用直接 HTML 控件替代）。

## 已完成

- 4 个 skill 重写完成（vizual v3.0 / livekit v2.0 / design-md-parser v2.0 / design-md-creator v2.0）
- 已推送到 GitHub (commit 94fb1b0)
- 已同步到 ~/.claude/skills/

## 进行中的计划

计划文件：`/Users/wu/.claude/plans/staged-watching-coral.md`（已获批准）

**实现步骤：**

1. **重写 vizual SKILL.md**（Task #5 进行中）
   - 增加 HTML 输出模式触发词和规则
   - 移除 InteractivePlayground 相关内容
   - 增加"用 HTML 控件替代 InteractivePlayground"的反模式

2. **创建 `skills/vizual/references/theme-preview.html`**（Task #6）
   - 把 livekit theme-level.md 改写成 HTML 模板
   - 包含：预设主题按钮 + accent 色选择器 + 暗/亮 toggle + 调色板 + 组件网格
   - 调用 `Vizual.setGlobalTheme()` / `renderSpec()` 等 API

3. **删除 InteractivePlayground 组件**（Task #7）
   - 删除 `src/components/interactive-playground/` 目录
   - 从 `catalog.ts` 移除 InteractivePlaygroundSchema
   - 从 `registry.tsx` 移除 InteractivePlayground
   - 从 `index.ts` 移除导出
   - 从 `cdn-entry.ts` 移除导出

4. **删除 livekit skill**（Task #8）
   - `ai-renderkit-pkg/skills/livekit/` 目录
   - `~/.claude/skills/livekit/` 目录

5. **更新 design-md-parser 和 design-md-creator**（Task #8）
   - 把 "combine with livekit" 改为 "Vizual handles theme-level previews natively"

6. **构建 + 推送**（Task #9）

## 关键文件引用

### Skill 文档（只读）
- `SKILL.md` 内容已知（之前 Read 过）
- `livekit/theme-level.md` 已读，模板内容已掌握
- `vizual/component-catalog.md` 已读
- `vizual/recipes.md` 不存在（skills/vizual/ 下没有 recipes.md）

### 源码文件（需要修改）
- `/Users/wu/Documents/renderKit/ai-renderkit-pkg/src/catalog.ts` — line 43-44 有 InteractivePlaygroundSchema import 和注册
- `/Users/wu/Documents/renderKit/ai-renderkit-pkg/src/registry.tsx` — line 43 有 import，line 71 有注册
- `/Users/wu/Documents/renderKit/ai-renderkit-pkg/src/index.ts` — line 68-69 有导出，line 82 有 cdn-entry
- `/Users/wu/Documents/renderKit/ai-renderkit-pkg/src/cdn-entry.ts` — line 82 有导出
- `skills/vizual/SKILL.md` — 需要重写
- `skills/design-md-parser/SKILL.md` — 需要更新 combining
- `skills/design-md-creator/SKILL.md` — 需要更新 combining

### 待删除文件
- `src/components/interactive-playground/` 整个目录
- `skills/livekit/` 整个目录
- `~/.claude/skills/livekit/` 整个目录

## 用户确认的决策

1. **HTML 文件命名**：由 agent 根据内容决定（不是固定模板名）
2. **InteractivePlayground**：删除，不保留（单组件调参也用 HTML 控件）

## 下一步

1. 继续 Task #5：重写 vizual SKILL.md
2. 创建 theme-preview.html 模板
3. 删除 InteractivePlayground 源码
4. 删除 livekit skill
5. 更新关联 skill
6. 构建测试 + 推送

## 冷启动测试现状

vizual skill 15/15 测试通过。但有一个已知问题：Test 14 的 agent 用 InteractivePlayground 生成 chartType 控件（无效 prop），是因为 skill 旧版 line 38 写 "like sliders, toggles, color pickers"（举例）agent 只读到这里没读 line 74 的完整列表。删除 InteractivePlayground 后这个问题自然解决。

## 仓库结构记忆

vizual 开源仓库 = `ai-renderkit-pkg/`。推代码 `cd ai-renderkit-pkg && git push`，不要再搞混。
