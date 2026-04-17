# Requirements: Vizual v2.0 — DocView Native Integration

**Defined:** 2026-04-17
**Core Value:** AI outputs structured JSON → renders as interactive visualization or annotatable document, with bidirectional interaction support

## v2.0 Requirements

### Migration & Code Quality

- [x] **MIGR-01**: DocView 源码从 docview-pkg 合并到 vizual 的 src/docview/ 目录（10 个文件）
- [x] **MIGR-02**: 修复 annotation-overlay.tsx 中 require('react-highlight-words') 改为 static import
- [x] **MIGR-03**: 修复 extractText() 对复杂 React 树的文本提取能力
- [x] **MIGR-04**: 清理未使用的 import 和 prop（useRef、onContentRevised）

### Catalog & Registry

- [x] **CATL-01**: DocView 注册到 defineCatalog，AI 可通过 JSON spec 输出文档
- [x] **CATL-02**: DocView 的 Zod schema 定义文档结构（sections 含 text + 嵌入组件引用）
- [x] **CATL-03**: 批注相关 actions（requestRevision、batchSubmit）注册到 catalog
- [x] **CATL-04**: DocView 注册到 defineRegistry，Renderer 可渲染 DocView 类型

### Annotation Core

- [ ] **ANNO-01**: 用户可选中文本内容添加批注（弹窗输入笔记 + 6 色选择）
- [ ] **ANNO-02**: 批注高亮在文档中以对应颜色 mark 显示（AnnotationOverlay + react-highlight-words）
- [ ] **ANNO-03**: 多粒度批注支持 — 点击图表数据点、KPI 卡片、表格单元格添加批注
- [ ] **ANNO-04**: AnnotationPanel 侧边面板展示批注列表（颜色点 + 状态 + 时间 + 操作按钮）
- [ ] **ANNO-05**: 批注生命周期管理 — draft → active → resolved / orphaned 状态流转
- [ ] **ANNO-06**: 批量提交所有 draft 批注为 active（batchSubmit 按钮）

### AI Revision Loop

- [ ] **REV-01**: 批注提交后通过 onAction 回调触发外部 AI 修订流程
- [ ] **REV-02**: 内容刷新后检测 orphaned 批注（文本已被 AI 修改）
- [ ] **REV-03**: useRevisionLoop hook 导出（submitAllDrafts、requestRevision、onContentRevised）

### Hooks & Custom Integration

- [ ] **HOOK-01**: useAnnotations hook 导出 — 批注 CRUD + markOrphans
- [ ] **HOOK-02**: useTextSelection hook 导出 — 浏览器文本选中检测
- [ ] **HOOK-03**: useVersionHistory hook 导出 — 文档版本快照与回滚
- [ ] **HOOK-04**: 所有 hooks 支持受控（controlled）和非受控（uncontrolled）两种模式

### Build & Distribution

- [x] **BLD-01**: react-highlight-words ^0.20.0 加入 package.json dependencies
- [ ] **BLD-02**: src/index.ts 和 src/cdn-entry.ts 导出 DocView + 子组件 + hooks（修复 cdn-entry 缺少 4 个 input 组件的 drift）
- [ ] **BLD-03**: 所有 4 种构建产物包含 DocView（ESM + CJS + CDN + Standalone）

### AI Prompt & Skill

- [ ] **AIPR-01**: skill/prompt.md 添加 DocView 组件文档和 JSON spec 示例
- [ ] **AIPR-02**: skill/references/component-catalog.md 和 skill/scripts/validate-spec.js 更新

### Validation & Documentation

- [ ] **VAL-01**: demo-docview.html 迁移到 vizual validation/ 目录，改用 vizual CDN 构建
- [ ] **VAL-02**: README.md 和 docs/COMPONENTS.md 更新包含 DocView 说明

## v3 Requirements (Deferred)

### PPTView

- **PPTV-01**: PPTView 基于 vizual 扩展，AI 输出 JSON 渲染为幻灯片
- **PPTV-02**: 复用 vizual 全部组件（图表、表单、文档）

### Advanced DocView

- **ADOC-01**: 多人实时协作批注（WebSocket + CRDT）
- **ADOC-02**: 批注权限管理
- **ADOC-03**: 批注导出（PDF/Word）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 多人实时协作 | MVP 只做单人批注，协作需要 WebSocket + CRDT |
| 权限系统 | 批注权限管理是协作场景的需求，MVP 不涉及 |
| PPTView | 已记录想法，属于独立 milestone |
| 自研文本高亮 | react-highlight-words 已满足需求，5KB gzip 可接受 |
| 文档导出 | PDF/Word 导出属于内容生产流水线，不是渲染库职责 |
| 预览模式（accept/reject diff） | 复杂度高，v3 再考虑 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MIGR-01 | Phase 5 | Complete |
| MIGR-02 | Phase 5 | Complete |
| MIGR-03 | Phase 5 | Complete |
| MIGR-04 | Phase 5 | Complete |
| CATL-01 | Phase 5 | Complete |
| CATL-02 | Phase 5 | Complete |
| CATL-03 | Phase 5 | Complete |
| CATL-04 | Phase 5 | Complete |
| BLD-01 | Phase 5 | Complete |
| ANNO-01 | Phase 6 | Pending |
| ANNO-02 | Phase 6 | Pending |
| ANNO-03 | Phase 6 | Pending |
| ANNO-04 | Phase 6 | Pending |
| ANNO-05 | Phase 6 | Pending |
| ANNO-06 | Phase 6 | Pending |
| HOOK-01 | Phase 6 | Pending |
| HOOK-02 | Phase 6 | Pending |
| HOOK-03 | Phase 6 | Pending |
| HOOK-04 | Phase 6 | Pending |
| REV-01 | Phase 7 | Pending |
| REV-02 | Phase 7 | Pending |
| REV-03 | Phase 7 | Pending |
| BLD-02 | Phase 7 | Pending |
| BLD-03 | Phase 7 | Pending |
| AIPR-01 | Phase 7 | Pending |
| AIPR-02 | Phase 7 | Pending |
| VAL-01 | Phase 7 | Pending |
| VAL-02 | Phase 7 | Pending |

**Coverage:**
- v2.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-04-17*
*Last updated: 2026-04-17 after roadmap creation*
