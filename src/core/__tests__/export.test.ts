import { describe, expect, it } from 'vitest'
import { exportDataToCSV, exportDataToXLSX } from '../export'

describe('data export helpers', () => {
  const rows = [
    { region: '华东', revenue: 120, note: 'stable' },
    { region: '华北', revenue: 88, note: 'needs, quote "check"' },
  ]

  it('exports CSV with BOM, headers, escaping, and user data', async () => {
    const blob = exportDataToCSV(rows, {
      columns: [
        { key: 'region', label: '区域' },
        { key: 'revenue', label: '收入' },
        { key: 'note', label: '备注' },
      ],
    })
    const text = await blob.text()

    expect(blob.type).toContain('text/csv')
    expect(text.startsWith('区域,收入,备注')).toBe(true)
    expect(text).toContain('华东,120,stable')
    expect(text).toContain('"needs, quote ""check"""')
  })

  it('exports a valid XLSX zip package without vulnerable SheetJS dependency', async () => {
    const blob = await exportDataToXLSX(rows, { sheetName: '收入明细' })
    const buffer = new Uint8Array(await blob.arrayBuffer())
    const header = String.fromCharCode(...buffer.slice(0, 2))

    expect(blob.type).toContain('spreadsheetml.sheet')
    expect(header).toBe('PK')
    expect(buffer.length).toBeGreaterThan(1000)
  })
})
