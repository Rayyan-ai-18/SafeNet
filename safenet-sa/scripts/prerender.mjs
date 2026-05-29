// Build-time prerender for the Vite SPA.
// Serves dist/, loads each marketing route in headless Chrome, lets React +
// GSAP render, forces revealed content visible, then writes static HTML per
// route so crawlers/AI see real per-page content without running JS.
import http from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '..', 'dist')
const PORT = 4321

const ROUTES = ['/', '/demo', '/scan', '/app', '/how-it-works', '/luna', '/auth', '/privacy', '/terms', '/popia']

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ico': 'image/x-icon', '.map': 'application/json',
}

// Static server with SPA fallback to index.html
function startServer() {
  const indexHtml = path.join(DIST, 'index.html')
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent(req.url.split('?')[0])
        let filePath = path.join(DIST, urlPath)
        let isFile = existsSync(filePath) && (await stat(filePath)).isFile()
        if (!isFile) filePath = indexHtml // SPA fallback
        const ext = path.extname(filePath).toLowerCase()
        const body = await readFile(filePath)
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        res.end(body)
      } catch {
        res.writeHead(404); res.end('Not found')
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

async function prerender() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.error('prerender: dist/index.html missing - run vite build first')
    process.exit(1)
  }
  const server = await startServer()
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage()
      await page.setViewport({ width: 1280, height: 900 })
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 45000 })

      // Scroll through to fire scroll-triggered animations, then force any
      // GSAP-hidden (inline opacity:0) elements visible for the snapshot.
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let y = 0
          const step = () => {
            window.scrollTo(0, y)
            y += window.innerHeight
            if (y < document.body.scrollHeight) setTimeout(step, 60)
            else { window.scrollTo(0, 0); resolve() }
          }
          step()
        })
      })
      await page.evaluate(() => {
        document.querySelectorAll('[style*="opacity"]').forEach((el) => {
          el.style.opacity = '1'
          el.style.transform = 'none'
        })
      })
      await new Promise((r) => setTimeout(r, 400))

      const html = await page.content()
      const outDir = route === '/' ? DIST : path.join(DIST, route)
      if (route !== '/') await mkdir(outDir, { recursive: true })
      await writeFile(path.join(outDir, 'index.html'), html)
      console.log(`prerendered ${route} -> ${path.relative(DIST, path.join(outDir, 'index.html'))}`)
      await page.close()
    }
  } finally {
    await browser.close()
    server.close()
  }
}

prerender().catch((e) => { console.error('prerender failed:', e); process.exit(1) })
