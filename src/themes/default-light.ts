/**
 * Default Light Theme
 *
 * Clean light theme with blue accent, high readability.
 * Suitable for well-lit environments and accessibility preferences.
 */

export const defaultLightTheme = {
  name: 'default-light' as const,
  displayName: 'Default Light',
  cssVariables: {
    // Backgrounds
    '--rk-bg-primary': '#ffffff',
    '--rk-bg-secondary': '#f8fafc',
    '--rk-bg-tertiary': '#f1f5f9',

    // Borders
    '--rk-border': '#e2e8f0',
    '--rk-border-subtle': '#cbd5e1',

    // Text
    '--rk-text-primary': '#0f172a',
    '--rk-text-secondary': '#475569',
    '--rk-text-tertiary': '#94a3b8',

    // Accent
    '--rk-accent': '#3b82f6',
    '--rk-accent-hover': '#2563eb',
    '--rk-accent-muted': 'rgba(59, 130, 246, 0.1)',

    // Status
    '--rk-success': '#16a34a',
    '--rk-success-muted': 'rgba(22, 163, 74, 0.1)',
    '--rk-warning': '#d97706',
    '--rk-warning-muted': 'rgba(217, 119, 6, 0.1)',
    '--rk-error': '#dc2626',
    '--rk-error-muted': 'rgba(220, 38, 38, 0.1)',

    // Typography
    '--rk-font-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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

    // Spacing
    '--rk-space-1': '4px',
    '--rk-space-2': '8px',
    '--rk-space-3': '12px',
    '--rk-space-4': '16px',
    '--rk-space-5': '20px',
    '--rk-space-6': '24px',

    // Radius
    '--rk-radius-xs': '2px',
    '--rk-radius-sm': '4px',
    '--rk-radius-md': '8px',
    '--rk-radius-lg': '10px',
    '--rk-radius-xl': '12px',
    '--rk-radius-pill': '9999px',

    // Shadows
    '--rk-shadow': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',

    // Chart colors
    '--rk-chart-1': '#3b82f6',
    '--rk-chart-2': '#16a34a',
    '--rk-chart-3': '#d97706',
    '--rk-chart-4': '#ec4899',
    '--rk-chart-5': '#8b5cf6',
    '--rk-chart-6': '#06b6d4',
  },
  mode: 'light' as const,
}

export default defaultLightTheme
