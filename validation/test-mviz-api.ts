/**
 * Validate mviz buildBarOptions API returns valid ECharts option
 */
import { pathToFileURL } from 'url'
import { resolve } from 'path'

async function main() {
  const barPath = resolve('node_modules/mviz/dist/charts/bar.js')
  const { buildBarOptions } = await import(pathToFileURL(barPath).href)

  const option = buildBarOptions({
    type: 'bar',
    x: 'name',
    y: 'value',
    data: [
      { name: 'Q1', value: 120 },
      { name: 'Q2', value: 200 },
      { name: 'Q3', value: 150 },
    ],
    theme: 'light',
  })

  const checks = [
    ['has xAxis', !!option.xAxis],
    ['has yAxis', !!option.yAxis],
    ['has series', !!option.series],
    ['series is array', Array.isArray(option.series)],
    ['series[0].type is bar', option.series?.[0]?.type === 'bar'],
    ['series has data', Array.isArray(option.series?.[0]?.data) && option.series[0].data.length > 0],
  ]

  let allPass = true
  for (const [name, pass] of checks) {
    console.log(`  ${name}: ${pass ? 'PASS ✓' : 'FAIL ✗'}`)
    if (!pass) allPass = false
  }

  if (!allPass) {
    console.log('\nmviz API validation: FAILED')
    process.exit(1)
  }

  console.log('\nmviz API validation: ALL PASS')
}

main().catch(err => { console.error(err); process.exit(1) })
