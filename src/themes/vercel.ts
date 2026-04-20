/**
 * Vercel Theme
 * 
 * Inspired by Vercel's design system - Pure black and white, no gradients.
 * Monospace-first, blueprint precision aesthetic.
 */

export const vercelTheme = {
  name: 'vercel' as const,
  displayName: 'Vercel',
  cssVariables: {
    // Backgrounds - pure black and white only
    '--rk-bg-primary': '#000000',
    '--rk-bg-secondary': '#111111',
    '--rk-bg-tertiary': '#1a1a1a',
    
    // Borders - sharp white at low opacity
    '--rk-border': 'rgba(255, 255, 255, 0.1)',
    '--rk-border-subtle': 'rgba(255, 255, 255, 0.06)',
    
    // Text - pure white for primary
    '--rk-text-primary': '#ffffff',
    '--rk-text-secondary': '#888888',
    '--rk-text-tertiary': '#666666',
    
    // Accent - Vercel blue
    '--rk-accent': '#ffffff',
    '--rk-accent-hover': '#ffffff',
    '--rk-accent-muted': 'rgba(255, 255, 255, 0.1)',
    
    // Status - monochrome
    '--rk-success': '#ffffff',
    '--rk-success-muted': 'rgba(255, 255, 255, 0.1)',
    '--rk-warning': '#ffffff',
    '--rk-warning-muted': 'rgba(255, 255, 255, 0.1)',
    '--rk-error': '#ffffff',
    '--rk-error-muted': 'rgba(255, 255, 255, 0.1)',
    
    // Typography - monospace primary
    '--rk-font-sans': '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '--rk-font-mono': '"Geist Mono", "SF Mono", "Fira Code", Consolas, monospace',
    
    // Spacing & Radius - minimal
    '--rk-radius-sm': '2px',
    '--rk-radius-md': '4px',
    '--rk-radius-lg': '6px',
    
    // Shadows - none
    '--rk-shadow': 'none',
    
    // Chart colors - grayscale with white accent
    '--rk-chart-1': '#ffffff',
    '--rk-chart-2': '#888888',
    '--rk-chart-3': '#666666',
    '--rk-chart-4': '#444444',
    '--rk-chart-5': '#cccccc',
    '--rk-chart-6': '#333333',
  },
  mode: 'dark' as const,
}

export default vercelTheme
