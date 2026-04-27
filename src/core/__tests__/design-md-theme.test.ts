import { describe, expect, it } from 'vitest'
import { loadDesignMd, parseDesignMd } from '../../themes'

const cmbDesignMd = `
Design System: China Merchants Bank

1. Visual Theme & Atmosphere
The primary brand color is the distinctive CMB Red (Pantone 193 / #c8152d), representing vitality.
Pure white canvas with CMB Red (Pantone 193 / #c8152d) as the primary brand color.
The typography uses Founder Lanting Hei (方正兰亭黑) and Arial for English text.

2. Color Palette & Roles
Primary Brand Colors
- CMB Red (#c8152d / Pantone 193): Primary brand color, CTA buttons, active states, brand accent
- CMB Black (#000000 / Pantone Black): Primary text color, official communications

Gray Scale
- CMB Black (K100): Primary text
- Dark Gray (K80): Strong emphasis
- Medium Gray (K60): Secondary text
- Light Gray (K30): Subtle text
- Very Light Gray (K20): Hints
- CMB White (K0): White space

3. Typography Rules
Chinese Font Family
- Primary: Founder Lanting Hei (方正兰亭黑) — never substitute with other fonts
English Font Family
- Primary: Arial — never substitute with other fonts
`

const wiredDesignMd = `
# Design System Inspired by WIRED

## 1. Visual Theme & Atmosphere
There is exactly one accent color that matters: a saturated link blue (\`#057dbc\`) that lights up underlined hover states.
Everything else is black, paper white, and two grays.

## 2. Color Palette & Roles
### Primary (Editorial Ink)
- **WIRED Black** (\`#000000\`): Pure ink for ribbons, section dividers, button borders, headline rules.
- **Page Ink** (\`#1a1a1a\`): Near-black used for headlines and body type.
- **Paper White** (\`#ffffff\`): Default canvas for the entire site.

### Secondary (Editorial Voice)
- **Link Blue** (\`#057dbc\`): The single brand accent. Used for inline link hovers and breadcrumbs.

### Neutrals & Text
- **Caption Gray** (\`#757575\`): Secondary metadata: bylines, timestamps, photo credits.
- **Disabled Gray** (\`#999999\`): Inactive links, low-priority labels.
- **Hairline Border** (\`#e2e8f0\`): Subtle separators only.

## 3. Typography Rules
### Font Family
- **WiredDisplay** (custom serif, fallback \`helvetica\`) — Display headlines and feature titles.
- **BreveText** (humanist serif, fallback \`helvetica\`) — Article body, decks, longer captions.
- **Apercu** (geometric sans, fallback \`helvetica\`) — UI labels, buttons, navigation.
- **WiredMono** (custom monospace, fallback \`helvetica\`) — Eyebrows, kickers, timestamps.
- **Inter** (sans, system fallback) — Utility UI in newer modules.

## 5. Layout Principles
### Border Radius Scale
- \`0\` — every container, every image, every button, every input. The default.
- \`1920px\` — only inside text spans that need to look like a full pill.
- \`50%\` — only on round icon buttons and circular author avatars.

## 6. Depth & Elevation
WIRED's depth philosophy is flat by religion. There are no shadows and no box-shadow on story tiles, headers, modals, or cards.
`

const starbucksDesignMd = `
# Design System Inspired by Starbucks

## 1. Visual Theme & Atmosphere
Starbucks uses warm-neutral canvas (#f2f0eb / #edebe9), Starbucks Green (#006241), Green Accent (#00754A), and House Green (#1E3932).
Typography uses SoDoSans with tight tracking, Rewards serif "Lander Tall", and Careers script "Kalam".

## 2. Color Palette & Roles
- **Starbucks Green** (\`#006241\`): historic brand green used on h1 headings.
- **Green Accent** (\`#00754A\`): primary filled-CTA color and floating Frap button fill.
- **House Green** (\`#1E3932\`): footer surface and feature-band backgrounds.
- **Green Uplift** (\`#2b5148\`): secondary mid-dark green.
- **Green Light** (\`#d4e9e2\`): valid state tint.
- **Gold** (\`#cba258\`): Rewards-status ceremony only.
- **Neutral Warm** (\`#f2f0eb\`): primary page canvas.
- **Ceramic** (\`#edebe9\`): soft page-section wash.
- **White** (\`#ffffff\`): primary card and modal surface.
- **Black** (\`#000000\`): high-contrast top-nav sign-in buttons.
- **Text Black** (\`rgba(0, 0, 0, 0.87)\`): primary heading and body text.
- **Text Black Soft** (\`rgba(0, 0, 0, 0.58)\`): secondary metadata text.
- **Red** (\`#c82014\`): error and destructive state.
- **Yellow** (\`#fbbc05\`): warning state.

## 3. Typography Rules
- **Primary:** \`SoDoSans, "Helvetica Neue", Helvetica, Arial, sans-serif\`
- **Rewards Serif:** \`"Lander Tall", "Iowan Old Style", Georgia, serif\`
- **Careers Script:** \`"Kalam", "Comic Sans MS", cursive\`

## 5. Layout Principles
### Border Radius Scale
- \`12px\` | Cards, modals, menu-item tiles.
- \`50px\` | All buttons — full-pill radius.

## 6. Depth & Elevation
Card shadow: \`0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)\`.
Whisper-soft, layered over solid surfaces.
`

