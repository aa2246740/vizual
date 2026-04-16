/**
 * Pan/Zoom 工具 — SVG 图表拖拽平移 + 滚轮/pinch 缩放
 *
 * 参考 zrender v6 架构：
 * - Pointer Capture：拖拽时鼠标移出容器不丢事件
 * - 双指 pinch：通过 touch 事件识别两指手势，以两指中心为缩放锚点
 * - 矩阵级数学：缩放锚点计算保证 SVG 坐标映射正确
 *
 * 容器需设：overflow: hidden + position: relative
 */
export interface PanZoomOptions {
  minScale?: number    // 最小缩放，默认 0.5
  maxScale?: number    // 最大缩放，默认 4
  initialScale?: number
  /** 缩放步进系数，默认 1.1（滚轮） */
  zoomFactor?: number
}

export function enablePanZoom(
  container: HTMLElement,
  svg: SVGSVGElement,
  options: PanZoomOptions = {}
): () => void {
  const minScale = options.minScale ?? 0.5
  const maxScale = options.maxScale ?? 4
  const initialScale = options.initialScale ?? 1
  const zoomFactor = options.zoomFactor ?? 1.1

  let scale = initialScale
  let tx = 0
  let ty = 0
  let dragging = false
  let lastPtrX = 0
  let lastPtrY = 0
  let lastTx = 0
  let lastTy = 0

  // ── Pointer Capture（zrender 风格：拖拽时不丢事件）─────────────────────
  function apply() {
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
    svg.style.transformOrigin = '0 0'
  }

  function clampScale(s: number): number {
    return Math.max(minScale, Math.min(maxScale, s))
  }

  // 将屏幕坐标转换为 SVG 内部坐标
  function screenToSVG(screenX: number, screenY: number) {
    const rect = container.getBoundingClientRect()
    return {
      x: (screenX - rect.left - tx) / scale,
      y: (screenY - rect.top  - ty) / scale,
    }
  }

  // ── Pointer 拖拽平移 ───────────────────────────────────────────────────
  container.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return
    // 捕获指针，鼠标移出容器也能继续收到事件（zrender 核心机制）
    container.setPointerCapture(e.pointerId)
    dragging = true
    lastPtrX = e.clientX
    lastPtrY = e.clientY
    lastTx = tx
    lastTy = ty
    container.style.cursor = 'grabbing'
    container.style.userSelect = 'none'
  })

  container.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return
    tx = lastTx + (e.clientX - lastPtrX)
    ty = lastTy + (e.clientY - lastPtrY)
    apply()
  })

  container.addEventListener('pointerup', (e: PointerEvent) => {
    if (!dragging) return
    dragging = false
    container.releasePointerCapture(e.pointerId)
    container.style.cursor = 'grab'
    container.style.userSelect = ''
  })

  // pointercancel 通常在 capture 模式下不会触发，但仍处理
  container.addEventListener('pointercancel', () => {
    dragging = false
    container.style.cursor = ''
    container.style.userSelect = ''
  })

  // ── 滚轮缩放（以鼠标位置为锚点）────────────────────────────────────────
  container.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const svgPoint = screenToSVG(e.clientX, e.clientY)
    const direction = e.deltaY < 0 ? 1 : -1
    const factor = direction > 0 ? zoomFactor : 1 / zoomFactor
    const newScale = clampScale(scale * factor)

    // 缩放锚点：SVG 内部坐标在缩放后仍映射到同一屏幕位置
    tx = e.clientX - container.getBoundingClientRect().left - svgPoint.x * newScale
    ty = e.clientY - container.getBoundingClientRect().top  - svgPoint.y * newScale
    scale = newScale
    apply()
  }, { passive: false })

  // ── Touch 双指 Pinch（参考 zrender GestureMgr）──────────────────────────
  let pinchStartDist = 0
  let pinchStartScale = 1
  let pinchStartTx = 0
  let pinchStartTy = 0
  let pinchOriginX = 0
  let pinchOriginY = 0
  let pinching = false

  function getTouchDist(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.hypot(dx, dy)
  }

  function getTouchMid(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }

  container.addEventListener('touchstart', (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      pinching = true
      pinchStartDist = getTouchDist(e.touches)
      pinchStartScale = scale
      const mid = getTouchMid(e.touches)
      pinchOriginX = mid.x
      pinchOriginY = mid.y
      const svgPt = screenToSVG(mid.x, mid.y)
      pinchStartTx = mid.x - container.getBoundingClientRect().left - svgPt.x * scale
      pinchStartTy = mid.y - container.getBoundingClientRect().top  - svgPt.y * scale
    } else if (e.touches.length === 1 && !dragging) {
      // 单指，但不在拖拽状态时也可以启动拖拽
      // 等待 touchmove 判断是拖拽还是点击
    }
  }, { passive: false })

  container.addEventListener('touchmove', (e: TouchEvent) => {
    if (e.touches.length === 2 && pinching) {
      e.preventDefault()
      const dist = getTouchDist(e.touches)
      const mid = getTouchMid(e.touches)

      // 缩放比
      const zoomRatio = dist / pinchStartDist
      const newScale = clampScale(pinchStartScale * zoomRatio)

      // 两指中心点的 SVG 坐标在缩放后不变
      const svgPt = screenToSVG(pinchOriginX, pinchOriginY)
      tx = pinchOriginX - container.getBoundingClientRect().left - svgPt.x * newScale
      ty = pinchOriginY - container.getBoundingClientRect().top  - svgPt.y * newScale
      scale = newScale
      apply()
    }
  }, { passive: false })

  container.addEventListener('touchend', (e: TouchEvent) => {
    if (e.touches.length < 2 && pinching) {
      pinching = false
    }
  })

  // ── 双击重置 ───────────────────────────────────────────────────────────
  container.addEventListener('dblclick', () => {
    scale = initialScale
    tx = 0
    ty = 0
    apply()
  })

  // ── 初始化样式 ─────────────────────────────────────────────────────────
  container.style.cursor = 'grab'
  container.style.userSelect = 'none'

  return () => {
    dragging = false
    pinching = false
    container.style.cursor = ''
    container.style.userSelect = ''
    // No need to release pointer capture; browser auto-releases when element is removed
  }
}
