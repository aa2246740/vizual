/**
 * Default Dark Theme
 * 
 * The baseline theme matching the current hardcoded styles.
 * Deep dark background with subtle borders and muted accents.
 */

export const defaultDarkTheme = {
  name: 'default-dark' as const,
  displayName: 'Default Dark',
  cssVariables: {
    // Backgrounds
    '--rk-bg-primary': '#0f1117',
    '--rk-bg-secondary': '#1e293b',
    '--rk-bg-tertiary': '#252836',
    
    // Borders
    '--rk-border': '#1e293b',
    '--rk-border-subtle': '#2d3148',
    
    // Text
    '--rk-text-primary': '#e2e8f0',
    '--rk-text-secondary': '#94a3b8',
    '--rk-text-tertiary': '#64748b',
    
    // Accent
    '--rk-accent': '#667eea',
    '--rk-accent-hover': '#7c8ff5',
    '--rk-accent-muted': 'rgba(102, 126, 234, 0.15)',
    
    // Status
    '--rk-success': '#10b981',
    '--rk-success-muted': 'rgba(16, 185, 129, 0.15)',
    '--rk-warning': '#f59e0b',
    '--rk-warning-muted': 'rgba(245, 158, 11, 0.15)',
    '--rk-error': '#ef4444',
    '--rk-error-muted': 'rgba(239, 68, 68, 0.15)',
    
    // Typography
    '--rk-font-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '--rk-font-mono': '"SF Mono", "Fira Code", Consolas, monospace',
    
    // Spacing & Radius
    '--rk-radius-sm': '4px',
    '--rk-radius-md': '8px',
    '--rk-radius-lg': '10px',
    
    // Shadows
    '--rk-shadow': '0 4px 12px rgba(0, 0, 0, 0.3)',
    
    // Chart colors
    '--rk-chart-1': '#667eea',
    '--rk-chart-2': '#10b981',
    '--rk-chart-3': '#f59e0b',
    '--rk-chart-4': '#ec4899',
    '--rk-chart-5': '#8b5cf6',
    '--rk-chart-6': '#06b6d4',
  }
}

export default defaultDarkTheme
