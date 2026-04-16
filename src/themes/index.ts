/**
 * Theme Registry
 *
 * Central registry for all RenderKit themes.
 * Provides theme registration, retrieval, and application.
 */

export interface Theme {
  name: string
  displayName: string
  cssVariables: Record<string, string>
}

// Internal registry storage
const themes = new Map<string, Theme>()

/**
 * Register a new theme with the registry
 */
export function registerTheme(name: string, theme: Theme): void {
  themes.set(name, theme)
}

/**
 * Get a theme by name
 */
export function getTheme(name: string): Theme | undefined {
  return themes.get(name)
}

/**
 * Get all registered theme names
 */
export function getThemeNames(): string[] {
  return Array.from(themes.keys())
}

/**
 * Apply a theme to a specific container element by injecting CSS variables
 */
export function applyTheme(container: HTMLElement, themeName: string): boolean {
  const theme = getTheme(themeName)
  if (!theme) {
    console.warn(`[RenderKit] Theme "${themeName}" not found`)
    return false
  }

  // Remove any existing theme class
  container.classList.remove('rk-theme-default-dark', 'rk-theme-linear', 'rk-theme-vercel')

  // Add the new theme class
  container.classList.add(`rk-theme-${theme.name}`)

  // Inject CSS variables as inline styles
  const styleId = 'rk-theme-variables'
  let styleEl = document.getElementById(styleId)

  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = styleId
    document.head.appendChild(styleEl)
  }

  // Build CSS variable rules for the container
  const cssRules = Object.entries(theme.cssVariables)
    .map(([key, value]) => {
      // Handle nested selectors
      if (key.includes(':')) {
        return `  ${key} { ${value} }`
      }
      return `  ${key}: ${value};`
    })
    .join('\n')

  styleEl.textContent = `
.rk-theme-${theme.name} {
${cssRules}
}
  `.trim()

  // Sync theme colors to the runtime color cache
  // (imported lazily to avoid circular deps)
  import('../core/theme-colors').then(({ updateActiveColors }) => {
    updateActiveColors(themeName)
  })

  return true
}

/**
 * Apply a theme globally to the document body
 */
export function setGlobalTheme(themeName: string): boolean {
  if (typeof document === 'undefined') {
    return false
  }
  return applyTheme(document.body as unknown as HTMLElement, themeName)
}

// Auto-register built-in themes
import { defaultDarkTheme } from './default-dark'
import { linearTheme } from './linear'
import { vercelTheme } from './vercel'

registerTheme(defaultDarkTheme.name, defaultDarkTheme)
registerTheme(linearTheme.name, linearTheme)
registerTheme(vercelTheme.name, vercelTheme)

// Export the Theme type for external use
export type { Theme as ThemeDefinition }
