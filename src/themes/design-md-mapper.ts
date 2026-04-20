/**
 * DESIGN.md Token → Theme Mapper
 *
 * 将 parseDesignMd() 提取的 DesignTokens 映射为 vizual Theme
 * （即 --rk-* CSS 变量表）。
 *
 * 映射策略：
 *   1. 精确匹配 — token 语义名直接命中关键词表
 *   2. 模糊匹配 — token 名包含关键词
 *   3. 未匹配的颜色按顺序分配给 chart-1~6
 *   4. 缺失的 token 回退到 default-dark 主题的值
 */

import type { Theme } from './index'
import type { ColorToken, DesignTokens } from './design-md-parser'
import { COLOR_KEYWORD_MAP, detectMode } from './design-md-parser'
import { defaultDarkTheme } from './default-dark'
import { defaultLightTheme } from './default-light'

// ─── 内部映射结构 ──────────────────────────────────────

interface MappingResult {
  /** 已经映射到 --rk-* 的颜色 */
  mapped: Map<string, string>
  /** 未被映射的剩余颜色 */
  unmatched: ColorToken[]
}

/**
 * 将颜色 token 列表映射到 --rk-* CSS 变量
 *
 * 对每个 --rk-* 变量，扫描所有颜色 token，
 * 找到语义名最佳匹配的那个。
 */
function mapColorsToVars(colors: ColorToken[]): MappingResult {
  const mapped = new Map<string, string>()
  const usedTokens = new Set<number>()

  // 按 --rk-* 变量逐个匹配
  for (const [cssVar, keywords] of Object.entries(COLOR_KEYWORD_MAP)) {
    let bestMatch: { index: number; score: number } | null = null

    for (let i = 0; i < colors.length; i++) {
      if (usedTokens.has(i)) continue
      const token = colors[i]
      const name = token.name

      // 计算匹配分数
      let score = 0
      for (const kw of keywords) {
        if (name === kw) {
          score = 100 // 完全匹配
          break
        }
        if (name.includes(kw)) {
          score = Math.max(score, 50 + kw.length) // 包含匹配，关键词越长越精确
        }
        if (kw.includes(name)) {
          score = Math.max(score, 30 + name.length) // 反向包含
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { index: i, score }
      }
    }

    if (bestMatch) {
      mapped.set(cssVar, colors[bestMatch.index].value)
      usedTokens.add(bestMatch.index)
    }
  }

  // 收集未匹配的 token
  const unmatched = colors.filter((_, i) => !usedTokens.has(i))

  return { mapped, unmatched }
}

/**
 * 将未匹配的颜色分配给 chart-1~6 调色板
 */
function assignChartColors(
  vars: Map<string, string>,
  unmatched: ColorToken[]
): void {
  // 先看看 chart 颜色是否已经映射了
  const existingChartCount = [1, 2, 3, 4, 5, 6]
    .filter(i => vars.has(`--rk-chart-${i}`)).length

  if (existingChartCount >= 6) return

  // 过滤掉明显不是"调色板"颜色（如背景色、文字色等）
  const paletteColors = unmatched.filter(t => {
    const name = t.name
    // 排除背景、文字、边框类
    const excludeKw = ['bg', 'background', 'surface', 'text', 'border', 'shadow',
      'white', 'black', 'transparent', 'overlay', 'divider']
    return !excludeKw.some(kw => name.includes(kw))
  })

  // 按顺序分配给 chart-1~6
  let chartIdx = existingChartCount + 1
  for (const token of paletteColors) {
    if (chartIdx > 6) break
    // 跳过已被占用的
    while (chartIdx <= 6 && vars.has(`--rk-chart-${chartIdx}`)) {
      chartIdx++
    }
    if (chartIdx > 6) break
    vars.set(`--rk-chart-${chartIdx}`, token.value)
    chartIdx++
  }
}

// ─── 图表调色板自动生成 ──────────────────────────────────

/**
 * 将 hex 颜色转为 HSL
 * @returns [h(0-360), s(0-1), l(0-1)]
 */
function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  if (h.length < 6) return [0, 0, 0.5]
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return [0, 0, l] // 灰色

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let hue = 0
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) hue = ((b - r) / d + 2) / 6
  else hue = ((r - g) / d + 4) / 6

  return [hue * 360, s, l]
}

