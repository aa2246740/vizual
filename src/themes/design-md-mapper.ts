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
/**
 * 判断两个颜色是否属于同一色系，不适合同时出现在图表调色板
 * 规则：色相距离 < 30° → 视为同色系（不管亮度差异多大）
 * 数据可视化要求图表色来自不同色系，同色系的深浅变体会让用户混淆
 */
function isPerceptuallyClose(a: string, b: string): boolean {
  const [h1, s1] = hexToHsl(a)
  const [h2, s2] = hexToHsl(b)
  // 两个低饱和度灰色互相不算接近（灰色无色相，靠亮度区分）
  if (s1 < 0.15 && s2 < 0.15) return false
  // 色相距离 < 30° → 同色系
  const hueDist = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2))
  return hueDist < 30
}

function assignChartColors(
  vars: Map<string, string>,
  unmatched: ColorToken[]
): void {
  // 先看看 chart 颜色是否已经映射了
  const existingChartCount = [1, 2, 3, 4, 5, 6]
    .filter(i => vars.has(`--rk-chart-${i}`)).length

  if (existingChartCount >= 6) return

  // 收集已填入的图表色（用于感知距离检查）
  const assigned: string[] = []
  for (let i = 1; i <= 6; i++) {
    const v = vars.get(`--rk-chart-${i}`)
    if (v) assigned.push(v)
  }

  // 过滤掉明显不是"调色板"颜色（如背景色、文字色等）
  const paletteColors = unmatched.filter(t => {
    const name = t.name
    // 排除背景、文字、边框类
    const excludeKw = ['bg', 'background', 'surface', 'card', 'text', 'border', 'shadow',
      'white', 'black', 'transparent', 'overlay', 'divider']
    if (excludeKw.some(kw => name.includes(kw))) return false

    // 排除过亮/过暗的颜色（OKLCH-L > 0.85 或 < 0.15），这类颜色与任何背景都缺乏对比度
    const [L] = hexToOklch(t.value)
    if (L > 0.85 || L < 0.15) return false

    return true
  })

  // 按顺序分配给 chart-1~6，但跳过与已有图表色过于相似的候选
  let chartIdx = existingChartCount + 1
  for (const token of paletteColors) {
    if (chartIdx > 6) break
    // 跳过已被占用的
    while (chartIdx <= 6 && vars.has(`--rk-chart-${chartIdx}`)) {
      chartIdx++
    }
    if (chartIdx > 6) break

    // 感知距离检查：与已有图表色过于相似则跳过
    if (assigned.some(c => isPerceptuallyClose(c, token.value))) continue

    vars.set(`--rk-chart-${chartIdx}`, token.value)
    assigned.push(token.value)
    chartIdx++
  }
}

// ─── OKLCH 色彩空间（感知均匀） ─────────────────────────────
//
// 为什么用 OKLCH 而不是 HSL？
// HSL 的 Lightness 不是感知均匀的：相同 HSL-L=0.5 下，黄色看起来比蓝色亮 3 倍。
// OKLCH 基于人眼生理模型，相同 L = 相同视觉权重。
// 这意味着图表中 6 种颜色没有任何一个"抢眼"——感知亮度完全平衡。
//
// 参考：CSS Color Level 4 (oklch)、Björn Ottosson 的 OKLab 论文、
//       D3 的 d3-color、Chrome/Firefox 原生 oklch() 支持

/** sRGB gamma 解码：[0,1] → 线性 */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** 线性 → sRGB gamma 编码 */
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

/** Hex → OKLCH [L(0-1), C(0-~0.4), H(0-360)] */
function hexToOklch(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  if (h.length < 6) return [0.5, 0, 0]

  const r = srgbToLinear(parseInt(h.substring(0, 2), 16) / 255)
  const g = srgbToLinear(parseInt(h.substring(2, 4), 16) / 255)
  const b = srgbToLinear(parseInt(h.substring(4, 6), 16) / 255)

  // linear sRGB → LMS (OKLab 色彩空间中间态)
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b

  // LMS → 立方根压缩（模拟人眼非线性响应）
  const lc = Math.cbrt(l), mc = Math.cbrt(m), sc = Math.cbrt(s)

  // LMS' → OKLab
  const L = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc
  const a = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc
  const bv = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc

  // OKLab → OKLCH (直角坐标 → 极坐标)
  const C = Math.sqrt(a * a + bv * bv)
  let H = Math.atan2(bv, a) * 180 / Math.PI
  if (H < 0) H += 360

  return [L, C, H]
}

