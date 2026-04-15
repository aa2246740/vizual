import type { ParsedSchema } from '../../core/types'
import type { CodeBlockParsed } from './parser'
import { tokenizeLine } from './parser'

export function renderCodeBlock(parsed: ParsedSchema): HTMLElement {
  const block = parsed as CodeBlockParsed

  if (!block.valid) {
    const container = document.createElement('div')
    container.setAttribute('data-fallback', 'true')

    const inner = document.createElement('div')
    inner.setAttribute('data-fallback', 'true')
    inner.textContent = String(parsed.originalInput ?? '')
    container.appendChild(inner)

    return container
  }

  const wrapper = document.createElement('div')
  wrapper.className = `code-block language-${block.language}`
  wrapper.setAttribute('data-schema', 'code-block')

  if (block.filename) {
    const header = document.createElement('div')
    header.className = 'code-filename'
    header.textContent = block.filename
    wrapper.appendChild(header)
  }

  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.className = `language-${block.language}`

  const lines = block.code.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const lineSpan = document.createElement('span')
    lineSpan.setAttribute('data-line', String(i + 1))
    lineSpan.className = 'code-line'

    if (block.highlightLines.includes(i + 1)) {
      lineSpan.setAttribute('data-highlighted', 'true')
      lineSpan.classList.add('highlighted')
    }

    const tokens = tokenizeLine(lines[i], block.language)
    if (tokens.length > 0) {
      for (const token of tokens) {
        const tokenSpan = document.createElement('span')
        tokenSpan.setAttribute('data-token', token.type)
        tokenSpan.className = `token-${token.type}`
        tokenSpan.textContent = token.text
        lineSpan.appendChild(tokenSpan)
      }
    } else {
      lineSpan.textContent = ''
    }

    code.appendChild(lineSpan)
  }

  pre.appendChild(code)
  wrapper.appendChild(pre)

  // Copy button
  const copyBtn = document.createElement('button')
  copyBtn.setAttribute('data-action', 'copy')
  copyBtn.className = 'copy-button'
  copyBtn.textContent = 'Copy'
  copyBtn.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(block.code)
    }
  })
  wrapper.appendChild(copyBtn)

  return wrapper
}