/**
 * 将 HSL 转为 hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * 从一个基色生成 6 色图表调色板
 *
 * 策略：以基色色相为起点，均匀旋转 60° 得到 6 个颜色，
 * 同时调整饱和度和亮度增加区分度。
 * 适用于大多数数据可视化场景（6 个 category 颜色足够）。
 */
function generateChartPalette(baseColor: string): string[] {
  const [h, s, l] = hexToHsl(baseColor)

  // 如果基色饱和度太低（灰/黑白），使用默认蓝色
  if (s < 0.15) return generateChartPalette('#667eea')

  const palette: string[] = []
  for (let i = 0; i < 6; i++) {
    // 色相每步旋转 60°，形成均匀色轮分布
    const hue = h + i * 60
    // 交替调整饱和度和亮度，增加区分度
    const sat = s * (0.85 + (i % 3) * 0.08)
    const lit = Math.max(0.4, Math.min(0.7, l + (i % 2 === 0 ? 0.05 : -0.05)))
    palette.push(hslToHex(hue, sat, lit))
  }
  return palette
}

/**
 * 如果 chart-1~6 有空缺，从 Primary/Accent 色自动生成调色板填充
 *
 * 优先级：
 *   1. DESIGN.md 中已有的 chart 颜色 → 保留
 *   2. DESIGN.md 中已映射的 semantic 色 (accent, success, warning, error) → 作为基础
 *   3. 从 accent 或 primary 颜色用 HSL 色轮自动生成
 */
function fillChartPaletteFromSemantic(vars: Map<string, string>): void {
  // 统计已有的 chart 颜色
  const emptySlots: number[] = []
  for (let i = 1; i <= 6; i++) {
    if (!vars.has(`--rk-chart-${i}`)) {
      emptySlots.push(i)
    }
  }
  if (emptySlots.length === 0) return

  // 收集可用的 semantic 颜色作为调色板种子
  const semanticColors: string[] = []
  const semanticKeys = ['--rk-accent', '--rk-success', '--rk-warning', '--rk-error', '--rk-chart-1', '--rk-chart-2', '--rk-chart-3', '--rk-chart-4', '--rk-chart-5', '--rk-chart-6']
  for (const key of semanticKeys) {
    if (vars.has(key)) {
      const val = vars.get(key)!
      if (val.startsWith('#') && val.length >= 7) {
        semanticColors.push(val)
      }
    }
  }

  // 优先用已有的 semantic/chart 颜色填充空位
  for (const slot of emptySlots) {
    if (semanticColors.length > 0) {
      vars.set(`--rk-chart-${slot}`, semanticColors.shift()!)
    }
  }

  // 如果还有空位，从 accent 色自动生成
  const stillEmpty: number[] = []
  for (let i = 1; i <= 6; i++) {
    if (!vars.has(`--rk-chart-${i}`)) {
      stillEmpty.push(i)
    }
  }
  if (stillEmpty.length === 0) return

  // 选择生成基色：accent > success > 已有 chart 中第一个
  const baseForGen = vars.get('--rk-accent') || vars.get('--rk-success') || '#667eea'
  const generated = generateChartPalette(baseForGen)

  for (const slot of stillEmpty) {
    vars.set(`--rk-chart-${slot}`, generated[slot - 1] || generated[0])
  }
}

/**
 * 生成 muted 版本的颜色（用于 status muted 变量）
 */
function createMutedVersion(color: string): string {
  // 如果已经是 rgba，调低 alpha
  const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.12)`
  }
  // hex → rgba with 0.12 alpha
  const hex = color.replace('#', '')
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, 0.12)`
  }
  return color
}

