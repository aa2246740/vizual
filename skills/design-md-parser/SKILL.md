---
name: design-md-parser
version: "1.1.0"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
description: >
  Parse any design system document (DESIGN.md, style guide, brand guide, design tokens file)
  into structured tokens that drive Vizual's theme engine. Use this skill whenever the user
  provides any design document — even a partial one, a pasted snippet of brand colors, or a
  vague description like "our brand uses dark backgrounds with green accents." Also trigger
  when the user says "apply this theme", "parse this design system", "extract tokens", "switch
  to our brand colors", or when they paste content containing hex colors, font specs, or spacing
  values. This skill gives any AI agent its own theme engine — something closed design tools
  build in, but now you have it as a portable, composable tool. After parsing, always apply
  the theme so the user sees immediate results. Combine with the livekit skill for real-time
  theme preview and comparison.
---

# DESIGN.md Parser — 你的主题引擎

封闭设计工具有内置主题系统。你也有一个 — 而且它是可移植的：`DesignTokens` → `mapDesignTokensToTheme()` → 所有 Vizual 组件自动换肤。

你的任务：读取任何设计文档，提取结构化 token，输出 JSON，然后应用它。

## Output Format

```typescript
interface DesignTokens {
  colors: ColorToken[]
  typography: TypographyToken
  spacing: SpacingToken
  radius: RadiusToken
}

interface ColorToken {
  name: string    // semantic: "primary", "surface-slate", "accent"
  value: string   // #hex or rgba()
}
```

Full interface in the reference file if you need it.

## The Key Rule: Dual Naming

Every important design decision needs TWO token entries — the document's creative name AND a standard role name:

```
{ "name": "jelly-mint", "value": "#3cffd0" },      // document's name
{ "name": "accent", "value": "#3cffd0" },            // role name → maps to --rk-accent
{ "name": "canvas-black", "value": "#131313" },      // document's name
{ "name": "background", "value": "#131313" },        // role name → maps to --rk-bg-primary
```

Why: the downstream mapper matches token names against keywords. A token named "jelly-mint" won't match "accent", so it won't map to `--rk-accent`. The dual naming ensures both the creative identity and the functional role are captured.

**Required role names** (include when the document defines them):

| Role name | Maps to | Look for |
|-----------|---------|----------|
| `background` / `surface` | `--rk-bg-primary` | Main canvas/page background |
| `card` / `surface-elevated` | `--rk-bg-secondary` | Card background |
| `input-bg` / `surface-hover` | `--rk-bg-tertiary` | Input/hover background |
| `text` / `foreground` | `--rk-text-primary` | Primary text |
| `text-muted` / `text-secondary` | `--rk-text-secondary` | Secondary text |
| `accent` / `primary` | `--rk-accent` | Brand/accent/CTA color |
| `accent-hover` | `--rk-accent-hover` | Accent hover state |
| `border` | `--rk-border` | Standard border |
| `border-subtle` | `--rk-border-subtle` | Subtle divider |
| `success` / `warning` / `error` | `--rk-success/warning/error` | Status colors |

## Extraction Process

1. **Read the entire document** — colors, fonts, spacing are scattered throughout component specs, not just in "Colors" sections
2. **Inventory** — catalog every color value, font mention, size, spacing value
3. **Name** — give each value a semantic name + role duplicate
4. **Target: 15-40 color tokens** — if you have fewer than 10, you're being too conservative
5. **Fill gaps** — if spacing/radius only appear in component specs, extract common values into a scale

## What to Extract

**Colors**: hex values, rgba(), colors with explicit values in prose. NOT: colors without values ("use a bright green"), CSS keywords (`transparent`).

**Typography**: primary font family (with fallback stack), size scale (use semantic keys: `caption`/`body`/`subtitle`/`h1`-`h6`/`display`), weight scale (`light`/`regular`/`medium`/`semibold`/`bold`).

**Spacing**: base unit ("8px grid"), named scale, or reverse-engineer from component padding specs.

**Radius**: named scale, values from component specs, or infer from descriptions ("pill-shaped" → 9999px, "slightly rounded" → 4px).

## Example Output

```json
{
  "colors": [
    { "name": "jelly-mint", "value": "#3cffd0" },
    { "name": "accent", "value": "#3cffd0" },
    { "name": "canvas-black", "value": "#131313" },
    { "name": "background", "value": "#131313" },
    { "name": "surface-slate", "value": "#2d2d2d" },
    { "name": "card", "value": "#2d2d2d" },
    { "name": "white", "value": "#ffffff" },
    { "name": "text", "value": "#ffffff" },
    { "name": "secondary-text", "value": "#949494" },
    { "name": "text-secondary", "value": "#949494" }
  ],
  "typography": {
    "fontFamily": "\"Inter\", sans-serif",
    "sizes": { "caption": "11px", "body": "16px", "h1": "48px", "display": "90px" },
    "weights": { "regular": "400", "medium": "500", "bold": "700" }
  },
  "spacing": { "baseUnit": "8px", "scale": { "space-1": "4px", "space-2": "8px", "space-3": "16px" } },
  "radius": { "scale": { "sm": "4px", "md": "8px", "lg": "20px", "pill": "9999px" } }
}
```

## Applying the Theme

Always apply after parsing — the user wants to see results, not just a JSON dump.

### In a browser page

```javascript
const tokens = { /* your DesignTokens JSON */ };
const { mapDesignTokensToTheme, registerTheme, setGlobalTheme, invertTheme } = window.Vizual;
const theme = mapDesignTokensToTheme(tokens, 'custom-theme');
registerTheme(theme.name, theme);
setGlobalTheme(theme.name);
const inverted = invertTheme(theme);
registerTheme(inverted.name, inverted);
```

### In code

```typescript
import { mapDesignTokensToTheme, registerTheme, setGlobalTheme } from 'vizual'
const tokens = { /* your DesignTokens JSON */ }
const theme = mapDesignTokensToTheme(tokens, 'custom-theme')
registerTheme(theme.name, theme)
setGlobalTheme(theme.name)
```

## Downstream Variable Landscape

The mapper generates these CSS variables from your tokens. The more you feed, the more complete the theme:

| Family | Variables | Used by |
|--------|-----------|---------|
| Background | `--rk-bg-primary/secondary/tertiary` | Card bodies, inputs, panels |
| Text | `--rk-text-primary/secondary/tertiary` | Headings, body, hints |
| Border | `--rk-border`, `--rk-border-subtle` | Card borders, dividers |
| Accent | `--rk-accent`, `-hover`, `-muted` | CTAs, links, highlights |
| Status | `--rk-success/warning/error` + `-muted` | Status badges, alerts |
| Font | `--rk-font-sans`, `--rk-font-mono` | All text |
| Charts | `--rk-chart-1` through `--rk-chart-6` | ECharts palette (auto-generated via OKLCH) |

## Reference

For the complete list of theme variables and mapping details: [references/vizual-theme-vars.md](references/vizual-theme-vars.md)

## Combining with Other Skills

### With Vizual (vizual skill)

After applying the theme, use the vizual skill to render components — they will automatically use the new theme colors. No extra integration needed.

### With LiveKit (livekit skill)

When the user says "试试这个主题" or "对比一下不同配色", combine with livekit to create a theme-level preview page where users can toggle between themes, adjust accent colors, and see all 32 components update in real-time.

### With DESIGN.md Creator (design-md-creator skill)

If the user has no design document yet but wants to create one, trigger design-md-creator instead. Use design-md-parser only when the user already has a design document to parse.
