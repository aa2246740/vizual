# Vizual Theme Variables Reference

Complete list of CSS variables used by the vizual theme system, with their default dark values and which component properties consume them.

## Full Variable List (default-dark theme)

```typescript
const defaultDarkTheme = {
  cssVariables: {
    // Backgrounds — consumed by card bodies, panels, page background
    '--rk-bg-primary': '#0f1117',      // page background, main surface
    '--rk-bg-secondary': '#1e293b',    // card background, elevated surface
    '--rk-bg-tertiary': '#252836',     // input background, hover state

    // Borders — consumed by card borders, dividers, input borders
    '--rk-border': '#1e293b',          // standard border
    '--rk-border-subtle': '#2d3148',   // subtle divider, input border

    // Text — consumed by all text elements
    '--rk-text-primary': '#e2e8f0',    // headings, primary text
    '--rk-text-secondary': '#94a3b8',  // secondary text, metadata
    '--rk-text-tertiary': '#64748b',   // hints, disabled text

    // Accent — consumed by CTAs, links, active states, highlights
    '--rk-accent': '#667eea',          // primary accent/brand color
    '--rk-accent-hover': '#7c8ff5',    // accent hover state
    '--rk-accent-muted': 'rgba(102, 126, 234, 0.15)', // accent background tint

    // Status — consumed by alerts, badges, status indicators
    '--rk-success': '#10b981',
    '--rk-success-muted': 'rgba(16, 185, 129, 0.15)',
    '--rk-warning': '#f59e0b',
    '--rk-warning-muted': 'rgba(245, 158, 11, 0.15)',
    '--rk-error': '#ef4444',
    '--rk-error-muted': 'rgba(239, 68, 68, 0.15)',

    // Typography — consumed by font-family style properties
    '--rk-font-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '--rk-font-mono': '"SF Mono", "Fira Code", Consolas, monospace',

    // Text sizes — consumed by fontSize: parseInt(tc('...'))
    '--rk-text-xs': '11px',
    '--rk-text-sm': '12px',
    '--rk-text-base': '13px',
    '--rk-text-md': '14px',
    '--rk-text-lg': '16px',
    '--rk-text-xl': '20px',
    '--rk-text-2xl': '24px',

    // Font weights — consumed by fontWeight: parseInt(tc('...'))
    '--rk-weight-normal': '400',
    '--rk-weight-medium': '500',
    '--rk-weight-semibold': '600',
    '--rk-weight-bold': '700',

    // Spacing — consumed by padding: parseInt(tc('...'))
    '--rk-space-1': '4px',
    '--rk-space-2': '8px',
    '--rk-space-3': '12px',
    '--rk-space-4': '16px',
    '--rk-space-5': '20px',
    '--rk-space-6': '24px',

    // Border radius — consumed by borderRadius: parseInt(tc('...'))
    '--rk-radius-xs': '2px',
    '--rk-radius-sm': '4px',
    '--rk-radius-md': '8px',
    '--rk-radius-lg': '10px',
    '--rk-radius-xl': '12px',
    '--rk-radius-pill': '9999px',

    // Shadow — consumed by elevated surfaces
    '--rk-shadow': '0 4px 12px rgba(0, 0, 0, 0.3)',

    // Chart palette — consumed by ECharts option.color
    '--rk-chart-1': '#667eea',
    '--rk-chart-2': '#10b981',
    '--rk-chart-3': '#f59e0b',
    '--rk-chart-4': '#ec4899',
    '--rk-chart-5': '#8b5cf6',
    '--rk-chart-6': '#06b6d4',
  }
}
```

## Semantic Keyword Map

The mapper (`mapDesignTokensToTheme`) uses these keyword groups to match DESIGN.md color names to `--rk-*` variables. Understanding this helps you choose good semantic names:

| CSS Variable | Keyword Triggers |
|---|---|
| `--rk-accent` | primary, brand, accent, interactive, cta, link, focus |
| `--rk-accent-hover` | primary-hover, accent-hover, brand-hover |
| `--rk-accent-muted` | primary-muted, accent-muted, primary-light, accent-light |
| `--rk-bg-primary` | surface, background, bg, canvas, base, ground, page |
| `--rk-bg-secondary` | surface-secondary, card, elevated, panel |
| `--rk-bg-tertiary` | surface-tertiary, hover, sunken, well, input |
| `--rk-text-primary` | text, on-surface, foreground, content, heading |
| `--rk-text-secondary` | text-secondary, muted, subtle |
| `--rk-text-tertiary` | text-tertiary, disabled, placeholder, hint |
| `--rk-border` | border, divider, stroke, separator |
| `--rk-border-subtle` | border-subtle, border-light, divider-subtle |
| `--rk-error` | error, danger, red, destructive, critical |
| `--rk-success` | success, green, positive, confirmed |
| `--rk-warning` | warning, yellow, amber, caution, alert |

## How components consume these variables

Every vizual component uses `tc()` to read theme values:

```tsx
import { tc } from '../../core/theme-colors'

// Colors (returns string)
background: tc('--rk-bg-primary')
color: tc('--rk-text-secondary')
border: `1px solid ${tc('--rk-border-subtle')}`

// Numeric values (returns number via parseInt)
fontSize: parseInt(tc('--rk-text-sm'))      // → 12
fontWeight: parseInt(tc('--rk-weight-bold')) // → 700
borderRadius: parseInt(tc('--rk-radius-md')) // → 8
padding: parseInt(tc('--rk-space-4'))        // → 16
```

## Chart palette generation

If the DESIGN.md doesn't define chart colors explicitly, the mapper auto-generates a 6-color palette from the accent color using HSL rotation. So even without explicit chart-1~6 tokens, charts will pick up the theme's color scheme.
