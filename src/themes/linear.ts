/**
 * Linear Theme
 * 
 * Inspired by Linear.app - Ultra-minimal dark theme with purple accent.
 * Precision engineering aesthetic with crisp edges.
 */

export const linearTheme = {
  name: 'linear' as const,
  displayName: 'Linear',
  cssVariables: {
    // Backgrounds - darker and more pure
    '--rk-bg-primary': '#0d0d0f',
    '--rk-bg-secondary': '#18181b',
    '--rk-bg-tertiary': '#27272a',
    
    // Borders - very subtle
    '--rk-border': '#27272a',
    '--rk-border-subtle': '#3f3f46',
    
    // Text - high contrast
    '--rk-text-primary': '#fafafa',
    '--rk-text-secondary': '#a1a1aa',
    '--rk-text-tertiary': '#71717a',
    
    // Accent - Linear purple
    '--rk-accent': '#8b5cf6',
    '--rk-accent-hover': '#a78bfa',
    '--rk-accent-muted': 'rgba(139, 92, 246, 0.12)',
    
    // Status
    '--rk-success': '#22c55e',
    '--rk-success-muted': 'rgba(34, 197, 94, 0.12)',
    '--rk-warning': '#eab308',
    '--rk-warning-muted': 'rgba(234, 179, 8, 0.12)',
    '--rk-error': '#ef4444',
    '--rk-error-muted': 'rgba(239, 68, 68, 0.12)',
    
    // Typography
    '--rk-font-sans': '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    '--rk-font-mono': '"JetBrains Mono", "SF Mono", Consolas, monospace',
    
    // Spacing & Radius - tighter, crisp
    '--rk-radius-sm': '3px',
    '--rk-radius-md': '6px',
    '--rk-radius-lg': '8px',
    
    // Shadows - subtle
    '--rk-shadow': '0 1px 2px rgba(0, 0, 0, 0.4)',
    
    // Chart colors - vibrant against dark
    '--rk-chart-1': '#8b5cf6',
    '--rk-chart-2': '#22c55e',
    '--rk-chart-3': '#eab308',
    '--rk-chart-4': '#ec4899',
    '--rk-chart-5': '#06b6d4',
    '--rk-chart-6': '#f97316',
  }
}

export default linearTheme
