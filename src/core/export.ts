/**
 * Export API — PNG / PDF / CSV / XLSX 导出
 *
 * 策略：
 *   - ECharts 图表 → ECharts 原生 getDataURL()，快速可靠
 *   - HTML 组件 → html2canvas，准确还原 DOM 渲染效果
 *   - 背景色从 DOM CSS 变量实时读取，跟用户看到的一模一样
 */

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import { tc } from './theme-colors'

export interface ExportOptions {
  /** 缩放倍率，默认 2（Retina） */
  scale?: number
  /** 背景色，默认从主题系统读取 --rk-bg-primary */
  backgroundColor?: string
  /** 文件名（不含扩展名） */
  filename?: string
}

export interface DataExportColumn {
  key: string
  label?: string
}

export interface DataExportOptions {
  columns?: DataExportColumn[]
  sheetName?: string
  filename?: string
}

export interface PDFExportOptions extends ExportOptions {
  orientation?: 'portrait' | 'landscape'
  /** `content` uses the rendered content size with no page padding. `a4` fits into an A4 page. */
  pageSize?: 'content' | 'a4'
  /** PDF page margin in points for A4 mode. Defaults to 0. */
  margin?: number
}

export type VizualExportFormat = 'png' | 'pdf' | 'csv' | 'xlsx'

function isTransparentColor(value: string) {
  const color = value.trim().toLowerCase()
  return !color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)' || color === 'rgba(0,0,0,0)'
}

function getDefaultBgColor(source?: HTMLElement): string {
  if (typeof document !== 'undefined') {
    if (source) {
      const style = getComputedStyle(source)
      const localToken = style.getPropertyValue('--rk-bg-primary').trim()
      if (localToken) return canvasSafeColor(localToken, '#FFFFFF')
      if (!isTransparentColor(style.backgroundColor)) return canvasSafeColor(style.backgroundColor, '#FFFFFF')
    }
    const dom = getComputedStyle(document.documentElement).getPropertyValue('--rk-bg-primary').trim()
    if (dom) return canvasSafeColor(dom, '#FFFFFF')
  }
  return tc('--rk-bg-primary') || '#0f1117'
}

export async function exportToPNG(
  source: HTMLElement,
  options?: ExportOptions
): Promise<Blob> {
  const scale = options?.scale || 2
  const bgColor = options?.backgroundColor || getDefaultBgColor(source)

  const isChartOnlyExport = source.matches?.('div[_echarts_instance_]')
  if (isChartOnlyExport) {
    const echartsLib = (window as any).echarts
    const chart = echartsLib?.getInstanceByDom?.(source)
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

export async function exportToPDF(
  source: HTMLElement,
  options?: PDFExportOptions
): Promise<Blob> {
  const pngBlob = await exportToPNG(source, options)
  const dataUrl = await blobToDataURL(pngBlob)
  const img = await loadImage(dataUrl)
  const orientation = options?.orientation || (img.width > img.height ? 'landscape' : 'portrait')

  if (options?.pageSize === 'a4') {
    const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = Math.max(0, options.margin ?? 0)
    const scale = Math.min((pageWidth - margin * 2) / img.width, (pageHeight - margin * 2) / img.height)
    const width = img.width * scale
    const height = img.height * scale
    const x = (pageWidth - width) / 2
    const y = (pageHeight - height) / 2
    pdf.addImage(dataUrl, 'PNG', x, y, width, height)
    return pdf.output('blob')
  }

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [Math.max(1, img.width), Math.max(1, img.height)],
  })
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  const x = 0
  const y = 0
  pdf.addImage(dataUrl, 'PNG', x, y, width, height)
  return pdf.output('blob')
}

export function exportDataToCSV(
  rows: Array<Record<string, unknown>>,
  options?: DataExportOptions
): Blob {
  const columns = normalizeColumns(rows, options?.columns)
  const lines = [
    columns.map(column => csvEscape(column.label || column.key)).join(','),
    ...rows.map(row => columns.map(column => csvEscape(row[column.key])).join(',')),
  ]
  return new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
}

export async function exportDataToXLSX(
  rows: Array<Record<string, unknown>>,
  options?: DataExportOptions
): Promise<Blob> {
  const columns = normalizeColumns(rows, options?.columns)
  const sheetName = sanitizeSheetName(options?.sheetName || 'Vizual Data')
  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypesXml())
  zip.folder('_rels')?.file('.rels', rootRelsXml())
  const xl = zip.folder('xl')
  xl?.file('workbook.xml', workbookXml(sheetName))
  xl?.folder('_rels')?.file('workbook.xml.rels', workbookRelsXml())
  xl?.folder('worksheets')?.file('sheet1.xml', worksheetXml(rows, columns))
  const bytes = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return bytes
}

export async function exportElement(
  source: HTMLElement,
  format: Extract<VizualExportFormat, 'png' | 'pdf'>,
  options?: ExportOptions | PDFExportOptions,
): Promise<Blob> {
  if (format === 'png') return exportToPNG(source, options)
  if (format === 'pdf') return exportToPDF(source, options as PDFExportOptions)
  throw new Error(`Unsupported element export format: ${format}`)
}

