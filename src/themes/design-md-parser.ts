/**
 * DESIGN.md Parser — 从 Markdown 提取设计 Token
 *
 * 解析 Google Stitch / VoltAgent 风格的 DESIGN.md 文件，
 * 提取颜色、字体、间距、圆角等设计 token。
 *
 * 支持的 DESIGN.md 格式（启发式匹配，无需严格格式）：
 *   - ## Colors / ## 色彩
 *   - ## Typography / ## 字体
 *   - ## Spacing / ## 间距
 *   - ## Border Radius / ## 圆角
 *   - ## Elevation / ## 阴影
 */

// ─── 类型定义 ────────────────────────────────────────────

export interface ColorToken {
  /** 语义名（如 Primary, Surface, Error） */
  name: string
  /** 颜色值（#hex 或 rgb/rgba） */
  value: string
}

export interface TypographyToken {
  /** 字体族 */
  fontFamily?: string
  /** 字号表 { semanticName: '16px' } */
  sizes?: Record<string, string>
  /** 字重表 { semanticName: '700' } */
  weights?: Record<string, string>
  /** 行高 */
  lineHeights?: Record<string, string>
}

export interface SpacingToken {
  /** 基准单位 */
  baseUnit?: string
  /** 间距表 { 'space-1': '4px', ... } */
  scale?: Record<string, string>
}

export interface RadiusToken {
  /** 圆角表 { 'sm': '4px', 'md': '8px', ... } */
  scale?: Record<string, string>
}

export interface DesignTokens {
  colors: ColorToken[]
  typography: TypographyToken
  spacing: SpacingToken
  radius: RadiusToken
  /** 原始 markdown（用于调试） */
  raw?: string
}

// ─── 工具函数 ────────────────────────────────────────────

