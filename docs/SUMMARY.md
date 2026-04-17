# Vizual — 文档目录

## 项目文档

| 文档 | 说明 |
|------|------|
| [README.md](../README.md) | 项目概览、快速开始、AI 接入方式、42 组件一览 |
| [INSTALL.md](../INSTALL.md) | **安装指南** — NPM / CDN / AI Prompt 三种方式 |
| [GETTING-STARTED.md](GETTING-STARTED.md) | 开发者快速上手指南（安装、使用、FAQ） |
| [COMPONENTS.md](COMPONENTS.md) | 42 个组件完整参考（Schema、Props、示例） |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 架构设计、数据流、源码结构、依赖关系图 |
| [AI-INTEGRATION.md](AI-INTEGRATION.md) | AI 集成指南（Claude/GPT 接入、流式输出） |
| [LICENSES.md](LICENSES.md) | 开源许可证说明、依赖合规 |

## Skill（AI Agent 接入）

| 文件 | 适用场景 | 说明 |
|------|---------|------|
| [skill/SKILL.md](../skill/SKILL.md) | Claude Code Agent | Skill 主文件，自动触发 |
| [skill/references/component-catalog.md](../skill/references/component-catalog.md) | Skill 内部引用 | 43 组件完整 Schema |
| [skill/references/recipes.md](../skill/references/recipes.md) | Skill 内部引用 | 组合模式模板 |
| [skill/scripts/validate-spec.js](../skill/scripts/validate-spec.js) | 开发/CI | JSON spec 校验工具 |

**注意**：Vizual 专为 AI Agent 设计，不支持 ChatGPT / Claude.ai 等聊天机器人场景。

## Demo

| 文件 | 说明 |
|------|------|
| `validation/test-all-42.html` | 42 个组件完整展示（浏览器直接打开） |
| `validation/demo-streaming.html` | 模拟 LLM 对话流式输出 |

## 项目目录结构

```
vizual/
├── README.md                   项目说明
├── package.json                npm 包配置
├── src/                        源码
│   ├── index.ts                入口
│   ├── catalog.ts              defineCatalog — 42 组件注册（19 图表 + 8 UI + 11 业务 + 4 交互输入）
│   ├── registry.tsx            defineRegistry — type → React 映射
│   ├── mviz-bridge/            mviz 桥接 (27 组件)
│   │   ├── bar-chart/          柱状图（参考实现）
│   │   ├── area~radar/         19 个图表 bridge
│   │   ├── big-value~table/    8 个 UI bridge
│   │   └── mermaid/            Mermaid 流程图
│   ├── components/             自定义业务组件 (11)
│   │   ├── timeline~form-view/
│   │   └── ...
│   ├── inputs/                 交互输入组件 (4)
│   │   ├── InputText/
│   │   ├── InputSelect/
│   │   ├── InputFile/
│   │   └── FormBuilder/
│   └── core/                   共享工具
│       ├── echarts-wrapper.tsx
│       └── echarts-bridge-factory.tsx
├── dist/                       构建产物
│   ├── index.mjs               ESM 760KB
│   ├── index.js                CJS 766KB
│   └── index.d.ts              TypeScript 声明
├── skill/                      AI 接入包
│   ├── SKILL.md                Claude Code Skill
│   ├── prompt.md               通用 LLM System Prompt
│   ├── references/             Schema 参考 & 组合模板
│   └── scripts/                校验工具
├── docs/                       项目文档
│   ├── SUMMARY.md              本文件（目录索引）
│   ├── GETTING-STARTED.md
│   ├── COMPONENTS.md
│   ├── ARCHITECTURE.md
│   ├── AI-INTEGRATION.md
│   └── LICENSES.md
├── validation/                 Demo & 测试
│   ├── test-all-42.html
│   └── demo-streaming.html
└── scripts/                    构建脚本
    ├── gen-bridges.ts
    ├── gen-ui-bridges.ts
    └── gen-business.ts
```

## 关键指标

- **组件数**: 42（19 图表 + 8 UI + 11 业务 + 4 交互输入）
- **构建产物**: ESM 760KB + CJS 766KB
- **AI Prompt**: ~22KB
- **Skill**: SKILL.md (194行) + prompt.md (自包含)
- **License**: MIT（开源可商用）
- **测试**: 5 passing
