const esbuild = require('esbuild')
const { rmSync } = require('fs')

// build.js — vizual 构建配置
// 三种产物：ESM（npm import）、CJS（npm require）、Standalone（全量打包，无外部依赖）

const isStandalone = process.argv.includes('--standalone')
const packageEntryPoints = {
  index: 'src/index.ts',
  'native-core/index': 'src/native-core/index.ts',
  'agent-helper/index': 'src/agent-helper/index.ts',
}

if (isStandalone) {
  // Standalone: 全量打包，包含 React + ECharts + 所有依赖，一个文件即可运行
  esbuild.build({
    entryPoints: ['src/cdn-entry.ts'],
    bundle: true,
    format: 'iife',
    outfile: 'dist/vizual.standalone.js',
    target: 'es2020',
    minify: false,
    logLevel: 'info',
    sourcemap: true,
    define: { 'process.env.NODE_ENV': '"production"' },
  }).then(() => {
    console.log('Built standalone successfully')
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })
} else {
  rmSync('dist', { recursive: true, force: true })
  // 默认：同时构建 ESM + CJS（npm 包格式，React/ECharts 作为 peer dependency）
  Promise.all([
    esbuild.build({
      entryPoints: packageEntryPoints,
      bundle: true,
      format: 'esm',
      outdir: 'dist',
      outExtension: { '.js': '.mjs' },
      target: 'es2020',
      external: ['react', 'react-dom', 'echarts'],
      logLevel: 'info',
    }),
    esbuild.build({
      entryPoints: packageEntryPoints,
      bundle: true,
      format: 'cjs',
      outdir: 'dist',
      target: 'es2020',
      external: ['react', 'react-dom', 'echarts'],
      logLevel: 'info',
    }),
  ]).then(() => {
    console.log('Built ESM + CJS successfully')
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
