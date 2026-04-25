import { describe, expect, it } from 'vitest'
import {
  applyArtifactPatch,
  createArtifact,
  extractTargetMap,
  getArtifactElement,
  normalizeArtifact,
  summarizeSpec,
} from '../artifact'

describe('Vizual artifact runtime model', () => {
  const chartSpec = {
    root: 'chart',
    elements: {
      chart: {
        type: 'BarChart',
        props: {
          type: 'bar',
          title: 'Regional revenue',
          x: 'day',
          y: 'revenue',
          data: [
            { day: 'D1', region: '华东', revenue: 100 },
            { day: 'D2', region: '华北', revenue: 80 },
            { day: 'D3', region: '华东', revenue: 130 },
          ],
        },
        children: [],
      },
    },
  }

  it('normalizes a raw spec into a persistent artifact with targets', () => {
    const artifact = normalizeArtifact(chartSpec, {
      source: { messageId: 'msg-1', prompt: 'show revenue' },
    })

    expect(artifact.id).toMatch(/^viz-/)
    expect(artifact.kind).toBe('spec')
    expect(artifact.source?.messageId).toBe('msg-1')
    expect(artifact.targetMap).toContainEqual(expect.objectContaining({
      id: 'element:chart',
      type: 'element',
      elementId: 'chart',
      componentType: 'BarChart',
      label: 'Regional revenue',
    }))
    expect(artifact.targetMap).toContainEqual(expect.objectContaining({
      id: 'series:chart:revenue',
      type: 'chart-series',
      elementId: 'chart',
      label: 'revenue',
    }))
    expect(artifact.targetMap).toContainEqual(expect.objectContaining({
      id: 'point:chart:0:revenue',
      type: 'chart-data-point',
      summary: '100',
    }))
    expect(summarizeSpec(artifact.spec)).toEqual({
      root: 'chart',
      elementCount: 1,
      elementTypes: { chart: 'BarChart' },
    })
  })

  it('patches chart type, filters data, and records previous version', () => {
    const artifact = createArtifact({ id: 'artifact-1', spec: chartSpec })
    const updated = applyArtifactPatch(artifact, [
      { type: 'changeChartType', elementId: 'chart', chartType: 'line', reason: 'user asked for line chart' },
      { type: 'filterData', elementId: 'chart', field: 'region', values: '华东' },
      { type: 'limitData', elementId: 'chart', limit: 1 },
    ])

    expect(updated.spec.elements?.chart?.type).toBe('LineChart')
    expect(updated.spec.elements?.chart?.props?.data).toEqual([
      { day: 'D1', region: '华东', revenue: 100 },
    ])
    expect(updated.status).toBe('updated')
    expect(updated.versions).toHaveLength(1)
    expect(updated.versions[0].spec.elements?.chart?.type).toBe('BarChart')
  })

  it('supports DocView section targets and chart section patches', () => {
    const docSpec = {
      root: 'doc',
      elements: {
        doc: {
          type: 'DocView',
          props: {
            type: 'doc_view',
            sections: [
              { id: 'intro', type: 'text', content: 'Intro text' },
              {
                id: 'trend',
                type: 'chart',
                title: 'Trend',
                data: { chartType: 'BarChart', x: ['D1'], y: [10] },
              },
            ],
          },
          children: [],
        },
      },
    }

    const artifact = createArtifact({ id: 'doc-1', spec: docSpec })
    expect(extractTargetMap(docSpec)).toContainEqual(expect.objectContaining({
      id: 'section:trend',
      type: 'section',
      componentType: 'chart',
      label: 'Trend',
    }))

    const updated = applyArtifactPatch(artifact, {
      type: 'changeChartType',
      targetId: 'section:trend',
      chartType: 'LineChart',
    })
    const section = (updated.spec.elements?.doc?.props?.sections as any[])[1]
    expect(section.data.chartType).toBe('LineChart')
  })

  it('locates an element by element id or target id', () => {
    const artifact = createArtifact({ id: 'artifact-1', spec: chartSpec })

    expect(getArtifactElement(artifact, 'chart')?.type).toBe('BarChart')
    expect(getArtifactElement(artifact, 'element:chart')?.type).toBe('BarChart')
  })

  it('extracts table column, row, and cell targets', () => {
    const tableSpec = {
      root: 'table',
      elements: {
        table: {
          type: 'DataTable',
          props: {
            type: 'table',
            columns: [
              { key: 'region', label: '区域' },
              { key: 'revenue', label: '收入' },
            ],
            data: [
              { region: '华东', revenue: 120 },
              { region: '华北', revenue: 88 },
            ],
          },
          children: [],
        },
      },
    }

    const targets = extractTargetMap(tableSpec)

    expect(targets).toContainEqual(expect.objectContaining({
      id: 'column:region',
      type: 'table-column',
      label: '区域',
    }))
    expect(targets).toContainEqual(expect.objectContaining({
      id: 'row:table:0',
      type: 'data-row',
      summary: expect.stringContaining('华东'),
    }))
    expect(targets).toContainEqual(expect.objectContaining({
      id: 'cell:table:0:revenue',
      type: 'table-cell',
      summary: '120',
    }))
  })
})
