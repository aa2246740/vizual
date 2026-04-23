import { describe, it, expect, beforeEach } from 'vitest'
import { tc, tcss, chartColors, resetColors, updateActiveColors } from '../theme-colors'
import { registerTheme, setGlobalTheme, getTheme } from '../../themes'

describe('theme-colors — tc() / tcss() 单元测试', () => {

  beforeEach(() => {
    resetColors()
  })

  // ── tcss() 返回 CSS var() 引用 ──────────────────────────────────────
  describe('tcss()', () => {
    it('返回 var() 引用格式', () => {
      const result = tcss('--rk-accent')
      expect(result).toBe('var(--rk-accent)')
    })

    it('对任意变量名返回正确的 var() 格式', () => {
      expect(tcss('--rk-bg-primary')).toBe('var(--rk-bg-primary)')
      expect(tcss('--rk-text-secondary')).toBe('var(--rk-text-secondary)')
      expect(tcss('--rk-radius-md')).toBe('var(--rk-radius-md)')
    })

    it('返回值在 React inline style 中可用（是合法 CSS 值）', () => {
      const val = tcss('--rk-text-sm')
      // React inline style 接受 string 值如 'var(--rk-text-sm)'
      expect(typeof val).toBe('string')
      expect(val.startsWith('var(')).toBe(true)
    })
  })

  // ── tc() 返回已解析的具体值 ──────────────────────────────────────────
  describe('tc()', () => {
    it('返回具体的颜色值（非 var() 格式）', () => {
      const result = tc('--rk-accent')
      expect(result).not.toBe('')
      expect(result).not.toContain('var(')
    })

    it('返回的值可直接用于 ECharts option（hex 或 rgba）', () => {
      const bg = tc('--rk-bg-primary')
      // 暗色主题默认值应该是 # 开头的 hex 值
      expect(bg).toMatch(/^#|^rgba?|^hsl/)
    })

    it('对不存在的变量返回空字符串', () => {
      const result = tc('--rk-nonexistent-variable')
      expect(result).toBe('')
    })

    it('返回值在 ECharts 场景下不需要 parseInt（直接是合法 CSS 值）', () => {
      const textSm = tc('--rk-text-sm')
      // 如果主题定义了 --rk-text-sm: '14px'，tc() 返回 '14px'
      // ECharts fontSize 接受 number 和 string，不需要 parseInt
      expect(typeof textSm).toBe('string')
    })
  })

  // ── parseInt(tcss()) 曾经是 NaN 的 bug 验证 ──────────────────────────
  describe('parseInt(tcss()) bug 回归测试', () => {
    it('tcss() 返回值不应该是数字（parseInt 会返回 NaN）', () => {
      const val = tcss('--rk-text-sm')
      // parseInt('var(--rk-text-sm)') === NaN
      expect(parseInt(val)).toBeNaN()
    })

    it('tcss() 应直接用于 CSS 属性，不需要 parseInt', () => {
      const val = tcss('--rk-text-sm')
      // 正确用法：fontSize: tcss('--rk-text-sm') → 'var(--rk-text-sm)'
      // 浏览器在 paint 时解析 CSS 变量，得到实际字号
      expect(val).toBe('var(--rk-text-sm)')
    })

    it('parseInt(tc()) 能正确解析（tc 返回具体值）', () => {
      const val = tc('--rk-text-sm')
      // 如果 val = '14px'，parseInt('14px') = 14，是合法数字
      // 但在 React inline style 中直接用 tc() 或 tcss() 更好
      if (val) {
        const num = parseInt(val)
        // 如果是 '14px' 格式，parseInt 应返回有效数字
        if (/^\d+px$/.test(val)) {
          expect(num).not.toBeNaN()
        }
      }
    })
  })

  // ── chartColors() ────────────────────────────────────────────────────
  describe('chartColors()', () => {
    it('返回指定数量的调色板颜色', () => {
      const colors = chartColors(6)
      expect(colors.length).toBe(6)
    })

    it('返回的颜色都是具体值（非 var() 格式）', () => {
      const colors = chartColors(6)
      for (const c of colors) {
        expect(c).not.toContain('var(')
        expect(c).toMatch(/^#|^rgba?|^hsl/)
      }
    })

    it('请求超过注册数量时不会崩溃', () => {
      const colors = chartColors(10)
      // chartColors 过滤掉空值，可能少于 10
      expect(colors.length).toBeGreaterThan(0)
    })
  })

  // ── 主题切换后颜色缓存更新 ──────────────────────────────────────────
  describe('主题切换', () => {
    it('updateActiveColors 更新后 tc() 返回新主题的颜色', () => {
      const before = tc('--rk-accent')

      // 注册一个测试主题
      registerTheme('test-theme', {
        name: 'test-theme',
        displayName: 'Test Theme',
        mode: 'dark',
        cssVariables: {
          '--rk-accent': '#ff0000',
        },
      })

      // 应用主题（会触发 updateActiveColors）
      if (typeof document !== 'undefined') {
        setGlobalTheme('test-theme')
      } else {
        const theme = getTheme('test-theme')!
        updateActiveColors(theme)
      }

      const after = tc('--rk-accent')
      expect(after).toBe('#ff0000')
    })

    it('tcss() 始终返回 var() 引用，不受主题切换影响', () => {
      const before = tcss('--rk-accent')
      expect(before).toBe('var(--rk-accent)')

      // 即使切换主题，tcss() 仍然返回 var() 引用
      registerTheme('test-theme-2', {
        name: 'test-theme-2',
        displayName: 'Test Theme 2',
        mode: 'dark',
        cssVariables: {
          '--rk-accent': '#00ff00',
        },
      })

      const after = tcss('--rk-accent')
      expect(after).toBe('var(--rk-accent)')
    })
  })

  // ── 模块级 style 对象不再冻结值 ──────────────────────────────────────
  describe('模块级 style 对象的响应性', () => {
    it('tcss() 在模块级调用时返回 var() 引用（不冻结具体值）', () => {
      // 模拟模块级 style 对象的创建
      const styleObj = {
        fontSize: tcss('--rk-text-sm'),
        borderRadius: tcss('--rk-radius-md'),
        fontWeight: tcss('--rk-weight-semibold'),
      }

      // 所有值都是 var() 引用，浏览器在 paint 时解析
      expect(styleObj.fontSize).toBe('var(--rk-text-sm)')
      expect(styleObj.borderRadius).toBe('var(--rk-radius-md)')
      expect(styleObj.fontWeight).toBe('var(--rk-weight-semibold)')
    })

    it('旧模式 parseInt(tc()) 会冻结值，新模式 tcss() 不会', () => {
      // 旧模式（有 bug）：parseInt(tc('--rk-text-sm')) → 14（冻结的数字）
      // 新模式：tcss('--rk-text-sm') → 'var(--rk-text-sm)'（动态引用）
      const newVal = tcss('--rk-text-sm')
      expect(newVal).toBe('var(--rk-text-sm)')
      // CSS 变量由浏览器在 paint 时解析，主题切换后自动生效
    })
  })
})
