const esbuild = require('esbuild')

// Plugin: redirect require("react") etc. to browser globals in IIFE format
function browserGlobalsPlugin() {
  const modules = [
    { mod: 'react', global: 'React', code: `module.exports = React` },
    { mod: 'react/jsx-runtime', global: 'React', code: `var R = React; module.exports = { jsx: function(t,p,k){return R.createElement(t,Object.assign({},p),p&&p.children)}, jsxs: function(t,p,k){return R.createElement(t,Object.assign({},p),p&&p.children)}, Fragment: R.Fragment }` },
    { mod: 'react-dom', global: 'ReactDOM', code: `module.exports = ReactDOM` },
    { mod: 'react-dom/client', global: 'ReactDOM', code: `module.exports = { createRoot: ReactDOM.createRoot, hydrateRoot: ReactDOM.hydrateRoot }` },
    { mod: 'echarts', global: 'echarts', code: `module.exports = echarts` },
    { mod: 'mermaid', global: 'mermaid', code: `module.exports = mermaid` },
    { mod: 'mermaid/dist/mermaid', global: 'mermaid', code: `module.exports = mermaid` },
  ]

  return {
    name: 'browser-globals',
    setup(build) {
      // Use exact path matching to avoid react-dom/client matching react
      for (const entry of modules) {
        const filter = new RegExp('^' + entry.mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')
        build.onResolve({ filter }, args => ({ path: entry.mod, namespace: 'browser-globals' }))
        build.onLoad({ filter: new RegExp('^' + entry.mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), namespace: 'browser-globals' }, args => {
          return { contents: entry.code, loader: 'js' }
        })
      }
    }
  }
}

const isStandalone = process.argv.includes('--standalone')

esbuild.build({
  entryPoints: ['src/cdn-entry.ts'],
  bundle: true,
  format: 'iife',
  outfile: isStandalone ? 'dist/vizual.standalone.js' : 'dist/vizual.cdn.js',
  target: 'es2020',
  minify: true,
  globalName: 'Vizual',
  plugins: isStandalone ? [] : [browserGlobalsPlugin()],
  logLevel: 'info',
}).then(() => {
  console.log(`Built ${isStandalone ? 'standalone' : 'CDN'} successfully`)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