/** 提取所有 hex 颜色 (#rgb, #rrggbb, #rrggbbaa) */
function extractHexColors(text: string): string[] {
  return [...text.matchAll(/#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/g)]
    .map(m => m[0])
}

/** 提取 rgb/rgba 颜色 */
function extractRgbColors(text: string): string[] {
  return [...text.matchAll(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g)]
    .map(m => m[0])
}

/** 提取 CMYK / K-only 颜色值，交给 mapper 统一转换 */
function extractCmykColors(text: string): string[] {
  const cmyk = [...text.matchAll(/\bC\s*\d{1,3}\s*M\s*\d{1,3}\s*Y\s*\d{1,3}\s*K\s*\d{1,3}\b/gi)]
    .map(m => m[0])
  const kOnly = [...text.matchAll(/\bK\d{1,3}\b/g)]
    .map(m => m[0])
  return [...cmyk, ...kOnly]
}

/** 提取所有颜色（hex + rgb） */
function extractAllColors(text: string): string[] {
  return [...extractHexColors(text), ...extractRgbColors(text), ...extractCmykColors(text)]
}

/** 标准化语义名 → 小写、去特殊字符 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, '-')
}

/** 判断语义名是否匹配关键词列表 */
function matchesKeyword(name: string, keywords: string[]): boolean {
  const lower = name.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

/** 从行文本提取颜色值 */
function extractColorFromLine(line: string): string | undefined {
  // 优先取 hex
  const hex = line.match(/#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?\b/)
  if (hex) return hex[0]
  // 其次取 rgb
  const rgb = line.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/)
  if (rgb) return rgb[0]
  // 再取 CMYK / K-only
  const cmyk = line.match(/\bC\s*\d{1,3}\s*M\s*\d{1,3}\s*Y\s*\d{1,3}\s*K\s*\d{1,3}\b/i)
  if (cmyk) return cmyk[0]
  const kOnly = line.match(/\bK\d{1,3}\b/)
  if (kOnly) return kOnly[0]
  return undefined
}

const KNOWN_COLOR_NAMES = [
  'CMB Red', 'CMB Black', 'CMB White',
  'Deep Red', 'Light Red', 'Lighter Red',
  'Light Brown', 'Medium Brown', 'Dark Brown',
  'Dark Gray', 'Medium Gray', 'Light Gray', 'Very Light Gray',
  'Gold Foil', 'Silver Foil',
]

function inferNameBeforeColor(line: string, color: string): string {
  const colorIndex = line.indexOf(color)
  if (colorIndex < 0) return ''

  const beforeColor = line.slice(0, colorIndex)
  for (const known of KNOWN_COLOR_NAMES) {
    const re = new RegExp(`\\b${known.replace(/\s+/g, '\\s+')}\\b`, 'i')
    const match = beforeColor.match(re)
    if (match) return match[0]
  }

  let candidate = beforeColor
    .replace(/^\s*[-*]\s*/, '')
    .replace(/^\s*\|\s*/, '')
    .replace(/[\s(/:：-]+$/, '')
    .trim()

  const lastClause = candidate.match(/(?:is|as|called|named|为|是)\s+([^,，。.;；]+)$/i)
  if (lastClause) candidate = lastClause[1].trim()

  // 自然语言长句不要整句当 token 名；留给 alias 规则处理。
  if (candidate.length > 48 || candidate.split(/\s+/).length > 6) return ''
  return candidate
}

function looksLikeWhite(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized === 'k0' || normalized === '#fff' || normalized === '#ffffff' || normalized === '#ffffffff'
}

function inferColorAliases(name: string, line: string, value: string): string[] {
  const aliases = new Set<string>()
  const nameLower = name.toLowerCase()
  const lower = `${name} ${line}`.toLowerCase()

  const add = (...items: string[]) => {
    for (const item of items) aliases.add(item)
  }

  if (
    lower.includes('primary brand') ||
    lower.includes('brand color') ||
    lower.includes('cmb-red') ||
    lower.includes('cmb red') ||
    lower.includes('cta') ||
    lower.includes('active state') ||
    lower.includes('link')
  ) {
    add('primary', 'brand', 'accent', 'chart-1')
  }

  const explicitBackgroundName = nameLower.includes('background') || nameLower.includes('canvas') || nameLower.includes('surface')
  const explicitWhiteName = nameLower.includes('white') || nameLower.includes('cmb-white')
  if (explicitBackgroundName || explicitWhiteName || (looksLikeWhite(value) && lower.includes('white'))) {
    add('background', 'canvas', 'surface')
  }

  if (
    nameLower.includes('black') ||
    nameLower.includes('text') ||
    lower.includes('primary text') ||
    lower.includes('official communications')
  ) {
    add('text', 'text-primary', 'foreground')
  }

  if (lower.includes('dark-gray') || lower.includes('dark gray') || lower.includes('strong emphasis')) {
    add('text-secondary')
  }
  if (lower.includes('medium-gray') || lower.includes('medium gray') || lower.includes('secondary text')) {
    add('text-secondary')
  }
  if (lower.includes('light-gray') || lower.includes('light gray') || lower.includes('subtle text')) {
    add('text-tertiary', 'border-subtle')
  }
  if (lower.includes('very-light-gray') || lower.includes('very light gray') || lower.includes('hints')) {
    add('bg-secondary', 'border')
  }

  aliases.delete(name)
  return Array.from(aliases)
}

function pushColorWithAliases(tokens: ColorToken[], name: string, value: string, line: string): void {
  const normalized = normalizeName(name || `color-${tokens.length + 1}`)
  tokens.push({ name: normalized, value })
  for (const alias of inferColorAliases(normalized, line, value)) {
    tokens.push({ name: alias, value })
  }
}

// ─── Section 分割 ──────────────────────────────────────────

interface MarkdownSection {
  heading: string
  content: string
}

/**
 * 按 ## 标题分割 markdown 为 section 列表
 */
function splitSections(markdown: string): MarkdownSection[] {
  const sections: MarkdownSection[] = []
  const lines = markdown.split('\n')
  let currentHeading = ''
  let currentContent: string[] = []

  for (const line of lines) {
    if (/^#{2,3}\s+/.test(line)) {
      if (currentHeading || currentContent.length) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n'),
        })
      }
      currentHeading = line.replace(/^#{2,3}\s+/, '').trim()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }

  if (currentHeading || currentContent.length) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n'),
    })
  }

  return sections
}

/** 判断 section 是否匹配主题 */
function sectionMatches(heading: string, keywords: string[]): boolean {
  const lower = heading.toLowerCase()
  return keywords.some(kw => lower.includes(kw))
}

// ─── Colors 解析 ──────────────────────────────────────────

/**
 * 从 Colors section 提取颜色 token
 *
 * 支持的格式：
 *   - Primary: #667eea
 *   - | Name | Value |
 *     | Primary | #667eea |
 *   - --color-primary: #667eea
 *   - <color> blocks
 *   - 纯列表 - Primary #667eea
 */
function parseColorsSection(content: string): ColorToken[] {
  const tokens: ColorToken[] = []
  const lines = content.split('\n').filter(l => l.trim())

  for (const line of lines) {
    // 跳过纯 markdown 表格分隔线
    if (/^\|[-:\s|]+\|$/.test(line.trim())) continue
    // 跳过空行和标题
    if (!line.trim() || line.trim().startsWith('#')) continue

    const color = extractColorFromLine(line)
    if (!color) continue

    // 尝试从行中提取语义名
    let name = ''

    // 格式1: SemanticName: #hex
    const colonMatch = line.match(/^\s*(?:[-*]?\s*)?([A-Za-z][A-Za-z\s]*?):\s*/)

    // 格式2: | Name | #hex |
    const tableMatch = line.match(/^\|\s*([^|]+?)\s*\|/)

    // 格式3: --color-semantic: #hex
    const cssVarMatch = line.match(/--(?:color-?)?([a-zA-Z-]+)\s*:/)

    // 格式4: CMB Red (#c8152d / Pantone 193): ...
    const beforeColorName = inferNameBeforeColor(line, color)

    if (cssVarMatch) {
      name = cssVarMatch[1]
    } else if (tableMatch && tableMatch[1].trim()) {
      const cell = tableMatch[1].trim()
      // 确保不是 "Name" 表头
      if (cell.toLowerCase() !== 'name' && cell.toLowerCase() !== 'token') {
        name = cell
      }
    } else if (colonMatch) {
      name = colonMatch[1].trim()
    } else if (beforeColorName) {
      name = beforeColorName
    }

    // 去掉行内的颜色值和尾部分隔符，得到更干净的名字
    if (name) {
      name = normalizeName(name)
    }

    // 如果实在提取不到名字，用索引
    if (!name) {
      name = `color-${tokens.length + 1}`
    }

    pushColorWithAliases(tokens, name, color, line)
  }

  // 去重（同名取第一个）
  const seen = new Set<string>()
  return tokens.filter(t => {
    if (seen.has(t.name)) return false
    seen.add(t.name)
    return true
  })
}

// ─── Typography 解析 ──────────────────────────────────────

function parseTypographySection(content: string): TypographyToken {
  const result: TypographyToken = {}
  const lines = content.split('\n').filter(l => l.trim())

  const fontCandidates: string[] = []
  const addFont = (font: string) => {
    if (!fontCandidates.includes(font)) fontCandidates.push(font)
  }
  if (/Founder\s+Lanting\s+Hei/i.test(content)) addFont('"Founder Lanting Hei"')
  if (/方正兰亭黑/.test(content)) addFont('"方正兰亭黑"')
  if (/\bArial\b/i.test(content)) addFont('Arial')
  if (/Heiti|黑体/.test(content)) addFont('Heiti')
  if (fontCandidates.length > 0) {
    result.fontFamily = [...fontCandidates, 'sans-serif'].join(', ')
  }

  // 提取 font-family
  for (const line of lines) {
    const ffMatch = line.match(
      /(?:font[- ]?family|family|heading|body|sans|mono)[^\n:]*?[:\s]+(.+?)(?:\n|$)/i
    )
    if (ffMatch) {
      const val = ffMatch[1].trim().replace(/[`"']/g, '').replace(/\|.*$/, '').trim()
      if (val && val.length > 3 && !val.includes('display') && !val.includes('grid')) {
        const lowerLine = line.toLowerCase()
        if (lowerLine.includes('mono') || lowerLine.includes('code')) {
          if (!result.fontFamily || !result.fontFamily.includes('mono')) {
            // 存为 mono 字体
          }
        }
        // 取第一个看起来像字体名的作为主字体
        if (!result.fontFamily && val.length < 120) {
          result.fontFamily = val
        }
      }
    }
  }

  // 提取字号 scale
  result.sizes = {}
  for (const line of lines) {
    // heading: 32px / display: 48px
    const sizeMatch = line.match(
      /(?:[-*]?\s*)?(display|h[1-6]|heading|body|small|xs|sm|md|lg|xl|xxl|micro|caption|subtitle)\s*[:\s]\s*([\d.]+)\s*(?:px|rem|em)/i
    )
    if (sizeMatch) {
      const name = normalizeName(sizeMatch[1])
      const value = sizeMatch[2] + (line.includes('rem') ? 'rem' : line.includes('em') ? 'em' : 'px')
      result.sizes[name] = value
    }

    // 表格行 | heading | 32px |
    const tableSizeMatch = line.match(
      /^\|\s*(display|h[1-6]|heading|body|small|xs|sm|md|lg|xl|xxl|micro|caption|subtitle)\s*\|\s*([\d.]+)\s*(px|rem|em)?/i
    )
    if (tableSizeMatch) {
      const name = normalizeName(tableSizeMatch[1])
      const unit = tableSizeMatch[3] || 'px'
      result.sizes[name] = tableSizeMatch[2] + unit
    }
  }

  // 提取字重
  result.weights = {}
  for (const line of lines) {
    const weightMatch = line.match(
      /(?:[-*]?\s*)?(bold|semibold|medium|light|regular|thin|extrabold)\s*[:\s]\s*(\d{3})/i
    )
    if (weightMatch) {
      result.weights[normalizeName(weightMatch[1])] = weightMatch[2]
    }
  }

  // 清理空对象
  if (Object.keys(result.sizes).length === 0) delete result.sizes
  if (Object.keys(result.weights).length === 0) delete result.weights

  return result
}

// ─── Spacing 解析 ──────────────────────────────────────────

function parseSpacingSection(content: string): SpacingToken {
  const result: SpacingToken = {}
  const lines = content.split('\n').filter(l => l.trim())

  // 提取 base unit
  for (const line of lines) {
    const baseMatch = line.match(/base[- ]?unit\s*[:\s]\s*([\d.]+)\s*(px|rem)/i)
    if (baseMatch) {
      result.baseUnit = baseMatch[1] + baseMatch[2]
      break
    }
    // 也匹配 "8px grid" / "4px base"
    const gridMatch = line.match(/([\d.]+)\s*(px|rem)\s*(?:grid|base|unit)/i)
    if (gridMatch) {
      result.baseUnit = gridMatch[1] + gridMatch[2]
      break
    }
  }

  // 提取间距 scale
  result.scale = {}
  for (const line of lines) {
    // space-1: 4px / sp-1: 4px
    const match = line.match(
      /(?:space|sp)[- ]?(\d+)\s*[:\s]\s*([\d.]+)\s*(px|rem)/i
    )
    if (match) {
      result.scale![`space-${match[1]}`] = match[2] + match[3]
    }
  }

  if (Object.keys(result.scale ?? {}).length === 0) delete result.scale

  return result
}

// ─── Border Radius 解析 ──────────────────────────────────

function parseRadiusSection(content: string): RadiusToken {
  const result: RadiusToken = { scale: {} }
  const lines = content.split('\n').filter(l => l.trim())

  for (const line of lines) {
    // sm: 4px / md: 8px / lg: 16px
    const match = line.match(
      /(?:[-*]?\s*)?(xs|sm|small|md|medium|lg|large|xl|pill|full|rounded|card|button)\s*[:\s]\s*([\d.]+)\s*(px|rem|%)/i
    )
    if (match) {
      let name = match[1].toLowerCase()
      // 标准化名称
      if (name === 'small') name = 'sm'
      if (name === 'medium') name = 'md'
      if (name === 'large') name = 'lg'
      result.scale![name] = match[2] + match[3]
    }

    // 表格行
    const tableMatch = line.match(
      /^\|\s*(xs|sm|small|md|medium|lg|large|xl|pill|full)\s*\|\s*([\d.]+)\s*(px|rem|%)?/i
    )
    if (tableMatch) {
      let name = tableMatch[1].toLowerCase()
      if (name === 'small') name = 'sm'
      if (name === 'medium') name = 'md'
      if (name === 'large') name = 'lg'
      const unit = tableMatch[3] || 'px'
      result.scale![name] = tableMatch[2] + unit
    }
  }

  // 如果没提取到 scale，尝试从整个 section 找所有带 px 的数字
  if (Object.keys(result.scale ?? {}).length === 0) {
    const allRadius = content.match(/(?:radius|rounded)[^:]*?:\s*([\d.]+)\s*(px|rem)/gi)
    if (allRadius) {
      allRadius.forEach((r, i) => {
        const val = r.match(/([\d.]+)\s*(px|rem)/i)
        if (val) {
          const names = ['sm', 'md', 'lg']
          if (i < names.length) {
            result.scale![names[i]] = val[1] + val[2]
          }
        }
      })
    }
  }

  if (Object.keys(result.scale ?? {}).length === 0) delete result.scale

  return result
}

// ─── 主解析函数 ──────────────────────────────────────────

/**
 * 解析 DESIGN.md markdown 为结构化设计 token
 *
 * @param markdown DESIGN.md 的完整内容
 * @returns 提取出的设计 token
 *
 * @example
 * ```ts
 * const tokens = parseDesignMd(designMdContent)
 * // tokens.colors → [{ name: 'primary', value: '#667eea' }, ...]
 * // tokens.typography.fontFamily → 'Inter, sans-serif'
 * // tokens.spacing.baseUnit → '8px'
 * ```
 */
export function parseDesignMd(markdown: string): DesignTokens {
  const sections = splitSections(markdown)

  const tokens: DesignTokens = {
    colors: [],
    typography: {},
    spacing: {},
    radius: {},
  }

  // Colors — 可能出现在 Overview 或专门的 Colors section
  const colorSections = sections.filter(s =>
    sectionMatches(s.heading, ['color', 'palette', '色彩', '调色板', 'brand'])
  )
  // 如果没找到专门的 section，尝试从 overview 提取
  const overviewSection = sections.find(s =>
    sectionMatches(s.heading, ['overview', '概览', 'brand', '系统'])
  )

  for (const section of colorSections) {
    tokens.colors.push(...parseColorsSection(section.content))
  }

  // Overview 中的颜色（补充）
  if (overviewSection && tokens.colors.length === 0) {
    tokens.colors = parseColorsSection(overviewSection.content)
  }

  // 最终 fallback：如果仍然没有颜色，尝试从整个文档提取
  if (tokens.colors.length === 0) {
    tokens.colors = parseColorsSection(markdown)
  }

  // Typography
  const typoSection = sections.find(s =>
    sectionMatches(s.heading, ['typo', 'font', 'type', '字体', '排版'])
  )
  if (typoSection) {
    tokens.typography = parseTypographySection(typoSection.content)
  }

  // Spacing
  const spacingSection = sections.find(s =>
    sectionMatches(s.heading, ['spacing', 'space', 'layout', '间距', '布局'])
  )
  if (spacingSection) {
    tokens.spacing = parseSpacingSection(spacingSection.content)
  }

  // Border Radius
  const radiusSection = sections.find(s =>
    sectionMatches(s.heading, ['radius', 'border', 'corner', '圆角'])
  )
  if (radiusSection) {
    tokens.radius = parseRadiusSection(radiusSection.content)
  }

  // Fallback：无标题 section 也尝试提取 typography/spacing/radius
  const noHeadingSection = sections.find(s => !s.heading)
  if (noHeadingSection) {
    if (Object.keys(tokens.typography).length === 0) {
      tokens.typography = parseTypographySection(noHeadingSection.content)
    }
    if (Object.keys(tokens.spacing).length === 0) {
      tokens.spacing = parseSpacingSection(noHeadingSection.content)
    }
    if (Object.keys(tokens.radius).length === 0 || !tokens.radius.scale) {
      tokens.radius = parseRadiusSection(noHeadingSection.content)
    }
  }

  // Elevation → 阴影（暂不提取，可以后加）

  return tokens
}

// ─── 辅助：语义匹配关键词 ──────────────────────────────────

/**
 * 语义名 → --rk-* 变量的关键词映射
 * 用于将 DESIGN.md 中的任意语义名映射到 vizual 主题变量
 */
export const COLOR_KEYWORD_MAP: Record<string, string[]> = {
  '--rk-accent':          ['primary', 'brand', 'accent', 'interactive', 'cta', 'link', 'focus'],
  '--rk-accent-hover':    ['primary-hover', 'accent-hover', 'brand-hover', 'interactive-hover'],
  '--rk-accent-muted':    ['primary-muted', 'accent-muted', 'brand-muted', 'primary-light', 'accent-light'],
  '--rk-bg-primary':      ['surface', 'background', 'bg', 'canvas', 'base', 'ground', 'page'],
  '--rk-bg-secondary':    ['surface-secondary', 'card', 'elevated', 'surface-elevated', 'overlay', 'panel'],
  '--rk-bg-tertiary':     ['surface-tertiary', 'hover', 'surface-hover', 'sunken', 'well', 'input'],
  '--rk-text-primary':    ['text', 'on-surface', 'foreground', 'content', 'text-primary', 'heading'],
  '--rk-text-secondary':  ['text-secondary', 'muted', 'secondary-text', 'subtle', 'text-muted'],
  '--rk-text-tertiary':   ['text-tertiary', 'text-disabled', 'placeholder', 'hint', 'text-hint'],
  '--rk-border':          ['border', 'divider', 'stroke', 'separator', 'outline'],
  '--rk-border-subtle':   ['border-subtle', 'border-light', 'divider-subtle', 'border-hover'],
  '--rk-error':           ['error', 'danger', 'red', 'destructive', 'negative', 'critical'],
  '--rk-error-muted':     ['error-muted', 'error-light', 'danger-muted', 'error-bg'],
  '--rk-success':         ['success', 'green', 'positive', 'confirmed', 'valid'],
  '--rk-success-muted':   ['success-muted', 'success-light', 'success-bg'],
  '--rk-warning':         ['warning', 'yellow', 'amber', 'caution', 'alert'],
  '--rk-warning-muted':   ['warning-muted', 'warning-light', 'warning-bg'],
  '--rk-chart-1':         ['chart-1', 'chart-primary', 'data-1', 'series-1', 'graph-1'],
  '--rk-chart-2':         ['chart-2', 'data-2', 'series-2', 'graph-2'],
  '--rk-chart-3':         ['chart-3', 'data-3', 'series-3', 'graph-3'],
  '--rk-chart-4':         ['chart-4', 'data-4', 'series-4', 'graph-4'],
  '--rk-chart-5':         ['chart-5', 'data-5', 'series-5', 'graph-5'],
  '--rk-chart-6':         ['chart-6', 'data-6', 'series-6', 'graph-6'],
}

/**
 * 判断明暗模式 — 基于背景色亮度
 */
export function detectMode(bgColor: string): 'light' | 'dark' {
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // 相对亮度公式
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'light' : 'dark'
}