/**
 * 生成 hover 版本（稍微变亮/变暗）
 */
function createHoverVersion(color: string, mode: 'light' | 'dark'): string {
  const hex = color.replace('#', '')
  if (hex.length < 6) return color

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // dark mode → 变亮, light mode → 变暗
  const delta = mode === 'dark' ? 30 : -30
  const clamp = (v: number) => Math.max(0, Math.min(255, v))

  const nr = clamp(r + delta)
  const ng = clamp(g + delta)
  const nb = clamp(b + delta)

  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}

// ─── 主映射函数 ──────────────────────────────────────────

/**
 * 将 DesignTokens 映射为 vizual Theme
 *
 * @param tokens 从 DESIGN.md 解析出的 token
 * @param name 主题名（默认 'design-md'）
 * @returns 完整的 Theme 对象
 */
export function mapDesignTokensToTheme(
  tokens: DesignTokens,
  name: string = 'design-md'
): Theme {
  // 1. 映射颜色
  const { mapped, unmatched } = mapColorsToVars(tokens.colors)
  assignChartColors(mapped, unmatched)
  fillChartPaletteFromSemantic(mapped)

  // 2. 推断明暗模式
  const bgColor = mapped.get('--rk-bg-primary') || '#0f1117'
  const mode = detectMode(bgColor)

  // 3. 自动生成缺失的衍生色
  // muted 变体
  for (const status of ['error', 'success', 'warning'] as const) {
    const mainVar = `--rk-${status}`
    const mutedVar = `--rk-${status}-muted`
    if (mapped.has(mainVar) && !mapped.has(mutedVar)) {
      mapped.set(mutedVar, createMutedVersion(mapped.get(mainVar)!))
    }
  }

  // accent-muted
  if (mapped.has('--rk-accent') && !mapped.has('--rk-accent-muted')) {
    mapped.set('--rk-accent-muted', createMutedVersion(mapped.get('--rk-accent')!))
  }

  // accent-hover
  if (mapped.has('--rk-accent') && !mapped.has('--rk-accent-hover')) {
    mapped.set('--rk-accent-hover', createHoverVersion(mapped.get('--rk-accent')!, mode))
  }

  // 4. 映射字体
  if (tokens.typography.fontFamily) {
    if (!mapped.has('--rk-font-sans')) {
      mapped.set('--rk-font-sans', tokens.typography.fontFamily)
    }
  }

  // 5. 映射间距 → radius
  if (tokens.radius.scale) {
    const scale = tokens.radius.scale
    if (scale.sm && !mapped.has('--rk-radius-sm')) {
      mapped.set('--rk-radius-sm', scale.sm)
    }
    if (scale.md && !mapped.has('--rk-radius-md')) {
      mapped.set('--rk-radius-md', scale.md)
    }
    if (scale.lg && !mapped.has('--rk-radius-lg')) {
      mapped.set('--rk-radius-lg', scale.lg)
    }
    // 如果只有 md，自动推算 sm 和 lg
    if (!scale.sm && scale.md) {
      mapped.set('--rk-radius-sm', scale.md)
    }
    if (!scale.lg && scale.md) {
      mapped.set('--rk-radius-lg', scale.md)
    }
  }

  // 6. 用对应模式的默认主题填充缺失变量
  const fallbackBase = mode === 'light' ? defaultLightTheme.cssVariables : defaultDarkTheme.cssVariables
  const cssVars: Record<string, string> = { ...fallbackBase }

  // 覆盖已映射的变量
  for (const [key, value] of mapped) {
    cssVars[key] = value
  }

  // 7. 生成显示名
  const displayName = mode === 'dark' ? 'Design.md (Dark)' : 'Design.md (Light)'

  return {
    name,
    displayName,
    cssVariables: cssVars,
    mode,
  }
}

// ─── 主题反转 ──────────────────────────────────────────

