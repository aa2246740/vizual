---
name: design-md-parser
version: "2.0.0"
description: >
  Parse any design system document (DESIGN.md, style guide, brand guide, design tokens file)
  into structured tokens that drive Vizual's theme engine. Use this skill whenever the user
  provides any design document — even a partial one, a pasted snippet of brand colors, or a
  vague description like "our brand uses dark backgrounds with green accents." Also trigger
  when the user says "apply this theme", "parse this design system", "extract tokens", "switch
  to our brand colors", or when they paste content containing hex colors, font specs, or spacing
  values. This skill gives any AI agent its own theme engine — parse tokens → apply theme →
  all Vizual components auto-restyle. Always apply the theme after parsing so the user sees
  immediate results. For theme-level comparison with multiple presets, use the vizual skill's HTML output mode.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# DESIGN.md Parser — Your Theme Engine

You read design documents, extract structured color/typography/spacing tokens, and apply them as Vizual themes. Every Vizual component auto-restyles — no per-component work needed.

## Mental Model

Think of it as a pipeline:

```
Design Document → Extract Tokens → Dual Naming → Map to CSS Variables → Apply → All Components Restyle
```

Your job is steps 1-3. The downstream mapper (`mapDesignTokensToTheme`) handles step 4, and the theme system handles 5-6 automatically.

## Output Format

```typescript
interface DesignTokens {
  colors: { name: string; value: string }[]  // semantic name + hex/rgba
  typography: {
    fontFamily: string
    sizes: Record<string, string>   // "caption": "11px", "h1": "48px"
    weights: Record<string, string> // "regular": "400", "bold": "700"
  }
  spacing: { baseUnit?: string; scale: Record<string, string> }
  radius: { scale: Record<string, string> }
}
```

## The One Critical Rule: Dual Naming

Every important color needs TWO entries — the document's creative name AND a standard role name:

```json
{ "name": "jelly-mint", "value": "#3cffd0" },    // document's creative name
{ "name": "accent", "value": "#3cffd0" },           // role name → maps to --rk-accent
{ "name": "canvas-black", "value": "#131313" },     // document's creative name
{ "name": "background", "value": "#131313" }        // role name → maps to --rk-bg-primary
```

**Why:** The downstream mapper matches token names against keywords. A token named "jelly-mint" won't match "accent", so it won't map to `--rk-accent`. The dual naming ensures both the creative identity and the functional role are captured.

### Required role names (include when the document defines them)

| Role name | Maps to | Look for |
|---|---|---|
| `background` / `surface` | `--rk-bg-primary` | Main page background |
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
4. **Target: 15-40 color tokens** — fewer than 10 means you're being too conservative
5. **Fill gaps** — if spacing/radius only appear in component specs, extract common values into a scale

## What to Extract

**Colors:** hex values, rgba(), colors with explicit values in prose. NOT: colors without values ("use a bright green"), CSS keywords (`transparent`).

**Typography:** primary font family (with fallback stack), size scale (semantic keys: `caption`/`body`/`h1`-`h6`/`display`), weight scale (`light`/`regular`/`medium`/`semibold`/`bold`).

**Spacing:** base unit ("8px grid"), named scale, or reverse-engineer from component padding specs.

**Radius:** named scale, values from component specs, or infer from descriptions ("pill-shaped" → 9999px, "slightly rounded" → 4px).

## Anti-Patterns — What NOT to Do

1. **Don't skip the dual naming.** This is the #1 failure mode. A token named only "ocean-blue" with value "#0066cc" will NOT map to `--rk-accent`. You must also add `{ "name": "accent", "value": "#0066cc" }`. Without the role name, the theme engine can't find the token and falls back to defaults.

2. **Don't extract too few tokens.** If you return 5 colors, the theme will be mostly defaults. Aim for 15-40 color tokens. Extract from every section of the document — components, cards, buttons, borders, backgrounds all define colors.

3. **Don't invent colors the document doesn't define.** If the document says nothing about error colors, don't add `#ef4444` as an "error" token. Let the theme engine fall back to defaults for missing roles. Invented colors create a theme that doesn't match the source document.

4. **Don't forget to apply the theme after parsing.** The user wants to see results, not a JSON dump. Always call `mapDesignTokensToTheme()` → `registerTheme()` → `setGlobalTheme()` after extraction.

5. **Don't confuse creative names with role names.** "Trust Blue" is a creative name (keep it). "accent" is a role name (also add it). They're two entries with the same value, serving different purposes. Don't merge them into one.

6. **Don't extract colors without values.** "Use a vibrant green" has no extractable value. Skip it. Only extract colors with explicit hex/rgba values.

7. **Don't put CSS keywords as token values.** `transparent`, `inherit`, `currentColor`, `none` — these aren't valid theme token values. Only `#hex` and `rgba()`.

## Applying the Theme

Always apply after parsing. The user wants to see results, not a JSON dump.

### In a browser page

```javascript
const tokens = { /* your DesignTokens JSON */ };
const theme = Vizual.mapDesignTokensToTheme(tokens, 'custom-theme');
Vizual.registerTheme(theme.name, theme);
Vizual.setGlobalTheme(theme.name);
const inverted = Vizual.invertTheme(theme);
Vizual.registerTheme(inverted.name, inverted);
```

### In code

```typescript
import { mapDesignTokensToTheme, registerTheme, setGlobalTheme } from 'vizual'
const tokens = { /* your DesignTokens JSON */ }
const theme = mapDesignTokensToTheme(tokens, 'custom-theme')
registerTheme(theme.name, theme)
setGlobalTheme(theme.name)
```

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

## Reference

For the complete list of theme variables and semantic keyword mapping: [references/vizual-theme-vars.md](references/vizual-theme-vars.md)

## Combining with Other Skills

- **vizual** — After applying the theme, use the vizual skill to render components. They automatically use the new theme colors.
- **design-md-creator** — If the user has no design document yet but wants to create one, trigger design-md-creator instead. Use design-md-parser only when the user already has a document to parse.

For theme-level comparison (multi-preset, dark/light toggle), use the vizual skill's HTML output mode instead.