/** OKLCH → Hex，自动 clamp 到 sRGB 色域 */
function oklchToHex(L: number, C: number, H: number): string {
  // OKLCH → OKLab (极坐标 → 直角坐标)
  const a = C * Math.cos(H * Math.PI / 180)
  const b = C * Math.sin(H * Math.PI / 180)

  // OKLab → LMS'
  const lc = L + 0.3963377774 * a + 0.2158037573 * b
  const mc = L - 0.1055613458 * a - 0.0638541728 * b
  const sc = L - 0.0894841775 * a - 1.2914855480 * b

  // LMS' → LMS (立方还原)
  const l = lc * lc * lc, m = mc * mc * mc, s = sc * sc * sc

  // LMS → linear sRGB
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  // linear → sRGB gamma 编码，clamp 到 [0,1]
  const clamp = (v: number) => Math.max(0, Math.min(1, linearToSrgb(v)))
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(clamp(lr))}${toHex(clamp(lg))}${toHex(clamp(lb))}`
}

// ─── HSL 辅助（invertTheme 等其他逻辑仍使用）────────────

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

// ─── 图表调色板生成（OKLCH 感知均匀） ────────────────────────

/**
 * 从一个基色生成 N 色图表调色板（OKLCH 空间）
 *
 * 1. **锚定色优先**：第一个颜色 = 基色（品牌色），保持品牌一致性。
 * 2. **感知均匀亮度**：辅助色统一 OKLCH-L，同 L = 同视觉权重。
 * 3. **适中色度**：辅助色 C clamp 到 [0.10, 0.18]，避免过饱和或过灰。
 * 4. **等角色相旋转**：360°/n 等间隔，保证最大区分度。
 */
function generateChartPalette(baseColor: string, count: number = 6, bgColor?: string): string[] {
  const [L, C, H] = hexToOklch(baseColor)

  // 如果基色色度太低（灰色），使用默认蓝色
  if (C < 0.03) return generateChartPalette('#667eea', count, bgColor)

  // 锚定色（品牌色）作为第一个颜色
  const palette: string[] = [baseColor]

  // 辅助色亮度：根据背景亮度调整，确保图表色与背景有足够对比度
  let auxL: number
  if (bgColor) {
    const [bgL] = hexToOklch(bgColor)
    auxL = bgL > 0.5
      ? Math.max(0.35, Math.min(0.50, L))  // 亮色背景 → 深色图表色
      : Math.max(0.55, Math.min(0.70, L))   // 暗色背景 → 亮色图表色
  } else {
    auxL = Math.max(0.55, Math.min(0.70, L))
  }
  const auxC = Math.max(0.10, Math.min(0.18, C))

  for (let i = 1; i < count; i++) {
    const hue = (H + i * (360 / count)) % 360
    palette.push(oklchToHex(auxL, auxC, hue))
  }
  return palette
}

/**
 * 如果 chart-1~6 有空缺，从 accent 色用 HSL 色轮生成多样化调色板
 *
 * 策略：不用 semantic 色（success/warning/error）填充图表色，
 * 因为它们和 accent 可能色调接近（如 accent=红, error=红），
 * 导致图表多条 series 颜色无法区分。
 * 而是从 accent 出发，通过 HSL 色轮旋转生成 6 个色相间隔 ≥60° 的颜色。
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

  // 选择生成基色：accent > success > 默认蓝
  const baseForGen = vars.get('--rk-accent') || vars.get('--rk-success') || '#667eea'
  const bgColor = vars.get('--rk-bg-primary')
  const generated = generateChartPalette(baseForGen, 6, bgColor)

  for (const slot of emptySlots) {
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

// ─── 颜色值清洗 ──────────────────────────────────────────

/**
 * CMYK → Hex 转换
 * 公式: R = 255 × (1-C) × (1-K), G = 255 × (1-M) × (1-K), B = 255 × (1-Y) × (1-K)
 * C/M/Y/K 为 0-1 范围
 */
function cmykToHex(c: number, m: number, y: number, k: number): string {
  const r = Math.round(255 * (1 - c) * (1 - k))
  const g = Math.round(255 * (1 - m) * (1 - k))
  const b = Math.round(255 * (1 - y) * (1 - k))
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * 检测并转换 CMYK 字符串为 hex
 * 支持格式: "C0 M100 Y100 K40", "C0,M100,Y100,K40", "0,100,100,40"
 */
function tryConvertCmyk(value: string): string | null {
  // 匹配带 C/M/Y/K 前缀的格式
  const named = value.match(/C\s*(\d+)\s*M\s*(\d+)\s*Y\s*(\d+)\s*K\s*(\d+)/i)
  if (named) {
    return cmykToHex(+named[1] / 100, +named[2] / 100, +named[3] / 100, +named[4] / 100)
  }
  // 匹配纯 K 值 (如 "K80", "K100")
  const kOnly = value.match(/^K(\d+)$/i)
  if (kOnly) {
    const k = +kOnly[1] / 100
    const v = Math.round(255 * (1 - k))
    const hex = v.toString(16).padStart(2, '0')
    return `#${hex}${hex}${hex}`
  }
  return null
}

