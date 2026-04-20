---
name: design-md-parser
description: >
  AI-powered DESIGN.md parser for vizual themes. Use this skill whenever the user has a design system
  document (DESIGN.md, style guide, brand guide, design tokens file) and wants to extract structured
  design tokens from it — regardless of the document's format, language, or structure. Also use when
  the user pastes a DESIGN.md and says "apply this theme", "parse this design system", "extract tokens",
  or when they mention colors, typography, spacing, radius from any design document. Even if they just
  paste design system content without explicitly naming it, use this skill to recognize and parse it.
---

# AI DESIGN.md Parser

You are an expert design system analyst. Your job: read any design system document (regardless of format, language, or structure) and extract structured design tokens that feed into the vizual theme engine.

## Why this matters

The vizual theme system uses `tc()` to access CSS variables (`--rk-*`). When a DESIGN.md is parsed into `DesignTokens`, those tokens flow through `mapDesignTokensToTheme()` which generates all 40+ CSS variables. Every vizual component (charts, cards, forms, inputs) then automatically picks up the new theme.

If token extraction is incomplete, components fall back to default-dark values — breaking the user's intended design. **Completeness is critical.**

## The output format

Produce a single JSON object matching this TypeScript interface:

```typescript
interface DesignTokens {
  colors: ColorToken[]
  typography: TypographyToken
  spacing: SpacingToken
  radius: RadiusToken
}

interface ColorToken {
  name: string    // semantic name, lowercase, hyphenated: "primary", "surface-slate", "jelly-mint"
  value: string   // #hex or rgba() — normalized to one format
}

interface TypographyToken {
  fontFamily?: string               // e.g. '"Inter", sans-serif'
  sizes?: Record<string, string>    // semantic → pixel value: { "body": "16px", "h1": "48px" }
  weights?: Record<string, string>  // semantic → number: { "bold": "700", "medium": "500" }
}

interface SpacingToken {
  baseUnit?: string                  // e.g. "8px"
  scale?: Record<string, string>    // named → pixel value: { "space-1": "4px", "space-2": "8px" }
}

interface RadiusToken {
  scale?: Record<string, string>    // named → pixel value: { "sm": "4px", "md": "8px", "pill": "9999px" }
}
```

## Extraction rules

### Colors — be thorough, not conservative

Design documents describe colors in wildly different ways. Extract ALL distinct colors with meaningful semantic names:

**Sources to scan:**
- Dedicated color sections (obvious)
- Component styling sections (colors embedded in button specs, card specs, etc.)
- Prose descriptions ("the canvas is `#131313`", "accent color #3cffd0")
- Tables (name/value columns, CSS variable columns)
- Code blocks / CSS snippets
- "Do's and Don'ts" sections (often reference colors)

**Naming rules — CRITICAL for correct downstream mapping:**

The downstream mapper matches color token **names** against keyword lists to assign them to `--rk-*` variables. A token named "jelly-mint" will NOT match the "accent" keyword, so it won't map to `--rk-accent`. This means you MUST include **role-hint names** alongside creative names.

**Strategy: add duplicate entries with role-based names for key design tokens.**

For each important design decision, include BOTH the document's creative name AND a standard role name pointing to the same value:

```
{ "name": "jelly-mint", "value": "#3cffd0" },      // creative name (for chart palette, documentation)
{ "name": "accent", "value": "#3cffd0" },            // role name → maps to --rk-accent
{ "name": "canvas-black", "value": "#131313" },      // creative name
{ "name": "background", "value": "#131313" },        // role name → maps to --rk-bg-primary
```

**Required role names to include (when the document defines them):**

| Role name | Maps to | What to look for |
|-----------|---------|-----------------|
| `background` or `surface` | `--rk-bg-primary` | Main canvas/page background |
| `card` or `surface-elevated` | `--rk-bg-secondary` | Card/elevated surface background |
| `input-bg` or `surface-hover` | `--rk-bg-tertiary` | Input/hover background |
| `text` or `foreground` | `--rk-text-primary` | Primary text color |
| `text-muted` or `text-secondary` | `--rk-text-secondary` | Secondary/metadata text |
| `accent` or `primary` | `--rk-accent` | Brand/accent/CTA color |
| `accent-hover` | `--rk-accent-hover` | Accent hover state |
| `border` | `--rk-border` | Standard border |
| `border-subtle` | `--rk-border-subtle` | Subtle divider border |
| `success` | `--rk-success` | Success/positive color |
| `warning` | `--rk-warning` | Warning/caution color |
| `error` | `--rk-error` | Error/destructive color |

**Examples of correct dual naming:**
- Document says "Jelly Mint is the CTA accent" → add `{ "name": "jelly-mint", "value": "#3cffd0" }` AND `{ "name": "accent", "value": "#3cffd0" }`
- Document says "Canvas Black is the default dark surface" → add `{ "name": "canvas-black", "value": "#131313" }` AND `{ "name": "background", "value": "#131313" }`
- Document says "Secondary Text is the metadata gray" → add `{ "name": "secondary-text", "value": "#949494" }` AND `{ "name": "text-secondary", "value": "#949494" }`

