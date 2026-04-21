# Design System — Claude (Anthropic) 示例

这是一个完整的 DESIGN.md 示例，展示了 9 个标准章节的写法。注意每一节都包含原因（why），而不只是规则（what）。

---

# Design System Inspired by Claude (Anthropic)

## 1. Visual Theme & Atmosphere

Claude's interface is a literary salon reimagined as a product page — warm, unhurried, and quietly intellectual. The entire experience is built on a parchment-toned canvas (`#f5f4ed`) that deliberately evokes the feeling of high-quality paper rather than a digital surface. Where most AI product pages lean into cold, futuristic aesthetics, Claude's design radiates human warmth, as if the AI itself has good taste in interior design.

The signature move is the custom Anthropic Serif typeface — a medium-weight serif with generous proportions that gives every headline the gravitas of a book title. Combined with organic, hand-drawn-feeling illustrations in terracotta (`#c96442`), black, and muted green, the visual language says "thoughtful companion" rather than "powerful tool." The serif headlines breathe at tight-but-comfortable line-heights (1.10–1.30), creating a cadence that feels more like reading an essay than scanning a product page.

What makes Claude's design truly distinctive is its warm neutral palette. Every gray has a yellow-brown undertone (`#5e5d59`, `#87867f`, `#4d4c48`) — there are no cool blue-grays anywhere. Borders are cream-tinted (`#f0eee6`, `#e8e6dc`), shadows use warm transparent blacks, and even the darkest surfaces (`#141413`, `#30302e`) carry a barely perceptible olive warmth. This chromatic consistency creates a space that feels lived-in and trustworthy.

**Key Characteristics:**
- Warm parchment canvas (`#f5f4ed`) evoking premium paper, not screens
- Custom Anthropic type family: Serif for headlines, Sans for UI, Mono for code
- Terracotta brand accent (`#c96442`) — warm, earthy, deliberately un-tech
- Exclusively warm-toned neutrals — every gray has a yellow-brown undertone
- Organic, editorial illustrations replacing typical tech iconography
- Ring-based shadow system (`0px 0px 0px 1px`) creating border-like depth without visible borders
- Magazine-like pacing with generous section spacing and serif-driven hierarchy

## 2. Color Palette & Roles

### Primary
- **Anthropic Near Black** (`#141413`): The primary text color and dark-theme surface — not pure black but a warm, almost olive-tinted dark that's gentler on the eyes. The warmest "black" in any major tech brand.
- **Terracotta Brand** (`#c96442`): The core brand color — a burnt orange-brown used for primary CTA buttons, brand moments, and the signature accent. Deliberately earthy and un-tech.
- **Coral Accent** (`#d97757`): A lighter, warmer variant of the brand color used for text accents, links on dark surfaces, and secondary emphasis.

### Secondary & Accent
- **Error Crimson** (`#b53333`): A deep, warm red for error states — serious without being alarming.
- **Focus Blue** (`#3898ec`): Standard blue for input focus rings — the only cool color in the entire system, used purely for accessibility.

### Surface & Background
- **Parchment** (`#f5f4ed`): The primary page background — a warm cream with a yellow-green tint that feels like aged paper. The emotional foundation of the entire design.
- **Ivory** (`#faf9f5`): The lightest surface — used for cards and elevated containers on the Parchment background. Barely distinguishable but creates subtle layering.
- **Pure White** (`#ffffff`): Reserved for specific button surfaces and maximum-contrast elements.
- **Warm Sand** (`#e8e6dc`): Button backgrounds and prominent interactive surfaces — a noticeably warm light gray.
- **Dark Surface** (`#30302e`): Dark-theme containers, nav borders, and elevated dark elements — warm charcoal.
- **Deep Dark** (`#141413`): Dark-theme page background and primary dark surface.

### Neutrals & Text
- **Charcoal Warm** (`#4d4c48`): Button text on light warm surfaces — the go-to dark-on-light text.
- **Olive Gray** (`#5e5d59`): Secondary body text — a distinctly warm medium-dark gray.
- **Stone Gray** (`#87867f`): Tertiary text, footnotes, and de-emphasized metadata.
- **Dark Warm** (`#3d3d3a`): Dark text links and emphasized secondary text.
- **Warm Silver** (`#b0aea5`): Text on dark surfaces — a warm, parchment-tinted light gray.

### Semantic
- **Border Cream** (`#f0eee6`): Standard light-theme border — barely visible warm cream.
- **Border Warm** (`#e8e6dc`): Prominent borders and section dividers.
- **Border Dark** (`#30302e`): Standard border on dark surfaces.

### Gradient System
Gradient-free. Depth comes from warm surface tones and light/dark section alternation.

## 3. Typography Rules