export async function exportData(
  rows: Array<Record<string, unknown>>,
  format: Extract<VizualExportFormat, 'csv' | 'xlsx'>,
  options?: DataExportOptions,
): Promise<Blob> {
  if (format === 'csv') return exportDataToCSV(rows, options)
  if (format === 'xlsx') return exportDataToXLSX(rows, options)
  throw new Error(`Unsupported data export format: ${format}`)
}

export async function downloadPNG(
  source: HTMLElement,
  options?: ExportOptions
): Promise<void> {
  const blob = await exportToPNG(source, options)
  triggerDownload(blob, (options?.filename || 'vizual-export') + '.png')
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  triggerDownload(blob, filename)
}

export async function downloadExport(
  source: HTMLElement,
  format: Extract<VizualExportFormat, 'png' | 'pdf'>,
  options?: ExportOptions | PDFExportOptions,
): Promise<void> {
  const blob = await exportElement(source, format, options)
  triggerDownload(blob, `${options?.filename || 'vizual-export'}.${format}`)
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
    ignoreElements: element => element instanceof HTMLElement && element.dataset.vizualExportIgnore === 'true',
    onclone: (documentClone, clonedSource) => {
      sanitizeClonedDocumentForCanvasExport(documentClone)
      if (clonedSource instanceof HTMLElement) {
        sanitizeClonedTreeForCanvasExport(source, clonedSource)
      }
    },
  })
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png', 1)
  })
}