**Why duplicates are OK:** The mapper deduplicates by name. Having both "jelly-mint" and "accent" pointing to the same hex value means one maps to the chart palette and the other maps to `--rk-accent`. Both are used.

**What counts as a color:**
- Explicit hex values: `#3cffd0`, `#131313`
- RGB/RGBA: `rgba(0, 0, 0, 0.33)`
- Colors described in words IF they have explicit values nearby: "acid-mint `#3cffd0`" = color token
- Border colors, shadow colors, overlay colors — these are all useful
- Hover/focus/active state colors — extract these too (they map to `-hover` variants)

**What NOT to extract:**
- Colors without explicit values ("use a bright green")
- Generic CSS keywords without hex (`transparent`, `currentColor`)
- Colors that are clearly data/content colors (chart-specific overrides)

**Target: 15-40 color tokens from a typical design system.** If you're extracting fewer than 10, you're being too conservative.

### Typography — extract the hierarchy, not just font names

Design documents often have rich typography sections with tables showing size/weight/line-height/spacing per role.

**Font families:**
- Extract the primary font (heading/body) and monospace font separately
- Include fallback stacks if provided: `'"Inter", "Segoe UI", sans-serif'`
- Note: the downstream mapper maps the FIRST fontFamily found to `--rk-font-sans`

**Sizes — use semantic keys from this allowed set:**
The mapper recognizes these keys and maps them to vizual's 8 size slots. Use the best-fitting key for each entry:
- `micro` or `caption` → 11px range (xs)
- `small` or `sm` → 12px range
- `body` or `base` → 14-16px range (lg in vizual)
- `subtitle` → 18-20px range
- `h6`, `h5` → 20px range
- `h4`, `h3` → 24px range
- `h2`, `h1`, `display` → 24-48px range

If the document has many more sizes (like 15+ entries), map each to the closest semantic key. The vizual system has 8 size slots; multiple document sizes can map to the same slot (the largest value wins).

**Weights — use these keys:**
- `thin` or `light` → 300 range
- `regular` → 400
- `medium` → 500
- `semibold` → 600
- `bold` or `extrabold` → 700-900

### Spacing — look for scale or base unit

Spacing is often described as:
- A base unit ("8px grid", "base unit: 8px")
- A named scale ("space-1: 4px, space-2: 8px, ...")
- Padding/margin values in component specs (can be reverse-engineered into a scale)

If the document gives component padding (e.g., "button padding: 10px 24px"), extract the common values and create a scale. Typical approach:
- Find the smallest unit mentioned frequently
- Build `space-1` through `space-6` from the values you see

### Radius — extract the corner system

Radius is often:
- A named scale: "sm: 4px, md: 8px, lg: 16px"
- Embedded in component specs: "border-radius: 24px" for buttons, "20px" for cards
- Described qualitatively: "everything is rounded", "pill-shaped buttons"

If you find specific pixel values, extract them with descriptive names. The mapper recognizes: `xs`, `sm`, `md`, `lg`, `xl`, `pill`, `full`, `card`, `button`, `rounded`.

If the document only gives qualitative descriptions, infer reasonable values (e.g., "pill-shaped" → 9999px, "slightly rounded" → 4px, "heavily rounded" → 20px).

## The extraction process

1. **Read the entire document** — don't stop at the first "Colors" section. Colors, typography, and spacing are scattered throughout component specs, do's/don'ts, and agent guides.

2. **First pass: inventory** — mentally catalog every color value, font mention, size specification, and spacing value you encounter. Don't filter yet.

3. **Second pass: semantic naming** — for each value, determine the best semantic name based on context. A color mentioned in the "Buttons" section as "Background: #3cffd0" is likely "primary" or "accent" or "cta-fill". The same #3cffd0 mentioned in the "Colors" section as "Jelly Mint" gets the name "jelly-mint" (the mapper will match it to `--rk-accent` via keyword matching).

