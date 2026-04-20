/**
 * Theme Colors — 主题颜色统一获取接口
 *
 * 所有 renderer 通过此模块获取颜色值，而非硬编码。
 * 当 setGlobalTheme() 被调用时，颜色缓存自动更新。
 *
 * 两个获取函数：
 *   tc(varName)  → 解析后的具体值，如 '#c8152d'（仅用于 ECharts 等 JS-only 场景）
 *   tcss(varName) → CSS var() 引用，如 'var(--rk-accent)'（用于 React inline style，永远响应主题切换）
 *
 * 使用原则：
 *   React 组件 inline style → 用 tcss()
 *   ECharts option / JS 计算 → 用 tc()
 */

import { defaultDarkTheme } from '../themes/default-dark'
import { defaultLightTheme } from '../themes/default-light'
import { getTheme } from '../themes'

/** 暗色默认颜色表 */
const defaultDarkColors: Record<string, string> = { ...defaultDarkTheme.cssVariables }

/** 亮色默认颜色表 */
const defaultLightColors: Record<string, string> = { ...defaultLightTheme.cssVariables }

/** 当前生效的颜色缓存 */
let activeColors: Record<string, string> = { ...defaultDarkColors }

/**
 * 更新颜色缓存 — 在主题切换时由 themes/index.ts 调用
 *
 * 根据主题的 mode 选择正确的 fallback 基底：
 *   - dark 模式 → defaultDarkTheme 作为缺失变量的 fallback
 *   - light 模式 → defaultLightTheme 作为缺失变量的 fallback
 */
export function updateActiveColors(themeName: string): void {
  const theme = getTheme(themeName)
  if (theme) {
    const fallbackBase = theme.mode === 'light' ? defaultLightColors : defaultDarkColors
    activeColors = { ...fallbackBase, ...theme.cssVariables }
  }
}

/**
 * 获取主题颜色的已解析值（具体色值）
 *
 * 用途：ECharts option、JS 数值计算等需要具体颜色值的场景。
 * React inline style 中应优先使用 tcss()。
 *
 * @param varName CSS 变量名，如 '--rk-bg-primary'
 * @returns 解析后的颜色值，如 '#0f1117'
 */
export function tc(varName: string): string {
  return activeColors[varName] || defaultDarkColors[varName] || ''
}

/**
 * 获取主题颜色的 CSS var() 引用
 *
 * 用途：React inline style 中使用。返回 CSS 变量引用，
 * 由浏览器在 paint 时解析，天然响应主题切换，
 * 无需担心模块级调用或缓存失效问题。
 *
 * @param varName CSS 变量名，如 '--rk-bg-primary'
 * @returns CSS 变量引用，如 'var(--rk-bg-primary)'
 */
export function tcss(varName: string): string {
  return `var(${varName})`
}

/** 便捷方法：获取图表调色板（已解析值，用于 ECharts） */
export function chartColors(count: number): string[] {
  const colors: string[] = []
  for (let i = 1; i <= count; i++) {
    colors.push(tc(`--rk-chart-${i}`))
  }
  return colors.filter(c => c)
}

/** 重置为默认颜色（测试用） */
export function resetColors(): void {
  activeColors = { ...defaultDarkColors }
}
