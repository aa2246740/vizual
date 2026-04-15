export function createFallbackContainer(input: unknown): HTMLElement {
  const container = document.createElement('div')
  container.setAttribute('data-fallback', 'true')
  container.className = 'render-kit-fallback'

  const inner = document.createElement('div')
  inner.setAttribute('data-fallback', 'true')
  inner.textContent = typeof input === 'string'
    ? input
    : JSON.stringify(input, null, 2)
  container.appendChild(inner)

  return container
}

export function isFallbackContainer(el: HTMLElement): boolean {
  return el.getAttribute('data-fallback') === 'true'
}
