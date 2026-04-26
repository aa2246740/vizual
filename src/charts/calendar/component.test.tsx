import { describe, expect, it } from 'vitest'
import { buildCalendarFallback } from './component'

describe('CalendarChart option builder', () => {
  it('honors explicit range and date/value field aliases', () => {
    const option = buildCalendarFallback({
      type: 'calendar',
      title: '2024年1月代码提交',
      range: '2024-01',
      dateField: 'day',
      valueField: 'commits',
      data: [
        { day: '2024-01-02', commits: 3 },
        { day: '2024-01-10', commits: 5 },
      ],
    })

    const calendar = option.calendar as { range: string }
    const series = option.series as Array<{ data: Array<[string, number]> }>
    expect(calendar.range).toBe('2024-01')
    expect(series[0].data).toEqual([
      ['2024-01-02', 3],
      ['2024-01-10', 5],
    ])
  })
})