describe('DESIGN.md theme loading', () => {
  it('maps a semi-structured CMB brand document to Vizual theme roles', () => {
    const tokens = parseDesignMd(cmbDesignMd)
    const theme = loadDesignMd(cmbDesignMd, { name: 'cmb-unit', apply: false })

    expect(tokens.colors).toContainEqual({ name: 'accent', value: '#c8152d' })
    expect(tokens.colors).toContainEqual({ name: 'background', value: 'K0' })
    expect(tokens.colors).toContainEqual({ name: 'text', value: '#000000' })

    expect(theme.mode).toBe('light')
    expect(theme.cssVariables['--rk-accent']).toBe('#c8152d')
    expect(theme.cssVariables['--rk-bg-primary']).toBe('#ffffff')
    expect(theme.cssVariables['--rk-text-primary']).toBe('#000000')
    expect(theme.cssVariables['--rk-chart-1']).toBe('#c8152d')
    expect(theme.cssVariables['--rk-font-sans']).toContain('Founder Lanting Hei')
    expect(theme.cssVariables['--rk-font-display']).toContain('Founder Lanting Hei')
    expect(theme.cssVariables['--rk-font-body']).toContain('Founder Lanting Hei')
    expect(theme.cssVariables['--rk-font-sans']).toContain('Arial')
    expect(theme._mappingReport?.mappedVariables).toContain('--rk-accent')
    expect(theme._mappingReport?.fallbackCount).toBeGreaterThan(0)
    expect(theme._mappingReport?.qualityScore).toBeGreaterThan(30)
  })

  it('maps a WIRED-style editorial document without treating WIRED as error red', () => {
    const tokens = parseDesignMd(wiredDesignMd)
    const theme = loadDesignMd(wiredDesignMd, { name: 'wired-unit', apply: false })

    expect(tokens.colors).toContainEqual({ name: 'accent', value: '#057dbc' })
    expect(tokens.colors).toContainEqual({ name: 'background', value: '#ffffff' })
    expect(tokens.colors).toContainEqual({ name: 'text', value: '#000000' })

    expect(theme.mode).toBe('light')
    expect(theme.cssVariables['--rk-accent']).toBe('#057dbc')
    expect(theme.cssVariables['--rk-bg-primary']).toBe('#ffffff')
    expect(theme.cssVariables['--rk-text-primary']).toBe('#000000')
    expect(theme.cssVariables['--rk-text-secondary']).toBe('#757575')
    expect(theme.cssVariables['--rk-border']).toBe('#000000')
    expect(theme.cssVariables['--rk-border-subtle']).toBe('#e2e8f0')
    expect(theme.cssVariables['--rk-chart-1']).toBe('#057dbc')
    expect(theme.cssVariables['--rk-radius-md']).toBe('0px')
    expect(theme.cssVariables['--rk-font-display']).toContain('WiredDisplay')
    expect(theme.cssVariables['--rk-font-display']).toContain('Georgia')
    expect(theme.cssVariables['--rk-font-body']).toContain('BreveText')
    expect(theme.cssVariables['--rk-font-body']).toContain('Georgia')
    expect(theme.cssVariables['--rk-font-ui']).toContain('Apercu')
    expect(theme.cssVariables['--rk-font-ui']).toContain('Helvetica')
    expect(theme.cssVariables['--rk-font-mono']).toContain('WiredMono')
    expect(theme.cssVariables['--rk-font-sans']).toContain('Apercu')
    expect(theme.cssVariables['--rk-shadow']).toBe('none')
    expect(theme._mappingReport?.roles.error).toBe(false)
    expect(Array.isArray(theme._mappingReport?.unsupportedTokens)).toBe(true)
    expect(theme._mappingReport?.mappedCount).toBeGreaterThan(10)
  })

  it('maps a Starbucks-style retail document with warm canvas and pill/card geometry', () => {
    const tokens = parseDesignMd(starbucksDesignMd)
    const theme = loadDesignMd(starbucksDesignMd, { name: 'starbucks-unit', apply: false })

    expect(tokens.colors).toContainEqual({ name: 'accent', value: '#00754A' })
    expect(tokens.colors).toContainEqual({ name: 'background', value: '#f2f0eb' })
    expect(tokens.colors).toContainEqual({ name: 'text-primary', value: 'rgba(0, 0, 0, 0.87)' })

    expect(theme.mode).toBe('light')
    expect(theme.cssVariables['--rk-accent']).toBe('#00754A')
    expect(theme.cssVariables['--rk-bg-primary']).toBe('#f2f0eb')
    expect(theme.cssVariables['--rk-bg-secondary']).toBe('#ffffff')
    expect(theme.cssVariables['--rk-bg-tertiary']).toBe('#edebe9')
    expect(theme.cssVariables['--rk-text-primary']).toBe('rgba(0, 0, 0, 0.87)')
    expect(theme.cssVariables['--rk-text-secondary']).toBe('rgba(0, 0, 0, 0.58)')
    expect(theme.cssVariables['--rk-error']).toBe('#c82014')
    expect(theme.cssVariables['--rk-warning']).toBe('#cba258')
    expect(theme.cssVariables['--rk-chart-1']).toBe('#00754A')
    expect(theme.cssVariables['--rk-radius-md']).toBe('12px')
    expect(theme.cssVariables['--rk-radius-pill']).toBe('50px')
    expect(theme.cssVariables['--rk-shadow']).toBe('0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)')
    expect(theme.cssVariables['--rk-font-display']).toContain('SoDoSans')
    expect(theme.cssVariables['--rk-font-serif']).toContain('Lander Tall')
    expect(theme.cssVariables['--rk-font-script']).toContain('Kalam')
  })
})