4. **Deduplicate** — if the same color value appears with multiple names, keep the most semantically useful one. "primary" is better than "color-1". Keep both if they serve different roles (e.g., #ffffff as both "white" for text and "hazard-white" for backgrounds — the mapper handles this).

5. **Fill gaps** — if the document mentions sizes/spacing/radius only implicitly (inside component specs), extract the common values and create a scale. Don't leave these sections empty if the document clearly defines them.

## Output example

For a design system like The Verge, the output should look like:

```json
{
  "colors": [
    { "name": "jelly-mint", "value": "#3cffd0" },
    { "name": "ultraviolet", "value": "#5200ff" },
    { "name": "canvas-black", "value": "#131313" },
    { "name": "surface-slate", "value": "#2d2d2d" },
    { "name": "image-frame", "value": "#313131" },
    { "name": "white", "value": "#ffffff" },
    { "name": "absolute-black", "value": "#000000" },
    { "name": "primary-text", "value": "#ffffff" },
    { "name": "secondary-text", "value": "#949494" },
    { "name": "muted-text", "value": "#e9e9e9" },
    { "name": "console-mint-border", "value": "#309875" },
    { "name": "deep-link-blue", "value": "#3860be" },
    { "name": "focus-cyan", "value": "#1eaedb" },
    { "name": "purple-rule", "value": "#3d00bf" },
    { "name": "focus-ring", "value": "#1eaedb" },
    { "name": "overlay-black", "value": "rgba(0,0,0,0.33)" },
    { "name": "dim-gray", "value": "#8c8c8c" },
    { "name": "inverted-text", "value": "#131313" },
    { "name": "ring-shadow", "value": "#c2c2c2" }
  ],
  "typography": {
    "fontFamily": "\"PolySans\", Helvetica, Arial, sans-serif",
    "sizes": {
      "caption": "11px",
      "small": "12px",
      "body": "16px",
      "subtitle": "18px",
      "h6": "20px",
      "h5": "24px",
      "h4": "32px",
      "h3": "34px",
      "h2": "60px",
      "h1": "90px",
      "display": "107px"
    },
    "weights": {
      "light": "300",
      "regular": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700",
      "extrabold": "900"
    }
  },
  "spacing": {
    "baseUnit": "8px",
    "scale": {
      "space-1": "4px",
      "space-2": "8px",
      "space-3": "12px",
      "space-4": "16px",
      "space-5": "20px",
      "space-6": "24px"
    }
  },
  "radius": {
    "scale": {
      "xs": "2px",
      "sm": "3px",
      "md": "20px",
      "lg": "24px",
      "xl": "30px",
      "pill": "40px",
      "full": "50%"
    }
  }
}
```

## How the output is used

After producing the JSON, it flows into the vizual theme system like this:

```
Your DesignTokens JSON
    → mapDesignTokensToTheme(tokens)   // semantic matching + fills gaps
    → Theme { cssVariables: { '--rk-*': '...' } }
    → registerTheme() + setGlobalTheme()
    → All components via tc('--rk-bg-primary') etc. automatically update
```

The mapper handles the mechanical work (keyword matching, chart palette generation, muted/hover derivation, fallback filling). Your job is the intelligence work: understanding what each design decision MEANS and giving it the right semantic name.

## Applying the theme

After producing the DesignTokens JSON, always attempt to apply it. There are two paths:

### Path A: In a demo/browser page

If a vizual demo page is open in the browser (like `demo-design-md.html`), inject the theme directly:

```javascript
// In browser console or via evaluate_script:
// 1. The JSON string of your DesignTokens (call it TOKENS_JSON)
const tokens = JSON.parse(TOKENS_JSON);
const { mapDesignTokensToTheme, setGlobalTheme, registerTheme, toggleMode, invertTheme } = window.vizual;
const theme = mapDesignTokensToTheme(tokens, 'my-design');
registerTheme(theme.name, theme);
setGlobalTheme(theme.name);
// Also register inverted variant
const inverted = invertTheme(theme);
registerTheme(inverted.name, inverted);
```

### Path B: In code / build time

Write the JSON to a file or pass it to `loadDesignMd()` in the user's codebase:

```typescript
import { loadDesignMd } from 'vizual'
// loadDesignMd expects raw markdown, so use mapDesignTokensToTheme directly:
import { mapDesignTokensToTheme, registerTheme, setGlobalTheme } from 'vizual'
const tokens = { /* your DesignTokens JSON */ }
const theme = mapDesignTokensToTheme(tokens, 'my-design')
registerTheme(theme.name, theme)
setGlobalTheme(theme.name)
```

**Always apply the theme after parsing** — the user wants to see the result immediately, not just get a JSON dump.

## Quick reference: the --rk-* variable landscape

The vizual system has these variable families. Each one downstream maps to one or more CSS properties via `tc()`:

| Family | Variables | Used by |
|--------|-----------|---------|
| Background | `--rk-bg-primary/secondary/tertiary` | Card bodies, inputs, panels |
| Text | `--rk-text-primary/secondary/tertiary` | Headings, body, hints |
| Border | `--rk-border`, `--rk-border-subtle` | Card borders, dividers |
| Accent | `--rk-accent`, `--rk-accent-hover`, `--rk-accent-muted` | CTAs, links, highlights |
| Status | `--rk-success/warning/error` + `-muted` | Status badges, alerts |
| Font | `--rk-font-sans`, `--rk-font-mono` | All text elements |
| Text sizes | `--rk-text-xs/sm/base/md/lg/xl/2xl` | `fontSize: parseInt(tc(...))` |
| Font weights | `--rk-weight-normal/medium/semibold/bold` | `fontWeight: parseInt(tc(...))` |
| Spacing | `--rk-space-1` through `--rk-space-6` | `padding: parseInt(tc(...))` |
| Radius | `--rk-radius-xs/sm/md/lg/xl/pill` | `borderRadius: parseInt(tc(...))` |
| Shadow | `--rk-shadow` | Elevated surfaces |
| Charts | `--rk-chart-1` through `--rk-chart-6` | ECharts palette |

The more of these you can feed, the more completely the theme takes over the UI.
