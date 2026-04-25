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
}

export type VizualExportFormat = 'png' | 'pdf' | 'csv' | 'xlsx'

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

export async function exportToPDF(
  source: HTMLElement,
  options?: PDFExportOptions
): Promise<Blob> {
  const pngBlob = await exportToPNG(source, options)
  const dataUrl = await blobToDataURL(pngBlob)
  const img = await loadImage(dataUrl)
  const orientation = options?.orientation || (img.width > img.height ? 'landscape' : 'portrait')
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const scale = Math.min(pageWidth / img.width, pageHeight / img.height)
  const width = img.width * scale
  const height = img.height * scale
  const x = (pageWidth - width) / 2
  const y = (pageHeight - height) / 2
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
  })
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png', 1)
  })
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
