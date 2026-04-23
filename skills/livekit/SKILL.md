---
name: livekit
version: "2.0.0"
description: >-
  Generate interactive HTML pages where users adjust controls and see results in real-time.
  Use when "调一下看看" beats static output: comparing themes, tuning parameters across
  multiple components, building playgrounds, visualizing algorithms, or any scenario where
  hands-on exploration adds value. Outputs HTML files (not JSON specs). For single-component
  playgrounds, use the vizual skill's InteractivePlayground instead — LiveKit is for
  multi-component, theme-level, and custom-level interactivity. Trigger proactively when
  the user discusses design decisions, color systems, data analysis, algorithm behavior,
  or any topic where interactive > static. Keywords: playground, live preview, interactive
  demo, theme comparison, 实时调整, 调色板, 参数探索, livekit, sandbox, workbench,
  试试看, 对比一下, 调一下, tweaks, adjust, slider.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# LiveKit — Your Real-Time Interaction Engine

LiveKit generates standalone HTML pages where users drag controls and see results update instantly. You write HTML/CSS/JS, embed Vizual components via `Vizual.renderSpec()`, and wire controls to re-render on every change.

## Mental Model: Two Modes

LiveKit has exactly two modes. Pick the right one by asking: **what is the user adjusting?**

**Theme-Level** — The user wants to see how an entire design system looks across multiple components. Generate an HTML page with theme presets, accent color picker, dark/light toggle, and a grid of Vizual components that all re-render when the theme changes.

Read the full HTML template: [references/theme-level.md](references/theme-level.md)

**Custom-Level** — The user wants to adjust something that isn't a theme: algorithm parameters, data distributions, JSON specs, layout experiments, anything custom. Generate an HTML page with whatever controls make sense and wire them to your rendering logic.

Read the skeleton template + control cookbook: [references/custom-level.md](references/custom-level.md)

## The Boundary: LiveKit vs Vizual's InteractivePlayground

This is the #1 source of confusion. The rule is simple:

**Single component with adjustable parameters** → Vizual skill. It has an `InteractivePlayground` component that wraps one component with sliders/toggles. Output is a JSON spec. No HTML needed.

**Multiple components, theme switching, or custom targets** → LiveKit. Output is an HTML file.

| What the user wants | Which skill | Output |
|---|---|---|
| A chart with adjustable parameters | vizual (InteractivePlayground) | JSON spec |
| Compare dark/light mode across 6 charts | LiveKit (theme-level) | HTML file |
| Tune algorithm parameters + see visualization | LiveKit (custom-level) | HTML file |
| Try 3 different accent colors on a dashboard | LiveKit (theme-level) | HTML file |
| Edit JSON spec and see it render live | LiveKit (custom-level) | HTML file |

## When to Proactively Use LiveKit

Don't wait for the user to say "playground". Trigger LiveKit when hands-on beats static:

**Design verification** — "试试这个配色", "暗色模式效果怎么样", "不同品牌色下图表还好看吗"
**Algorithm exploration** — discussing sorting, clustering, interpolation, any parameterized process
**Data investigation** — "看看不同维度的数据", "数据量增大趋势还明显吗"
**Component debugging** — "这个 JSON 渲染出来长啥样", tuning chart parameters across multiple variations

## Anti-Patterns — What NOT to Do

1. **Don't use LiveKit for single-component playgrounds.** If the user just wants one chart with a few sliders, that's vizual's `InteractivePlayground`. LiveKit is for multi-component pages. Using LiveKit for single components creates unnecessary HTML when a JSON spec suffices.

2. **Don't hardcode colors in your HTML.** Use `Vizual.tc('--rk-accent')` for JavaScript and `var(--rk-accent)` for CSS. This way the page responds to theme changes. Hardcoded hex values break when the user switches themes.

3. **Don't forget the vizual.standalone.js dependency.** Every LiveKit page loads it via `<script src>`. Adjust the path to match the project structure (usually `../dist/vizual.standalone.js`). A page that can't find this script renders nothing.

4. **Don't put `renderSpec()` calls in a loop without clearing the container.** Always `container.innerHTML = ''` before re-rendering. Otherwise old components pile up and memory grows.

5. **Don't create controls that don't connect to anything.** Every slider, toggle, and select must trigger a re-render. A disconnected control is worse than no control — it teaches the user that interaction doesn't work.

6. **Don't use `onchange` for sliders.** Use `oninput`. `onchange` only fires when the user releases the slider — the preview jumps. `oninput` fires continuously while dragging, giving smooth real-time feedback.

7. **Don't try to control global theme from InteractivePlayground.** If you're using `InteractivePlayground` in a LiveKit page, its `targetProp` only sets component-level props (like `theme: "light"`). It cannot call `Vizual.setGlobalTheme()`. For global theme switching, write your own control that calls `Vizual.setGlobalTheme()` directly.

8. **Don't duplicate the theme-level template.** Read `references/theme-level.md` — it has a complete working HTML template. Adapt it, don't rewrite it from scratch.

## Key APIs (via global `Vizual` object)

```javascript
Vizual.renderSpec(spec, container)              // Render a JSON spec into a DOM element
Vizual.setGlobalTheme(name)                     // Switch all components to a named theme
Vizual.registerTheme(name, themeObj)            // Register a custom theme
Vizual.mapDesignTokensToTheme(tokens, name)     // Convert DesignTokens → theme object
Vizual.invertTheme(themeObj)                     // Generate dark↔light inverse
Vizual.chartColors(count)                        // Get current palette colors
Vizual.tc(cssVarName)                            // Get resolved color value
Vizual.toggleMode()                              // Toggle dark/light mode
```

## Theme-Level Quick Start

The theme-level page has this structure:

```
[Theme A] [Theme B] [Custom Color] | Data: [3/6/12] | [Dark/Light Toggle]
[Palette Bar: ■ ■ ■ ■ ■ ■]
[PieChart] [BarChart] [RadarChart] [KpiDashboard] [DataTable] ...
[Mapping Report: accent✓ bg✓ text✓ ...]
```

Core rendering loop:

```javascript
function switchTheme(name) {
  Vizual.setGlobalTheme(name);
  renderGrid(); updatePalette(); updateVars();
}
```

Full template with all controls: [references/theme-level.md](references/theme-level.md)

## Custom-Level Quick Start

The custom skeleton is a control panel + preview area:

```html
<script src="../dist/vizual.standalone.js"></script>
<div class="lk-root">
  <div class="lk-controls">
    <label>Param <input type="range" id="p1" min="0" max="100"></label>
  </div>
  <div class="lk-target" id="target"></div>
</div>
<script>
  function render() {
    const v = +document.getElementById('p1').value;
    document.getElementById('target').innerHTML = '';
    Vizual.renderSpec(buildSpec(v), document.getElementById('target'));
  }
  document.getElementById('p1').addEventListener('input', render);
  render();
</script>
```

Full skeleton + control type cookbook: [references/custom-level.md](references/custom-level.md)

## Theme System Reference

For the complete list of CSS variables, semantic keyword mapping, and how components consume them: [references/theme.md](references/theme.md)

## Combining with Other Skills

- **vizual** — For single-component InteractivePlayground (JSON spec), not HTML. Also, LiveKit pages render Vizual components via `renderSpec()`, so the vizual skill's component knowledge applies directly.
- **design-md-parser** — When the user provides a design document and wants a live theme preview: parse tokens → feed into `mapDesignTokensToTheme()` → render theme-level LiveKit page.
- **design-md-creator** — Already generates a LiveKit-powered preview page internally. Don't manually combine — just trigger design-md-creator when the user wants to create a design system from scratch.
