---
name: design-md-creator
version: "2.0.0"
description: >
  Create, extend, or reverse-engineer DESIGN.md files — with a live interactive preview page
  so users see and tweak their design system in real-time before exporting. Use this skill
  whenever the user wants to define or refine a visual design system: "create our brand design
  system", "make a DESIGN.md for our startup", "I like how Linear looks, create a design spec",
  "turn our Figma tokens into DESIGN.md", "we have brand colors but no design system",
  "reverse-engineer this screenshot into a design spec", or any request involving design tokens,
  style guides, brand guidelines, or design system creation. Also trigger when the user pastes
  a screenshot, brand guide PDF content, or says "make it look like [company/product]."
  This skill outputs an interactive preview HTML page (powered by Vizual) where users
  adjust colors, typography, and spacing in real-time, then export the final DESIGN.md with
  one click.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# DESIGN.md Creator — Interactive Design System Builder

This skill does one thing: **help users create a DESIGN.md with a live preview page**, not a text dump. The user sees real rendered colors, typography, and components — adjusts until satisfied — then exports.

## Mental Model

```
User describes needs → You generate preview HTML → User adjusts in browser → One-click export DESIGN.md
```

The preview HTML is powered by Vizual. Left panel: adjustable controls. Right panel: live-rendered components. Bottom: live DESIGN.md text + export button.

## Step 1: Identify the Input Mode

| Mode | What the user says | What you do |
|---|---|---|
| From scratch | "We're a medical SaaS" | Infer direction → confirm 2-3 options → generate preview |
| Reference style | "Make it like Linear" | Extract reference characteristics → generate preview |
| Screenshot | [pasted screenshot] | Analyze visual features → generate preview |
| Existing tokens | "We have Figma tokens" | Extract → fill gaps → generate preview |
| Partial | "Brand color #FF6B35, rest TBD" | Anchor around given values → infer rest → generate preview |
| Modify existing | "Change accent to green in our DESIGN.md" | Read file → adjust → regenerate preview |

## Step 2: Infer the Design Parameters

Derive these from the input mode. They become the preview page's initial control values.

```js
{
  brandName: 'Brand Name',
  accentColor: '#hex',        // brand accent
  bgColor: '#hex',            // page background
  cardBg: '#hex',             // card background
  textColor: '#hex',          // primary text
  textSecondary: '#hex',      // secondary text
  borderColor: '#hex',        // borders
  successColor: '#10b981',    // status colors (usually keep defaults)
  warningColor: '#f59e0b',
  errorColor: '#ef4444',
  headingFont: 'Font Name',
  bodyFont: 'Font Name',
  monoFont: 'Font Name',
  baseFontSize: 16,
  headingWeight: 600,
  padY: 8, padX: 12,          // inner spacing (padding)
  gapY: 20, gapX: 16,         // outer spacing (gap/margin)
  radiusSmall: 4, radiusMedium: 8, radiusLarge: 12,
  depthMode: 'border|shadow|flat',
  isDark: true
}
```

### Inference Heuristics

**From scratch** — match industry archetype:
- Medical/Finance → cool tones, professional, larger radius
- Education/Kids → warm tones, friendly, large radius
- Dev tools → dark, tight spacing, small radius, mono font
- E-commerce/Consumer → brand-color-driven, neutral backgrounds

**Reference style** — extract known product DNA:
- Linear: dark (#000), tight, border > shadow, Inter, tight letter-spacing
- Vercel: minimal black/white, large headings, mono accents
- Stripe: cool gray (#F6F9FC), purple accent, refined gradients
- Apple: generous whitespace, product-driven, SF Pro
- Notion: warm cream, serif mix
- Figma: vibrant purple, rounded cards

**Partial** — anchor on given values, infer the rest via OKLCH color wheel and light/dark derivation.

## Step 3: Generate the Preview HTML

Read the full template: [references/preview-template.html](references/preview-template.html)

The page uses Vizual's theme engine. The core rendering loop:

```
User adjusts control → deriveDesignTokens() → Vizual.mapDesignTokensToTheme() → setGlobalTheme()
                                                              ↓
                                              All Vizual components auto re-render
                                                              ↓
                                              generateDesignMd() updates export text
```

### Page Structure

**Left controls**: dark/light toggle, accent color picker, warmth slider, brightness slider, font selects (16 Google Fonts), padding sliders (Y/X), gap sliders (Y/X), radius slider, depth mode (border/shadow/flat).

**Palette bar**: auto-generated via `Vizual.chartColors(6)`.

**Component grid**: KpiDashboard, BarChart, PieChart, DataTable, LineChart, semantic color cards (success/warning/error).

**Bottom export**: live DESIGN.md preview + "Download DESIGN.md" / "Copy to Clipboard" buttons.

### Dependency

The preview page requires `vizual.standalone.js`. Set `<script src>` path to match the project structure.

## Step 4: Guide the User

After generating the HTML:
1. "I created an interactive preview page: `design-preview.html`"
2. "Open it in a browser — adjust colors, fonts, spacing in real-time"
3. "When satisfied, click 'Download DESIGN.md' at the bottom"
4. "Save the DESIGN.md to your project root"
5. For Claude Code users: "After saving, let me know and I'll read it to confirm."

## Anti-Patterns — What NOT to Do

1. **Don't write DESIGN.md text in the conversation.** Generate the preview HTML instead. The user wants to see rendered components, not read hex values. Writing text first defeats the purpose of live preview.

2. **Don't skip the preview step.** Even if the user says "just give me the DESIGN.md", generate the preview page first. They'll get a better result by adjusting visually. At minimum, generate both.

3. **Don't hardcode colors in the preview HTML.** Use `Vizual.tc()` for JS and `var(--rk-*)` for CSS. The controls change the theme — hardcoded values won't respond.

4. **Don't forget the 9 standard sections** in the exported DESIGN.md: (1) Visual Theme & Atmosphere, (2) Color Palette & Roles, (3) Typography Rules, (4) Component Styles, (5) Layout Principles, (6) Depth & Elevation, (7) Do's and Don'ts, (8) Responsive Behavior, (9) Agent Prompt Guide.

5. **Don't write DESIGN.md sections without rationale.** Every rule needs a "why." Bad: `Border radius: 8px`. Good: `Border radius: 8px — rounded enough to feel friendly but not frivolous, suits professional positioning`.

6. **Don't use placeholder text.** Every element in the preview earns its place. No "Lorem ipsum." No filler sections. If a section feels empty, that's a layout problem — solve it with composition, not content.

7. **Don't create a design system from a single color without confirming direction.** One brand color can lead to many different moods. Present 2-3 quick options in the preview (accent color variations) and let the user choose.

8. **Don't forget the `vizual.standalone.js` path.** The preview page is useless without it. Confirm the path matches the project before generating.

## DESIGN.md Writing Principles

**Rationale > Rules**: Every rule gets a "why." Colors get semantic name + hex + usage.

**Internal consistency**: Neutral colors share color temperature (all warm or all cool). Spacing based on a base unit. Border radius has a logical scale.

**Color naming**: Semantic name + hex + purpose. Example: `**Trust Blue** (#3366FF): primary brand color for CTA buttons and key interactions — conveys reliability`.

## Combining with Other Skills

- **design-md-parser** — After the user exports DESIGN.md, use the parser to apply it to Vizual components. The creator generates the document; the parser applies it.
- **vizual** — The preview page renders Vizual components via `renderSpec()`. The vizual skill's component knowledge applies directly. For theme-level comparison with multiple presets, use vizual's HTML output mode (see vizual SKILL.md).