### Font Family
- **Headline**: `Anthropic Serif`, fallback: `Georgia`
- **Body / UI**: `Anthropic Sans`, fallback: `Arial`
- **Code**: `Anthropic Mono`, fallback: `Arial`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Display / Hero | Anthropic Serif | 64px | 500 | 1.10 | normal |
| Section Heading | Anthropic Serif | 52px | 500 | 1.20 | normal |
| Sub-heading Large | Anthropic Serif | 36px | 500 | 1.30 | normal |
| Sub-heading | Anthropic Serif | 32px | 500 | 1.10 | normal |
| Feature Title | Anthropic Serif | 20.8px | 500 | 1.20 | normal |
| Body Large | Anthropic Sans | 20px | 400 | 1.60 | normal |
| Body Standard | Anthropic Sans | 16px | 400-500 | 1.25-1.60 | normal |
| Caption | Anthropic Sans | 14px | 400 | 1.43 | normal |
| Label | Anthropic Sans | 12px | 400-500 | 1.25-1.60 | 0.12px |
| Code | Anthropic Mono | 15px | 400 | 1.60 | -0.32px |

### Principles
- Serif for authority, sans for utility. Serif carries content headlines, sans handles UI.
- Single weight for serifs — all 500, creating a consistent voice.
- Relaxed body line-height (1.60) — closer to a book than a dashboard.
- Micro letter-spacing on labels (12px and below) to maintain readability.

## 4. Component Styles

### Buttons
**Warm Sand (Secondary)**: Background `#e8e6dc`, text `#4d4c48`, radius 8px, ring shadow.
**Brand Terracotta (Primary CTA)**: Background `#c96442`, text `#faf9f5`, radius 8-12px.
**White Surface**: Background `#ffffff`, text `#141413`, radius 12px.
**Dark Charcoal**: Background `#30302e`, text `#faf9f5`, radius 8px.

### Cards & Containers
Background Ivory (`#faf9f5`) or White on light; Dark Surface (`#30302e`) on dark.
Border 1px solid Border Cream on light; 1px solid `#30302e` on dark.
Radius 8px (standard), 16px (featured), 32px (hero).
Shadow whisper-soft: `rgba(0,0,0,0.05) 0px 4px 24px`.

### Inputs & Forms
Text `#141413`, radius 12px, focus ring with Focus Blue (`#3898ec`).

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 3, 4, 6, 8, 10, 12, 16, 20, 24, 30px

### Grid & Container
- Max width: ~1200px, centered
- Section spacing: 80-120px between major sections

### Border Radius Scale
- 4px (sharp), 6-7.5px (subtle), 8px (standard), 12px (generous), 16px (very), 24px (high), 32px (maximum)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, no border | Backgrounds |
| Contained | 1px solid border | Standard cards |
| Ring | 0px 0px 0px 1px ring shadows | Interactive elements |
| Whisper | rgba(0,0,0,0.05) 0px 4px 24px | Elevated features |

Depth comes from ring shadows and warm background alternation, not drop shadows.

## 7. Do's and Don'ts

### Do
- Use Parchment (`#f5f4ed`) as primary light background
- Use Anthropic Serif weight 500 for all headlines
- Use Terracotta Brand (`#c96442`) only for primary CTAs
- Keep all neutrals warm-toned
- Use ring shadows for interactive states
- Maintain serif/sans hierarchy

### Don't
- No cool blue-grays — palette is exclusively warm
- No bold (700+) on Anthropic Serif — 500 is the ceiling
- No saturated colors beyond Terracotta
- No sharp corners (< 6px) on buttons or cards
- No heavy drop shadows
- No pure white (`#ffffff`) as page background
- No sans-serif for headlines

## 8. Responsive Behavior

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Small Mobile | <479px | Stacked, compact type |
| Mobile | 479-640px | Single column, hamburger nav |
| Tablet | 768-991px | 2-column grids begin |
| Desktop | 992px+ | Full layout, 64px hero type |

Touch target minimum: 44x44px.

## 9. Agent Prompt Guide

### Quick Color Reference
- Brand CTA: Terracotta Brand (`#c96442`)
- Page Background: Parchment (`#f5f4ed`)
- Card Surface: Ivory (`#faf9f5`)
- Primary Text: Anthropic Near Black (`#141413`)
- Secondary Text: Olive Gray (`#5e5d59`)
- Borders: Border Cream (`#f0eee6`)

### Ready-to-Use Prompts
- "Hero section on Parchment, headline 64px Anthropic Serif 500, Terracotta CTA button"
- "Feature card on Ivory, 1px Border Cream, 8px radius, Olive Gray description"
- "Dark section on Near Black, Ivory headline, Warm Silver body text"