/**
 * 检查颜色值是否是合法的 CSS 颜色
 */
function isValidCssColor(value: string): boolean {
  // hex: #fff or #ffffff or #ffffffff
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return true
  // rgb/rgba
  if (/^rgba?\(\s*\d/.test(value)) return true
  // hsl/hsla
  if (/^hsla?\(\s*\d/.test(value)) return true
  // named colors (常见的)
  const namedColors = ['white', 'black', 'transparent', 'currentColor', 'red', 'blue', 'green',
    'gray', 'grey', 'yellow', 'orange', 'purple', 'pink', 'brown', 'cyan', 'magenta']
  if (namedColors.includes(value.toLowerCase())) return true
  return false
}

/**
 * 预处理颜色 token 列表：
 * 1. 将 CMYK 值转换为 hex
 * 2. 过滤掉不合法的颜色值（保留原始值做日志）
 */
function sanitizeColors(colors: ColorToken[]): {
  sanitized: ColorToken[]
  warnings: string[]
} {
  const warnings: string[] = []
  const sanitized: ColorToken[] = []

  for (const token of colors) {
    let value = token.value.trim()

    // 尝试 CMYK → hex 转换
    if (!isValidCssColor(value)) {
      const converted = tryConvertCmyk(value)
      if (converted) {
        warnings.push(`Converted CMYK "${value}" → "${converted}" (${token.name})`)
        value = converted
      } else {
        warnings.push(`Invalid color value "${value}" skipped (${token.name})`)
        continue // 跳过不合法的值
      }
    }

    sanitized.push({ name: token.name, value })
  }

  return { sanitized, warnings }
}

// ─── 完整度报告 ──────────────────────────────────────────

export interface ThemeMappingReport {
  /** 关键角色是否被匹配 */
  roles: {
    accent: boolean
    background: boolean
    text: boolean
    border: boolean
    success: boolean
    warning: boolean
    error: boolean
  }
  /** 颜色转换警告 */
  warnings: string[]
  /** 映射统计 */
  stats: {
    totalColors: number
    mappedColors: number
    chartAutoGenerated: number
  }
}

// ─── 主映射函数 ──────────────────────────────────────────

/**
 * 将 DesignTokens 映射为 vizual Theme
 *
 * @param tokens 从 DESIGN.md 解析出的 token
 * @param name 主题名（默认 'design-md'）
 * @returns 完整的 Theme 对象（含 _mappingReport 附加信息）
 */
export function mapDesignTokensToTheme(
  tokens: DesignTokens,
  name: string = 'design-md'
): Theme & { _mappingReport?: ThemeMappingReport } {
  // 0. 预处理：CMYK 转换 + 过滤非法颜色
  const { sanitized, warnings } = sanitizeColors(tokens.colors)

  // 1. 映射颜色
  const { mapped, unmatched } = mapColorsToVars(sanitized)
  const chartCountBefore = [1, 2, 3, 4, 5, 6].filter(i => mapped.has(`--rk-chart-${i}`)).length
  assignChartColors(mapped, unmatched)
  fillChartPaletteFromSemantic(mapped)
  const chartCountAfter = [1, 2, 3, 4, 5, 6].filter(i => mapped.has(`--rk-chart-${i}`)).length

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
  if (tokens.typography?.fontFamily) {
    if (!mapped.has('--rk-font-sans')) {
      mapped.set('--rk-font-sans', tokens.typography.fontFamily)
    }
  }

  // 4b. 映射字号 → --rk-text-*
  if (tokens.typography?.sizes) {
    const sizeMap: Record<string, string> = {
      'micro': '--rk-text-xs', 'caption': '--rk-text-xs', 'xs': '--rk-text-xs',
      'small': '--rk-text-sm', 'sm': '--rk-text-sm',
      'body': '--rk-text-lg', 'base': '--rk-text-lg',
      'subtitle': '--rk-text-xl',
      'h6': '--rk-text-xl', 'heading-6': '--rk-text-xl',
      'h5': '--rk-text-xl', 'heading-5': '--rk-text-xl',
      'h4': '--rk-text-2xl', 'heading-4': '--rk-text-2xl',
      'h3': '--rk-text-2xl', 'heading-3': '--rk-text-2xl',
      'h2': '--rk-text-2xl', 'heading-2': '--rk-text-2xl',
      'h1': '--rk-text-2xl', 'heading-1': '--rk-text-2xl',
      'display': '--rk-text-2xl', 'xxl': '--rk-text-2xl',
    }
    for (const [key, value] of Object.entries(tokens.typography!.sizes)) {
      const varName = sizeMap[key]
      if (varName && !mapped.has(varName)) {
        mapped.set(varName, value)
      }
    }
  }

  // 4c. 映射字重 → --rk-weight-*
  if (tokens.typography?.weights) {
    const weightMap: Record<string, string> = {
      'thin': '--rk-weight-normal', 'light': '--rk-weight-normal', 'regular': '--rk-weight-normal',
      'medium': '--rk-weight-medium',
      'semibold': '--rk-weight-semibold',
      'bold': '--rk-weight-bold', 'extrabold': '--rk-weight-bold',
    }
    for (const [key, value] of Object.entries(tokens.typography!.weights)) {
      const varName = weightMap[key]
      if (varName && !mapped.has(varName)) {
        mapped.set(varName, value)
      }
    }
  }

  // 5. 映射圆角 → --rk-radius-*
  if (tokens.radius?.scale) {
    const scale = tokens.radius.scale
    const radiusMap: Record<string, string> = {
      'xs': '--rk-radius-xs',
      'sm': '--rk-radius-sm', 'small': '--rk-radius-sm',
      'md': '--rk-radius-md', 'medium': '--rk-radius-md', 'card': '--rk-radius-md', 'button': '--rk-radius-md',
      'lg': '--rk-radius-lg', 'large': '--rk-radius-lg',
      'xl': '--rk-radius-xl', 'rounded': '--rk-radius-xl',
      'pill': '--rk-radius-pill', 'full': '--rk-radius-pill',
    }
    for (const [key, value] of Object.entries(scale)) {
      const varName = radiusMap[key]
      if (varName && !mapped.has(varName)) {
        mapped.set(varName, value)
      }
    }
    // 如果只有 md，自动推算 sm 和 lg
    if (!scale.sm && !scale.small && scale.md) {
      mapped.set('--rk-radius-sm', scale.md)
    }
    if (!scale.lg && !scale.large && scale.md) {
      mapped.set('--rk-radius-lg', scale.md)
    }
  }

  // 5b. 映射间距 → --rk-space-*
  if (tokens.spacing?.scale) {
    for (const [key, value] of Object.entries(tokens.spacing.scale)) {
      // space-1 → --rk-space-1, etc.
      const numMatch = key.match(/(\d+)/)
      if (numMatch) {
        const idx = numMatch[1]
        const varName = `--rk-space-${idx}`
        if (!mapped.has(varName)) {
          mapped.set(varName, value)
        }
      }
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

  // 8. 生成完整度报告
  const report: ThemeMappingReport = {
    roles: {
      accent: mapped.has('--rk-accent'),
      background: mapped.has('--rk-bg-primary'),
      text: mapped.has('--rk-text-primary'),
      border: mapped.has('--rk-border'),
      success: mapped.has('--rk-success'),
      warning: mapped.has('--rk-warning'),
      error: mapped.has('--rk-error'),
    },
    warnings,
    stats: {
      totalColors: sanitized.length,
      mappedColors: mapped.size,
      chartAutoGenerated: chartCountAfter - chartCountBefore,
    },
  }

  // 如果关键角色缺失，添加警告
  const missingRoles = Object.entries(report.roles)
    .filter(([, found]) => !found)
    .map(([role]) => role)
  if (missingRoles.length > 0) {
    report.warnings.push(`Key roles not matched: ${missingRoles.join(', ')} — using default values`)
  }

  return {
    name,
    displayName,
    cssVariables: cssVars,
    mode,
    _mappingReport: report,
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
