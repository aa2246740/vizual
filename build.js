const esbuild = require('esbuild')

// build.js — vizual 构建配置
// 三种产物：ESM（npm import）、CJS（npm require）、Standalone（全量打包，无外部依赖）

const isStandalone = process.argv.includes('--standalone')

if (isStandalone) {
  // Standalone: 全量打包，包含 React + ECharts + 所有依赖，一个文件即可运行
  esbuild.build({
    entryPoints: ['src/cdn-entry.ts'],
    bundle: true,
    format: 'iife',
    outfile: 'dist/vizual.standalone.js',
    target: 'es2020',
    minify: false,
    globalName: 'Vizual',
    logLevel: 'info',
    sourcemap: true,
  }).then(async (result) => {
    // esbuild IIFE 不自动返回，需要手动添加
    const fs = require('fs')
    let content = fs.readFileSync('dist/vizual.standalone.js', 'utf8')
    // 在 })(); 之前添加 return {
    content = content.replace('})();', 'return {\n  renderSpec,\n  React,\n  ReactDOM,\n  ReactDOMClient,\n  echarts,\n  registry,\n  DocView,\n  ...registry\n};})();')
    fs.writeFileSync('dist/vizual.standalone.js', content)
    console.log('Built standalone successfully')
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })
} else {
  // 默认：同时构建 ESM + CJS（npm 包格式，React/ECharts 作为 peer dependency）
  Promise.all([
    esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      format: 'esm',
      outfile: 'dist/index.mjs',
      target: 'es2020',
      external: ['react', 'react-dom', 'echarts'],
      logLevel: 'info',
    }),
    esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      format: 'cjs',
      outfile: 'dist/index.js',
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
