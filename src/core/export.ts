/**
 * Export API — PNG 导出
 *
 * 策略：
 *   - ECharts 图表 → ECharts 原生 getDataURL()，快速可靠
 *   - HTML 组件 → html2canvas，准确还原 DOM 渲染效果
 *   - 背景色从 DOM CSS 变量实时读取，跟用户看到的一模一样
 */

import html2canvas from 'html2canvas'
import { tc } from './theme-colors'

export interface ExportOptions {
  /** 缩放倍率，默认 2（Retina） */
  scale?: number
  /** 背景色，默认从主题系统读取 --rk-bg-primary */
  backgroundColor?: string
  /** 文件名（不含扩展名） */
  filename?: string
}

function getDefaultBgColor(): string {
  if (typeof document !== 'undefined') {
    const dom = getComputedStyle(document.documentElement).getPropertyValue('--rk-bg-primary').trim()
    if (dom) return dom
  }
  return tc('--rk-bg-primary') || '#0f1117'
}

export async function exportToPNG(
  source: HTMLElement,
  options?: ExportOptions
): Promise<Blob> {
  const scale = options?.scale || 2
  const bgColor = options?.backgroundColor || getDefaultBgColor()

  const chartDom = source.querySelector('div[_echarts_instance_]') as HTMLElement
  if (chartDom) {
    const echartsLib = (window as any).echarts
    const chart = echartsLib?.getInstanceByDom?.(chartDom)
    if (chart) {
      const dataUrl: string = chart.getDataURL({
        type: 'png',
        pixelRatio: scale,
        backgroundColor: bgColor,
      })
      return dataUrlToBlob(dataUrl)
    }
  }

  return exportHTMLCanvasPNG(source, scale, bgColor)
}

export async function downloadPNG(
  source: HTMLElement,
  options?: ExportOptions
): Promise<void> {
  const blob = await exportToPNG(source, options)
  triggerDownload(blob, (options?.filename || 'vizual-export') + '.png')
}

async function exportHTMLCanvasPNG(
  source: HTMLElement,
  scale: number,
  bgColor: string
): Promise<Blob> {
  const canvas = await html2canvas(source, {
    scale,
    backgroundColor: bgColor,
    useCORS: true,
    logging: false,
  })
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png', 1)
  })
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then(r => r.blob())
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
