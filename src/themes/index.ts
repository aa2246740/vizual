/**
 * Theme Registry
 *
 * Central registry for all RenderKit themes.
 * Provides theme registration, retrieval, and application.
 *
 * 支持 Dark/Light 模式切换：
 *   import { setGlobalTheme, toggleMode } from 'vizual'
 *   setGlobalTheme('default-dark')  // 应用暗色主题
 *   toggleMode()                    // 切换为亮色
 *
 * 支持 DESIGN.md 方式配置主题：
 *   import { loadDesignMd } from 'vizual'
 *   const theme = loadDesignMd(markdown, { apply: true })
 */

export interface Theme {
  name: string
  displayName: string
  cssVariables: Record<string, string>
  /** 'dark' or 'light' — 用于模式切换 */
  mode?: 'dark' | 'light'
  /** 映射完整度报告（仅 mapDesignTokensToTheme 产生） */
  _mappingReport?: import('./design-md-mapper').ThemeMappingReport
}

// DESIGN.md 支持
export { parseDesignMd } from './design-md-parser'
export type { DesignTokens, ColorToken, TypographyToken, SpacingToken, RadiusToken } from './design-md-parser'
export { mapDesignTokensToTheme, invertTheme } from './design-md-mapper'
export type { ThemeMappingReport } from './design-md-mapper'

// Internal registry storage
const themes = new Map<string, Theme>()

/** 当前生效的主题名 */
let currentThemeName: string = 'claude-dark'

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
 * Get the currently active theme name
 */
export function getCurrentThemeName(): string {
  return currentThemeName
}

/**
 * 找到同一主题系列中另一个模式的变体名
 * 如 'default-dark' → 'default-light', 'linear' → 'linear-light'
 */
function findVariant(themeName: string, targetMode: 'dark' | 'light'): string | null {
  const theme = themes.get(themeName)
  if (!theme) return null

  // 1. 尝试直接名替换：'xxx-dark' → 'xxx-light'
  if (themeName.endsWith('-dark')) {
    const candidate = themeName.replace(/-dark$/, '-light')
    if (themes.has(candidate)) return candidate
  }
  if (themeName.endsWith('-light')) {
    const candidate = themeName.replace(/-light$/, '-dark')
    if (themes.has(candidate)) return candidate
  }

  // 2. 在注册表中搜索同名前缀 + 目标 mode
  const prefix = themeName.replace(/-dark$/, '').replace(/-light$/, '')
  for (const [name, t] of themes) {
    if (name !== themeName && t.mode === targetMode) {
      // 检查是否是同系列（前缀匹配或 displayName 相似）
      if (name.startsWith(prefix) || t.displayName === theme.displayName.replace('(Dark)', '(Light)').replace('(Light)', '(Dark)')) {
        return name
      }
    }
  }

  return null
}

/**
 * 切换 Dark ↔ Light 模式
 *
 * 查找当前主题的对应变体并应用。
 * 如果找不到已注册的变体，自动用 invertTheme() 生成。
 *
 * @returns 切换后的 mode ('dark' | 'light')
 */
export function toggleMode(): 'dark' | 'light' {
  const current = themes.get(currentThemeName)
  if (!current) return 'dark'

  const currentMode = current.mode || 'dark'
  const targetMode = currentMode === 'dark' ? 'light' : 'dark'

  // 查找已注册的变体
  const variantName = findVariant(currentThemeName, targetMode)

  if (variantName) {
    setGlobalTheme(variantName)
    return targetMode
  }

  // 没有已注册变体 → 自动生成（使用顶层已导入的 invertThemeFn）
  const inverted = invertThemeFn(current)

  registerTheme(inverted.name, inverted)
  setGlobalTheme(inverted.name)

  return targetMode
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

  // 移除所有已知的 theme class
  for (const cls of Array.from(container.classList)) {
    if (cls.startsWith('rk-theme-')) {
      container.classList.remove(cls)
    }
  }

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
.rk-theme-${theme.name} * {
${cssRules}
}
  `.trim()

  // Sync theme colors to the runtime color cache synchronously
  // Must be sync so that renderAll() after setGlobalTheme() uses correct colors
  updateActiveColors(theme)

  currentThemeName = themeName

  // 通知所有 ECharts 图表实例重建 option（主题色已变）
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('vizual-theme-change', { detail: { themeName } }))
  }
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

// Export the Theme type for external use
export type { Theme as ThemeDefinition }

// ─── 预设主题自动注册 ──────────────────────────────────
import { defaultDarkTheme } from './default-dark'
import { defaultLightTheme } from './default-light'
import { claudeDarkTheme } from './claude-dark'
import { claudeLightTheme } from './claude-light'
import { linearTheme } from './linear'
import { vercelTheme } from './vercel'
import { invertTheme as invertThemeFn } from './design-md-mapper'
import { updateActiveColors } from '../core/theme-colors'

registerTheme('default-dark', defaultDarkTheme)
registerTheme('default-light', defaultLightTheme)
registerTheme('claude-dark', claudeDarkTheme)
registerTheme('claude-light', claudeLightTheme)
registerTheme('linear', linearTheme)
registerTheme('vercel', vercelTheme)

// 自动为只有 dark 的预设生成 light 变体
registerTheme('linear-light', invertThemeFn(linearTheme))
registerTheme('vercel-light', invertThemeFn(vercelTheme))

// 自动应用默认主题，确保 CSS 变量在首次渲染前就已注入 DOM
if (typeof document !== 'undefined' && document.body) {
  applyTheme(document.body as unknown as HTMLElement, currentThemeName)
}

// ─── DESIGN.md 公共 API ──────────────────────────────────

import { parseDesignMd } from './design-md-parser'
import { mapDesignTokensToTheme } from './design-md-mapper'

export interface LoadDesignMdOptions {
  /** 主题名称（默认自动生成） */
  name?: string
  /** 是否立即应用主题到 document.body */
  apply?: boolean
  /** 是否立即注册主题（默认 true） */
  register?: boolean
}

/**
 * 从 DESIGN.md markdown 加载主题
 *
 * @param markdown DESIGN.md 文件内容
 * @param options 配置选项
 * @returns 解析并映射后的 Theme 对象
 *
 * @example
 * ```ts
 * import { loadDesignMd } from 'vizual'
 *
 * // 方式1: 解析 + 注册 + 全局应用
 * const theme = loadDesignMd(designMdContent, { apply: true })
 *
 * // 方式2: 只解析 + 注册，手动应用到特定容器
 * const theme = loadDesignMd(designMdContent)
 * applyTheme(container, theme.name)
 *
 * // 方式3: 只解析不注册
 * const theme = loadDesignMd(designMdContent, { register: false })
 * ```
 */
export function loadDesignMd(
  markdown: string,
  options: LoadDesignMdOptions = {}
): Theme {
  const {
    name = 'design-md',
    apply = false,
    register = true,
  } = options

  // 1. 解析 DESIGN.md
  const tokens = parseDesignMd(markdown)

  // 2. 映射为 Theme
  const theme = mapDesignTokensToTheme(tokens, name)

  // 3. 注册 + 自动生成反转变体
  if (register) {
    registerTheme(name, theme)
    // 自动注册反转主题（如 design-md → design-md-light 或 design-md-dark）
    const inverted = invertThemeFn(theme)
    registerTheme(inverted.name, inverted)
  }

  // 4. 应用
  if (apply && typeof document !== 'undefined') {
    setGlobalTheme(name)
  }

  return theme
}
