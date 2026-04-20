# 自定义 LiveKit — 万能骨架

当目标不是主题也不是单个组件时，用这个通用骨架。任何"调→看"场景都适用。

## 通用 LiveKit 模式

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LiveKit</title>
  <style>
    body { font-family: system-ui; padding: 20px; margin: 0;
           background: var(--rk-bg-primary,#0f0f1a); color: var(--rk-text-primary,#e0e0e0); }
    .controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .controls label { font-size: 12px; color: var(--rk-text-tertiary); }
    .preview { border: 1px solid var(--rk-border-subtle); border-radius: 8px;
               padding: 12px; min-height: 100px; }
  </style>
</head>
<body>
  <div class="controls" id="controls"></div>
  <div class="preview" id="preview"></div>

  <script src="../dist/vizual.standalone.js"></script>
  <script>
    var preview = document.getElementById('preview');
    var controls = document.getElementById('controls');

    // ── 在这里定义你的控件和渲染逻辑 ──

    // 例子：JSON 输入 → 实时 renderSpec
    var textarea = document.createElement('textarea');
    textarea.style.cssText = 'width:100%;height:200px;font-family:monospace;font-size:12px;padding:8px;border-radius:6px;border:1px solid var(--rk-border-subtle);background:var(--rk-bg-secondary);color:var(--rk-text-primary)';
    textarea.value = JSON.stringify({root:'m',elements:{m:{type:'BarChart',props:{title:'Test',x:'name',y:'value',data:[{name:'A',value:42},{name:'B',value:58}]},children:[]}}}, null, 2);
    controls.parentElement.insertBefore(textarea, preview);

    function render() {
      preview.innerHTML = '';
      try {
        var spec = JSON.parse(textarea.value);
        Vizual.renderSpec(spec, preview);
      } catch(e) {
        preview.innerHTML = '<div style="color:var(--rk-error);font-size:12px">Error: ' + e.message + '</div>';
      }
    }

    textarea.oninput = render;
    render();
  </script>
</body>
</html>
```

## 控件速查

### HTML 原生控件

| 需求 | 控件 | 代码 |
|------|------|------|
| 数值范围 | range | `<input type="range" min="0" max="100" step="1">` |
| 颜色 | color | `<input type="color" value="#667eea">` |
| 下拉选项 | select | `<select><option>A</option><option>B</option></select>` |
| 开关 | checkbox | `<input type="checkbox">` |
| 文本 | text | `<input type="text">` |
| 多行文本 | textarea | `<textarea></textarea>` |
| 数字 | number | `<input type="number" min="0" max="100">` |

### 绑定实时渲染的模式

```js
// 控件变化 → 重新渲染
control.oninput = function() { render(); };
// 或者
control.onchange = function() { render(); };
```

`oninput` 每次值变化都触发（适合 slider、text）。
`onchange` 值确认后触发（适合 select、color）。

### 渲染 vizual 组件

```js
function renderSpec(type, props, container) {
  container.innerHTML = '';
  try {
    Vizual.renderSpec({root:'m',elements:{m:{type:type,props:props,children:[]}}}, container);
  } catch(e) {
    container.innerHTML = '<div style="color:var(--rk-error);font-size:11px">Error: ' + e.message + '</div>';
  }
}
```

## 场景灵感

LiveKit 不限于以上模板，以下是更多可以用 LiveKit 的场景：

- **算法可视化**：调参数看算法输出变化（排序、聚类、插值等）
- **数据探索**：调筛选条件看数据子集的图表
- **布局实验**：调 grid/flex 参数看排版变化
- **配色方案**：调 accent 色看整套 UI 变化
- **字体排版**：调字号/行高/字重看文字效果
- **组件对比**：同数据不同组件类型并排看
- **数据量影响**：调数据点数看图表在不同密度下的表现
- **主题验证**：在多个主题间切换验证设计一致性