const UNSUPPORTED_CANVAS_COLOR_RE = /\b(?:oklch|oklab|lch|lab|color-mix|hwb)\(/iu

const CANVAS_SAFE_THEME_VARS: Record<string, string> = {
  '--background': '#FFFFFF',
  '--foreground': '#0F172A',
  '--card': '#FFFFFF',
  '--card-foreground': '#0F172A',
  '--popover': '#FFFFFF',
  '--popover-foreground': '#0F172A',
  '--primary': '#0F172A',
  '--primary-foreground': '#FFFFFF',
  '--secondary': '#F8FAFC',
  '--secondary-foreground': '#0F172A',
  '--muted': '#F8FAFC',
  '--muted-foreground': '#64748B',
  '--accent': '#F1F5F9',
  '--accent-foreground': '#0F172A',
  '--destructive': '#C8152D',
  '--border': '#E5E7EB',
  '--input': '#CBD5E1',
  '--ring': '#64748B',
  '--chart-1': '#2F5F7F',
  '--chart-2': '#2F7D74',
  '--chart-3': '#5B6C9D',
  '--chart-4': '#9A6B2F',
  '--chart-5': '#64748B',
  '--rk-bg-primary': '#FFFFFF',
  '--rk-bg-secondary': '#F8FAFC',
  '--rk-bg-tertiary': '#F1F5F9',
  '--rk-border': '#E5E7EB',
  '--rk-border-subtle': '#CBD5E1',
  '--rk-text-primary': '#0F172A',
  '--rk-text-secondary': '#475569',
  '--rk-text-tertiary': '#64748B',
  '--rk-accent': '#C8152D',
  '--rk-error': '#9F1024',
  '--rk-warning': '#B7791F',
  '--rk-success': '#15803D',
  '--rk-chart-1': '#2F5F7F',
  '--rk-chart-2': '#2F7D74',
  '--rk-chart-3': '#5B6C9D',
  '--rk-chart-4': '#9A6B2F',
  '--rk-chart-5': '#64748B',
}

function canvasSafeColor(value: string, fallback: string) {
  return UNSUPPORTED_CANVAS_COLOR_RE.test(value) ? fallback : value
}

function fallbackForColorProp(prop: string) {
  const normalized = prop.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`).toLowerCase()
  if (normalized.includes('background')) return '#FFFFFF'
  if (normalized.includes('border') || normalized.includes('outline') || normalized.includes('rule')) return '#E5E7EB'
  return '#0F172A'
}

function canvasSafeCssValue(prop: string, value: string) {
  if (!value || !UNSUPPORTED_CANVAS_COLOR_RE.test(value)) return value

  const normalized = prop.toLowerCase()
  if (
    normalized.includes('image') ||
    normalized.includes('gradient') ||
    normalized.includes('shadow') ||
    normalized.includes('filter')
  ) {
    return 'none'
  }

  if (normalized.includes('background')) return '#FFFFFF'
  if (normalized.includes('border') || normalized.includes('outline') || normalized.includes('rule')) return '#E5E7EB'
  if (normalized.includes('fill') || normalized.includes('stroke') || normalized.includes('color')) {
    return fallbackForColorProp(normalized)
  }

  return ''
}

function applyCanvasSafeComputedStyles(sourceElement: Element, clonedElement: HTMLElement | SVGElement) {
  const style = getComputedStyle(sourceElement)

  for (const prop of Array.from(style)) {
    const value = style.getPropertyValue(prop)
    const safeValue = canvasSafeCssValue(prop, value)
    if (safeValue === value) continue

    if (safeValue) {
      clonedElement.style.setProperty(prop, safeValue, style.getPropertyPriority(prop))
    } else {
      clonedElement.style.removeProperty(prop)
    }
  }
}

function applyCanvasSafeThemeVars(element: HTMLElement | SVGElement) {
  for (const [key, value] of Object.entries(CANVAS_SAFE_THEME_VARS)) {
    element.style.setProperty(key, value)
  }
}

function canvasSafeThemeCss() {
  return Object.entries(CANVAS_SAFE_THEME_VARS)
    .map(([key, value]) => `${key}: ${value} !important;`)
    .join('\n')
}

function sanitizeClonedDocumentForCanvasExport(documentClone: Document) {
  const css = `
:root,
html,
body {
${canvasSafeThemeCss()}
  color: #0F172A !important;
  background: #FFFFFF !important;
  background-color: #FFFFFF !important;
}
html *,
body *,
html *::before,
html *::after,
body *::before,
body *::after {
  --tw-ring-color: #CBD5E1 !important;
  --tw-ring-offset-color: #FFFFFF !important;
}
`
  const style = documentClone.createElement('style')
  style.setAttribute('data-vizual-canvas-safe-colors', 'true')
  style.textContent = css
  documentClone.head.appendChild(style)

  if (documentClone.documentElement instanceof HTMLElement) applyCanvasSafeThemeVars(documentClone.documentElement)
  if (documentClone.body instanceof HTMLElement) applyCanvasSafeThemeVars(documentClone.body)
}

function sanitizeClonedElementForCanvasExport(sourceElement: Element, clonedElement: Element) {
  if (!(sourceElement instanceof Element) || !(clonedElement instanceof HTMLElement || clonedElement instanceof SVGElement)) {
    return
  }

  applyCanvasSafeThemeVars(clonedElement)
  applyCanvasSafeComputedStyles(sourceElement, clonedElement)
  const style = getComputedStyle(sourceElement)

  if (clonedElement instanceof HTMLElement) {
    if (UNSUPPORTED_CANVAS_COLOR_RE.test(style.boxShadow)) {
      clonedElement.style.boxShadow = 'none'
    }
    if (UNSUPPORTED_CANVAS_COLOR_RE.test(style.textShadow)) {
      clonedElement.style.textShadow = 'none'
    }
  }

  if (clonedElement instanceof SVGElement) {
    const fill = sourceElement.getAttribute('fill') || style.fill
    const stroke = sourceElement.getAttribute('stroke') || style.stroke
    if (fill) clonedElement.setAttribute('fill', canvasSafeColor(fill, '#0F172A'))
    if (stroke) clonedElement.setAttribute('stroke', canvasSafeColor(stroke, '#0F172A'))
  }
}

function sanitizeClonedTreeForCanvasExport(source: HTMLElement, clonedSource: HTMLElement) {
  sanitizeClonedElementForCanvasExport(source, clonedSource)

  const sourceElements = Array.from(source.querySelectorAll('*'))
  const clonedElements = Array.from(clonedSource.querySelectorAll('*'))
  for (let index = 0; index < sourceElements.length; index += 1) {
    const clonedElement = clonedElements[index]
    if (!clonedElement) continue
    sanitizeClonedElementForCanvasExport(sourceElements[index], clonedElement)
  }
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then(r => r.blob())
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
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

function normalizeColumns(
  rows: Array<Record<string, unknown>>,
  columns?: DataExportColumn[],
): DataExportColumn[] {
  if (columns?.length) return columns
  const keys = new Set<string>()
  for (const row of rows) {
    Object.keys(row || {}).forEach(key => keys.add(key))
  }
  return Array.from(keys).map(key => ({ key, label: key }))
}

function csvEscape(value: unknown): string {
  if (value == null) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function sanitizeSheetName(name: string): string {
  const safe = name.replace(/[\\/?*[\]:]/g, ' ').trim()
  return (safe || 'Sheet1').slice(0, 31)
}

function xmlEscape(value: unknown): string {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function columnName(index: number): string {
  let n = index + 1
  let name = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

function cellXml(rowIndex: number, columnIndex: number, value: unknown): string {
  const ref = `${columnName(columnIndex)}${rowIndex}`
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`
  }
  if (typeof value === 'boolean') {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`
}

function worksheetXml(rows: Array<Record<string, unknown>>, columns: DataExportColumn[]): string {
  const header = `<row r="1">${columns.map((column, index) => cellXml(1, index, column.label || column.key)).join('')}</row>`
  const body = rows.map((row, rowIndex) => {
    const r = rowIndex + 2
    return `<row r="${r}">${columns.map((column, columnIndex) => cellXml(r, columnIndex, row[column.key])).join('')}</row>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${header}${body}</sheetData>
</worksheet>`
}

function contentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`
}

function rootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
}

function workbookXml(sheetName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
}

function workbookRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`
}
