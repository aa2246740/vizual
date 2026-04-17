/**
 * Theme Colors — 主题颜色统一获取接口
 *
 * 所有 renderer 通过此模块获取颜色值，而非硬编码。
 * 当 setGlobalTheme() 被调用时，颜色缓存自动更新。
 *
 * 使用方式：
 *   import { tc } from '../core/theme-colors'
 *   container.style.background = tc('--rk-bg-primary')
 */

import { defaultDarkTheme } from '../themes/default-dark'
import { getTheme } from '../themes'

/** 默认颜色表（来自 default-dark 主题） */
const defaultColors: Record<string, string> = { ...defaultDarkTheme.cssVariables }

/** 当前生效的颜色缓存 */
let activeColors: Record<string, string> = { ...defaultColors }

/**
 * 更新颜色缓存 — 在主题切换时由 themes/index.ts 调用
 */
export function updateActiveColors(themeName: string): void {
  const theme = getTheme(themeName)
  if (theme) {
    activeColors = { ...defaultColors, ...theme.cssVariables }
  }
}

/**
 * 获取主题颜色值
 * @param varName CSS 变量名，如 '--rk-bg-primary'
 * @returns 颜色值，如 '#0f1117'
 */
export function tc(varName: string): string {
  return activeColors[varName] || defaultColors[varName] || ''
}

/** 便捷方法：获取图表调色板 */
export function chartColors(count: number): string[] {
  const colors: string[] = []
  for (let i = 1; i <= count; i++) {
    colors.push(tc(`--rk-chart-${i}`))
  }
  return colors.filter(c => c)
}

/** 重置为默认颜色（测试用） */
export function resetColors(): void {
  activeColors = { ...defaultColors }
}
