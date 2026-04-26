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
    expect(theme.cssVariables['--rk-font-sans']).toContain('Arial')
  })
})
