/**
 * Claude Light Theme
 *
 * Inspired by Anthropic's Claude interface — parchment canvas,
 * warm terracotta accents, editorial serif-driven hierarchy.
 */

export const claudeLightTheme = {
  name: 'claude-light' as const,
  displayName: 'Claude Light',
  cssVariables: {
    // Backgrounds — warm parchment tones
    '--rk-bg-primary': '#f5f4ed',
    '--rk-bg-secondary': '#faf9f5',
    '--rk-bg-tertiary': '#e8e6dc',

    // Borders — cream-tinted
    '--rk-border': '#e8e6dc',
    '--rk-border-subtle': '#f0eee6',

    // Text — warm neutrals
    '--rk-text-primary': '#141413',
    '--rk-text-secondary': '#5e5d59',
    '--rk-text-tertiary': '#87867f',

    // Accent — terracotta brand
    '--rk-accent': '#c96442',
    '--rk-accent-hover': '#d97757',
    '--rk-accent-muted': 'rgba(201, 100, 66, 0.12)',

    // Status
    '--rk-success': '#10b981',
    '--rk-success-muted': 'rgba(16, 185, 129, 0.12)',
    '--rk-warning': '#f59e0b',
    '--rk-warning-muted': 'rgba(245, 158, 11, 0.12)',
    '--rk-error': '#b53333',
    '--rk-error-muted': 'rgba(181, 51, 51, 0.12)',

    // Typography — Anthropic font stack
    '--rk-font-sans': 'Georgia, "Anthropic Serif", serif',
    '--rk-font-mono': '"SF Mono", "Fira Code", Consolas, monospace',
    '--rk-text-xs': '11px',
    '--rk-text-sm': '12px',
    '--rk-text-base': '13px',
    '--rk-text-md': '14px',
    '--rk-text-lg': '16px',
    '--rk-text-xl': '20px',
    '--rk-text-2xl': '24px',
    '--rk-weight-normal': '400',
    '--rk-weight-medium': '500',
    '--rk-weight-semibold': '600',
    '--rk-weight-bold': '700',

    // Spacing — 8px base
    '--rk-space-1': '4px',
    '--rk-space-2': '8px',
    '--rk-space-3': '12px',
    '--rk-space-4': '16px',
    '--rk-space-5': '20px',
    '--rk-space-6': '24px',

    // Radius — generous, approachable
    '--rk-radius-xs': '4px',
    '--rk-radius-sm': '6px',
    '--rk-radius-md': '8px',
    '--rk-radius-lg': '12px',
    '--rk-radius-xl': '16px',
    '--rk-radius-pill': '9999px',

    // Shadows — whisper-soft warm
    '--rk-shadow': 'rgba(0,0,0,0.05) 0px 4px 24px',

    // Chart colors — warm, muted palette
    '--rk-chart-1': '#c96442',
    '--rk-chart-2': '#10b981',
    '--rk-chart-3': '#d4a853',
    '--rk-chart-4': '#8b6cc1',
    '--rk-chart-5': '#5b9bd5',
    '--rk-chart-6': '#6dbe8a',
  },
  mode: 'light' as const,
}
