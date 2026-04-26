/**
 * DocView Bridge Server — 浏览器 ↔ Agent 桥接
 *
 * POST /api/annotations  — 浏览器提交批注，写入 annotations.json
 * GET  /api/sections     — 浏览器轮询修订后的内容（agent 写入 sections.json）
 * GET  /api/status       — 当前状态（annotations 等待数、上次处理时间）
 * 静态文件               — serve 当前目录
 */
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 8780
const DIR = __dirname
const PARENT = path.dirname(DIR)  // Vizual repo root — needed for ../dist/
const ANNOTATIONS_FILE = path.join(DIR, 'annotations.json')
const SECTIONS_FILE = path.join(DIR, 'sections.json')

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' }

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const server = http.createServer((req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  // POST /api/annotations
  if (req.method === 'POST' && req.url === '/api/annotations') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      const data = JSON.parse(body)
      fs.writeFileSync(ANNOTATIONS_FILE, JSON.stringify(data, null, 2))
      const ts = new Date().toISOString().substr(11, 8)
      console.log(`\n[${ts}] 📨 ${data.annotations?.length || 0} annotations received:`)
      if (data.annotations) {
        data.annotations.forEach((a, i) => {
          const loc = a.sectionContext ? `[S${a.sectionContext.sectionIndex} ${a.sectionContext.sectionType}]` : ''
          const txt = a.text ? `"${a.text}"` : ''
          console.log(`  ${i + 1}. ${loc} ${txt} → ${a.note || '(no note)'}`)
        })
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })
    return
  }

  // GET /api/sections
  if (req.method === 'GET' && req.url === '/api/sections') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(fs.existsSync(SECTIONS_FILE) ? fs.readFileSync(SECTIONS_FILE) : 'null')
    return
  }

  // GET /api/status
  if (req.method === 'GET' && req.url === '/api/status') {
    const hasAnnotations = fs.existsSync(ANNOTATIONS_FILE)
    const hasSections = fs.existsSync(SECTIONS_FILE)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ hasAnnotations, hasSections }))
    return
  }

  // 静态文件服务 — 支持 validation/ 和 parent 目录
  let urlPath = req.url.split('?')[0] || '/demo-docview-agent.html'
  let filePath = path.join(DIR, urlPath)
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(PARENT, urlPath)
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, () => {
  console.log(`DocView Bridge running → http://localhost:${PORT}`)
  console.log(`Open http://localhost:${PORT}/demo-docview-agent.html`)
  console.log('Agent: watch annotations.json, write sections.json\n')
})
