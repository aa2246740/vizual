# 主题级 LiveKit — 主题试衣页面

生成独立 HTML 页面，用户可以切换主题、调数据量、切暗亮模式，所有组件实时响应。

## 页面结构

```
控件栏:  [主题A] [主题B] [主题C] [自定义色] | 数据量: [3/6/12] | 暗/亮切换
调色板:  ■ #c8152d  ■ #2d8fc8  ■ #52c77  ...
变量显示: accent=#c8152d  radius-md=8px  space-4=16px
组件网格:  PieChart  BarChart  RadarChart  KpiDashboard  Kanban  DataTable  ...
报告:    Mapping: accent✓ bg✓ text✓ | Chart: 4 auto-generated
```

## HTML 模板骨架

以下是一个完整的主题级 LiveKit 页面模板。根据场景调整：
- **预设主题**：修改 `themePresets` 对象
- **测试组件**：修改 `renderThemeGrid()` 中的组件列表
- **数据集**：修改 `dataSlices` 对象
- **script 路径**：按实际 vizual.standalone.js 位置调整

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LiveKit — Theme Adaptation</title>
  <style>
    body{font-family:system-ui;background:var(--rk-bg-primary,#0f0f1a);color:var(--rk-text-primary,#e0e0e0);padding:24px;margin:0}
    h2{margin-top:0}
    #theme-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px}
    #theme-btns{display:flex;gap:6px}
    .theme-btn{padding:6px 14px;border-radius:6px;border:1px solid var(--rk-border-subtle);background:var(--rk-bg-secondary);color:var(--rk-text-primary);cursor:pointer;font-size:12px;transition:all .15s}
    .theme-btn.active{background:var(--rk-accent);color:#fff;border-color:var(--rk-accent)}
    #palette-bar{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap}
    #theme-vars{font-size:11px;color:var(--rk-text-tertiary);margin-bottom:16px;font-family:monospace}
    #theme-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:12px}
    #mapping-report{margin-top:16px;padding:10px 14px;background:var(--rk-bg-secondary);border:1px solid var(--rk-border-subtle);border-radius:8px;font-size:11px;color:var(--rk-text-secondary)}
  </style>
</head>
<body>
  <h2>LiveKit — Theme Adaptation</h2>
  <div id="theme-controls">
    <div id="theme-btns"></div>
    <input id="custom-accent" type="color" value="#667eea" style="width:36px;height:30px;border:1px solid var(--rk-border-subtle);border-radius:6px;cursor:pointer">
    <button id="apply-custom" style="padding:6px 12px;border-radius:6px;border:1px solid var(--rk-border-subtle);background:var(--rk-bg-secondary);color:var(--rk-text-primary);cursor:pointer;font-size:12px">Custom</button>
    <select id="data-count" style="padding:4px 8px;border-radius:6px;border:1px solid var(--rk-border-subtle);background:var(--rk-bg-secondary);color:var(--rk-text-primary);font-size:12px">
      <option value="3">3 items</option><option value="6" selected>6 items</option><option value="12">12 items</option>
    </select>
    <div id="mode-toggle" style="width:44px;height:24px;border-radius:12px;background:var(--rk-bg-tertiary);cursor:pointer;position:relative">
      <div id="mode-thumb" style="width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .2s"></div>
    </div>
  </div>
  <div id="palette-bar"></div>
  <div id="theme-vars"></div>
  <div id="theme-grid"></div>
  <div id="mapping-report"></div>

  <script src="../dist/vizual.standalone.js"></script>
  <script>
    // ── 1. 定义预设主题（按需修改） ──
    var themePresets = {
      'theme-a': { colors:[
        {name:'accent',value:'#c8152d'},{name:'background',value:'#ffffff'},{name:'text',value:'#1a1a1a'},
        {name:'success',value:'#10b981'},{name:'warning',value:'#f59e0b'},{name:'error',value:'#ef4444'}
      ], typography:{fontFamily:'system-ui,sans-serif',sizes:{body:'14px'},weights:{regular:'400',bold:'700'}},
        spacing:{baseUnit:'8px',scale:{'space-1':'4px','space-2':'8px'}}, radius:{scale:{md:'8px'}}},
      'theme-b': { colors:[
        {name:'accent',value:'#667eea'},{name:'background',value:'#f0f4ff'},{name:'text',value:'#1a1a2e'},
        {name:'success',value:'#10b981'},{name:'warning',value:'#f59e0b'},{name:'error',value:'#ef4444'}
      ], typography:{fontFamily:'Inter,system-ui,sans-serif',sizes:{body:'14px'},weights:{regular:'400',bold:'600'}},
        spacing:{baseUnit:'6px',scale:{'space-1':'4px','space-2':'6px'}}, radius:{scale:{md:'10px'}}}
    };

    // ── 2. 注册所有主题 ──
    for (var key in themePresets) {
      var t = Vizual.mapDesignTokensToTheme(themePresets[key], key);
      Vizual.registerTheme(t.name, t);
      var inv = Vizual.invertTheme(t);
      Vizual.registerTheme(inv.name, inv);
    }

    // ── 3. 数据集（按需修改） ──
    var dataSlices = {
      pie: {
        3: [{name:'A',val:40},{name:'B',val:35},{name:'C',val:25}],
        6: [{name:'A',val:25},{name:'B',val:20},{name:'C',val:18},{name:'D',val:15},{name:'E',val:12},{name:'F',val:10}],
        12: [{name:'Jan',val:12},{name:'Feb',val:10},{name:'Mar',val:11},{name:'Apr',val:9},{name:'May',val:8},{name:'Jun',val:10},{name:'Jul',val:9},{name:'Aug',val:8},{name:'Sep',val:7},{name:'Oct',val:6},{name:'Nov',val:5},{name:'Dec',val:5}]
      }
    };

    var currentDataCount = 6;

    // ── 4. 初始化控件 ──
    var btnContainer = document.getElementById('theme-btns');
    for (var key in themePresets) {
      var btn = document.createElement('button');
      btn.className = 'theme-btn';
      btn.textContent = key;
      btn.dataset.theme = key;
      btn.onclick = function() { switchTheme(this.dataset.theme); setActiveBtn(this); };
      btnContainer.appendChild(btn);
    }

    document.getElementById('apply-custom').onclick = function() {
      var hex = document.getElementById('custom-accent').value;
      var tokens = { colors:[
        {name:'accent',value:hex},{name:'background',value:'#ffffff'},{name:'text',value:'#1a1a1a'},
        {name:'success',value:'#10b981'},{name:'warning',value:'#f59e0b'},{name:'error',value:'#ef4444'}
      ], typography:{fontFamily:'system-ui,sans-serif',sizes:{body:'14px'},weights:{regular:'400',bold:'700'}},
        spacing:{baseUnit:'8px',scale:{'space-1':'4px','space-2':'8px'}}, radius:{scale:{md:'8px'}}};
      var ct = Vizual.mapDesignTokensToTheme(tokens, 'custom');
      Vizual.registerTheme(ct.name, ct);
      Vizual.registerTheme(Vizual.invertTheme(ct).name, Vizual.invertTheme(ct));
      switchTheme('custom');
      setActiveBtn(null);
    };

    document.getElementById('data-count').onchange = function() {
      currentDataCount = parseInt(this.value);
      renderGrid();
    };

    document.getElementById('mode-toggle').onclick = function() {
      var mode = Vizual.toggleMode();
      var thumb = document.getElementById('mode-thumb');
      thumb.style.left = mode === 'light' ? '22px' : '2px';
      this.style.background = mode === 'light' ? 'var(--rk-accent)' : 'var(--rk-bg-tertiary)';
      renderGrid(); updatePalette(); updateVars();
    };

    // ── 5. 核心函数 ──
    function switchTheme(name) {
      Vizual.setGlobalTheme(name);
      renderGrid(); updatePalette(); updateVars(); updateReport();
    }

    function setActiveBtn(activeBtn) {
      document.querySelectorAll('.theme-btn').forEach(function(b) { b.classList.remove('active'); });
      if (activeBtn) activeBtn.classList.add('active');
    }

    function updatePalette() {
      var bar = document.getElementById('palette-bar');
      var colors = Vizual.chartColors(6);
      bar.innerHTML = colors.map(function(c, i) {
        return '<div style="text-align:center"><div style="width:48px;height:24px;background:'+c+';border-radius:4px;border:1px solid var(--rk-border-subtle)"></div><span style="font-size:9px;font-family:monospace;color:var(--rk-text-tertiary)">'+c+'</span></div>';
      }).join('');
    }

    function updateVars() {
      var el = document.getElementById('theme-vars');
      var vars = ['--rk-accent','--rk-bg-primary','--rk-text-primary','--rk-border-subtle','--rk-radius-md','--rk-space-2','--rk-text-base'];
      el.innerHTML = vars.map(function(v) { return '<span style="margin-right:14px">'+v+': <b style="color:var(--rk-text-primary)">'+Vizual.tc(v)+'</b></span>'; }).join('');
    }

    function updateReport() {
      var name = Vizual.getCurrentThemeName();
      var theme = Vizual.getTheme(name);
      var el = document.getElementById('mapping-report');
      if (!theme || !theme._mappingReport) { el.textContent = 'No report'; return; }
      var r = theme._mappingReport; var html = '<b>Mapping:</b> ';
      for (var role in (r.roles||{})) html += '<span style="color:'+(r.roles[role]?'var(--rk-success)':'var(--rk-error)')+'">'+role+(r.roles[role]?'✓':'✗')+'</span> ';
      el.innerHTML = html;
    }

    function renderSpec(type, props, container) {
      container.innerHTML = '';
      try { Vizual.renderSpec({root:'m',elements:{m:{type:type,props:props,children:[]}}}, container); }
      catch(e) { container.innerHTML = '<div style="color:var(--rk-error);font-size:11px">Error: '+e.message+'</div>'; }
    }

    function slot(label, type, props) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'border:1px solid var(--rk-border-subtle);border-radius:var(--rk-radius-md,8px);overflow:hidden';
      var lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:10px;color:var(--rk-text-tertiary);padding:4px 8px;background:var(--rk-bg-secondary);border-bottom:1px solid var(--rk-border-subtle)';
      lbl.textContent = label;
      var content = document.createElement('div');
      content.style.cssText = 'padding:8px;min-height:40px';
      wrap.appendChild(lbl); wrap.appendChild(content);
      renderSpec(type, props, content);
      return wrap;
    }

    // ── 6. 渲染组件网格（按需修改组件列表） ──
    function renderGrid() {
      var grid = document.getElementById('theme-grid');
      grid.innerHTML = '';
      var n = currentDataCount;
      // 添加你需要的组件
      grid.appendChild(slot('PieChart — '+n, 'PieChart', {title:'Share',category:'name',value:'val',data:dataSlices.pie[n]}));
    }

    // ── 7. 启动 ──
    switchTheme(Object.keys(themePresets)[0]);
    setActiveBtn(btnContainer.children[0]);
  </script>
</body>
</html>
```

## 适配指南

根据用户需求调整模板：

1. **换主题**：修改 `themePresets` 的 color/typography/spacing/radius
2. **加组件**：在 `renderGrid()` 里加更多 `slot()` 调用
3. **加数据集**：在 `dataSlices` 里加 bar/radar/timeline 等数据
4. **改路径**：调整 `<script src>` 指向正确的 vizual.standalone.js
5. **加控件**：在 `#theme-controls` 里加新的 input/select

## 主题 token 格式

每个预设主题是一个 DesignTokens 对象：

```js
{
  colors: [
    {name:'accent', value:'#hex'},
    {name:'background', value:'#hex'},
    {name:'text', value:'#hex'},
    // 可选: card, success, warning, error, text-secondary, border 等
  ],
  typography: {
    fontFamily: 'Font, sans-serif',
    sizes: { body: '14px', h3: '22px' },
    weights: { regular: '400', bold: '700' }
  },
  spacing: { baseUnit: '8px', scale: { 'space-1': '4px', 'space-2': '8px' } },
  radius: { scale: { sm: '4px', md: '8px', lg: '12px' } }
}
```

chart 调色板会从 accent 自动通过 OKLCH 等角旋转生成，无需手动指定。
