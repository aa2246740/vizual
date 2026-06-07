import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('theme application boundaries', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.className = ''
    document.body.innerHTML = ''
    document.head
      .querySelectorAll('style[id^="rk-theme-variables-"]')
      .forEach(element => element.remove())
  })

  it('does not apply a global theme when the bundle theme module is imported', async () => {
    await import('../../themes')

    expect(Array.from(document.body.classList).filter(cls => cls.startsWith('rk-theme-'))).toEqual([])
    expect(document.head.querySelector('style[id^="rk-theme-variables-"]')).toBeNull()
  })

  it('keeps explicit theme application scoped to the selected container', async () => {
    const { applyTheme } = await import('../../themes')
    const host = document.createElement('section')
    document.body.appendChild(host)

    expect(applyTheme(host, 'default-light')).toBe(true)

    const styleText = document.getElementById('rk-theme-variables-default-light')?.textContent ?? ''
    expect(host.classList.contains('rk-theme-default-light')).toBe(true)
    expect(document.body.classList.contains('rk-theme-default-light')).toBe(false)
    expect(styleText).toContain('.rk-theme-default-light {')
    expect(styleText).not.toContain('.rk-theme-default-light *')
  })
})
