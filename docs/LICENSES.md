# 开源许可证说明 — AI RenderKit

## 项目许可证

**AI RenderKit** 使用 **MIT License** 发布。

这意味着你可以：
- ✅ 商业使用
- ✅ 修改代码
- ✅ 分发
- ✅ 私人使用
- ✅ 合并/集成到其他项目

唯一要求：保留原始版权声明和许可证文本。

---

## 依赖许可证清单

### 直接依赖

| 包名 | 版本 | 许可证 | 商用 | 说明 |
|------|------|--------|------|------|
| zod | ^3.25.0 | MIT | ✅ | Schema 校验 |
| echarts | ^5.6.0 | Apache-2.0 | ✅ | 图表引擎 |
| mviz | ^1.6.4 | MIT | ✅ | Chart option builder |
| @json-render/core | ^0.17.0 | Apache-2.0 | ✅ | Catalog 注册 |
| @json-render/react | ^0.17.0 | Apache-2.0 | Registry + Renderer |

### Peer 依赖

| 包名 | 版本 | 许可证 | 商用 | 说明 |
|------|------|--------|------|------|
| react | >=18 | MIT | ✅ | UI 框架（宿主提供） |
| react-dom | >=18 | MIT | ✅ | DOM 渲染（宿主提供） |

### 间接依赖（mviz/echarts 自带）

| 包名 | 许可证 | 商用 | 说明 |
|------|--------|------|------|
| mermaid | MIT | ✅ | MermaidDiagram 组件的可选依赖 |
| elkjs | EPL-2.0 | ✅ | mermaid 内部使用，用于自动布局 |

---

## EPL-2.0 特别说明

elkjs（Eclipse Public License 2.0）是 mermaid 的间接依赖，用于图表自动布局。

EPL-2.0 **允许商业使用**，要求：
1. 保留原始版权声明
2. 如果修改了 elkjs 源码并分发，需要开源修改部分
3. **仅使用（不修改源码）不需要开源你的项目**

如果你使用了 MermaidDiagram 组件，建议在项目根目录包含以下 NOTICE：

```
NOTICE:

This product includes software developed by the Eclipse IDE project
(https://www.eclipse.org/). Specifically, the ELK layout algorithm
library (elkjs) is used via mermaid for automatic diagram layout.

elkjs is licensed under the Eclipse Public License 2.0 (EPL-2.0).
Source: https://github.com/kieler/elkjs
```

如果你不使用 MermaidDiagram 组件，elkjs 不会被加载，无需关注此项。

---

## 许可证兼容性总结

```
MIT ──────────── 最宽松，可与其他许可证合并
  ├── zod
  ├── mviz
  ├── react
  └── mermaid

Apache-2.0 ───── 宽松，允许商用，需保留 NOTICE
  ├── echarts
  ├── @json-render/core
  └── @json-render/react

EPL-2.0 ──────── 允许商用，修改源码需开源
  └── elkjs (mermaid 间接依赖)
```

**结论：AI RenderKit 及其所有依赖均允许商业使用。** 没有 GPL/AGPL 等传染性许可证。

---

## 第三方许可证原文

以下列出各依赖的许可证信息，供法律合规使用。

### MIT License 适用范围

zod, mviz, react, react-dom, mermaid

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

### Apache-2.0 License 适用范围

echarts, @json-render/core, @json-render/react

```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