/**
 * 将 hex 颜色的每个通道 clamp 到 [0, 255]
 */
function clampChannel(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

/**
 * 计算颜色的感知亮度 (0~1)
 */
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  if (h.length < 6) return 0
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * 反转颜色：将深色变浅或浅色变深
 * 用于自动生成 Light 变体（从 Dark）或 Dark 变体（从 Light）
 */
function invertColor(hex: string, targetMode: 'light' | 'dark'): string {
  const h = hex.replace('#', '')
  if (h.length < 6) return hex

  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)

  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  if (targetMode === 'light') {
    // 暗色 → 亮色：反转通道值
    const nr = clampChannel(255 - r + Math.round(lum * 40))
    const ng = clampChannel(255 - g + Math.round(lum * 40))
    const nb = clampChannel(255 - b + Math.round(lum * 40))
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
  } else {
    // 亮色 → 暗色：反转通道值
    const nr = clampChannel(255 - r - Math.round((1 - lum) * 40))
    const ng = clampChannel(255 - g - Math.round((1 - lum) * 40))
    const nb = clampChannel(255 - b - Math.round((1 - lum) * 40))
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
  }
}

/**
 * 自动反转主题：从 Dark 生成 Light 变体（或反之）
 *
 * 反转规则：
 *   - bg 系列 → 反转为对立亮度
 *   - text 系列 → 反转为对立亮度
 *   - border → 反转为对立亮度
 *   - accent / success / warning / error / chart → 保持不变（饱和色在两个模式下都可用）
 *   - muted → 用反转后的基色重新生成
 *   - shadow → 切换为对应模式的默认阴影
 */
export function invertTheme(base: Theme): Theme {
  const baseMode = base.mode || detectMode(base.cssVariables['--rk-bg-primary'] || '#0f1117')
  const targetMode: 'light' | 'dark' = baseMode === 'dark' ? 'light' : 'dark'
  const fallbackBase = targetMode === 'light' ? defaultLightTheme.cssVariables : defaultDarkTheme.cssVariables

  const inverted: Record<string, string> = {}

  for (const [key, value] of Object.entries(base.cssVariables)) {
    // 需要反转的变量（bg / text / border）
    const isInvertible =
      key.startsWith('--rk-bg-') ||
      key.startsWith('--rk-text-') ||
      key.startsWith('--rk-border')

    // muted 变量：用反转后的基色重新生成
    const isMuted = key.endsWith('-muted')

    // hover 变量：重新计算
    const isHover = key.endsWith('-hover')

    if (isMuted) {
      // 找到基色变量名（如 --rk-accent-muted → --rk-accent）
      const baseKey = key.replace('-muted', '')
      const baseValue = inverted[baseKey] || value
      inverted[key] = createMutedVersion(baseValue)
    } else if (isHover) {
      const baseKey = key.replace('-hover', '')
      const baseValue = inverted[baseKey] || value
      inverted[key] = createHoverVersion(baseValue, targetMode)
    } else if (isInvertible && value.startsWith('#')) {
      inverted[key] = invertColor(value, targetMode)
    } else if (key === '--rk-shadow') {
      // 使用目标模式的默认阴影
      inverted[key] = fallbackBase[key] || value
    } else {
      // accent / success / warning / error / chart / font / radius → 保持不变
      inverted[key] = value
    }
  }

  const name = base.name.includes('-dark')
    ? base.name.replace('-dark', '-light')
    : base.name.includes('-light')
      ? base.name.replace('-light', '-dark')
      : `${base.name}-${targetMode}`

  const displayName = targetMode === 'light'
    ? base.displayName.replace('(Dark)', '(Light)').replace('Dark', 'Light')
    : base.displayName.replace('(Light)', '(Dark)').replace('Light', 'Dark')

  return {
    name,
    displayName,
    cssVariables: { ...fallbackBase, ...inverted },
    mode: targetMode,
  }
}
