import { chromium } from '@playwright/test'

const BASE = 'http://localhost:43170'
const SETTLE_MS = 8000

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

  const projectionTimings = []
  const otherTimings = []
  const consoleErrors = []
  const pageErrors = []
  const navigations = []
  let reloads = 0
  let mainFrameStart = null

  page.on('response', async res => {
    const url = res.url()
    const t = { url, status: res.status(), start: Date.now() }
    // headers().date trick to keep sync; timing measured from listener anyway
    const entry = { url, status: res.status() }
    if (url.includes('/__xirang/projection')) {
      projectionTimings.push(entry)
      // measure duration via waitForResponse is handled separately; here record via fetch timing
    }
    if (url.includes('/__xirang/changes')) {
      otherTimings.push(entry)
    }
    if (url.endsWith('.ts') || url.endsWith('.tsx') || url.includes('/@id/') || url.includes('?import')) {
      otherTimings.push(entry)
    }
    void t
  })

  // request duration measurement
  page.on('request', req => {
    if (req.url().includes('/__xirang/projection')) {
      req.__start = Date.now()
    }
  })
  page.on('response', res => {
    const req = res.request()
    if (req.__start && res.url().includes('/__xirang/projection')) {
      const dur = Date.now() - req.__start
      const last = projectionTimings[projectionTimings.length - 1]
      if (last) last.durationMs = dur
    }
  })

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
    }
  })
  page.on('pageerror', err => pageErrors.push(String(err)))

  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      const url = frame.url()
      navigations.push({ url, at: Date.now() })
      if (mainFrameStart === null) mainFrameStart = Date.now()
      else reloads += 1
    }
  })

  const resourceCounts = {}
  page.on('request', req => {
    const u = req.url()
    let key = 'other'
    if (u.includes('/__xirang/projection')) key = 'projection'
    else if (u.includes('/__xirang/changes')) key = 'changes'
    else if (u.includes('/__xirang/')) key = 'xirang-other'
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(u) || u.includes('?import')) key = 'module'
    else if (u.includes('/assets/')) key = 'asset'
    else if (u.endsWith('.css')) key = 'css'
    resourceCounts[key] = (resourceCounts[key] ?? 0) + 1
  })

  console.log('=== loading page ===')
  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded' })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 }).catch(() => console.log('pane not visible!'))
  await page.waitForTimeout(1500)

  const pane = page.locator('.react-flow__pane')
  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 20000 }).catch(e => console.log('node not found:', e.message.split('\n')[0]))

  console.log('initial URL:', page.url())

  // Click Fit View button (React Flow Controls)
  const fitSelectors = [
    'button[aria-label="fit view"]',
    '.react-flow__controls-fitview',
    '.react-flow__controls button[title*="fit" i]',
    'button[aria-label="Fit view"]',
  ]
  let fitClicked = false
  for (const sel of fitSelectors) {
    const b = page.locator(sel).first()
    if (await b.count()) {
      await b.click().catch(e => console.log('fit click failed', sel, e.message.split('\n')[0]))
      fitClicked = true
      console.log('Fit View clicked via', sel)
      break
    }
  }
  if (!fitClicked) console.log('Fit View button NOT found (trying known fallback)')
  await page.waitForTimeout(800)

  // compute node screen position
  let box = null
  try {
    box = await node.boundingBox()
    console.log('node boundingBox:', box)
  } catch (e) { console.log('bbox error', e.message.split('\n')[0]) }

  const renderCountBefore = await page.evaluate(() => {
    const ov = document.querySelector('[data-xirang-architecture-overlay]')
    return {
      nodes: ov?.getAttribute('data-xirang-rendered-node-count'),
      hash: ov?.getAttribute('data-xirang-current-view-hash'),
      currentView: ov?.getAttribute('data-xirang-current-view'),
    }
  })
  console.log('render overlay before dblclick:', renderCountBefore)

  const projBefore = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(e => e.name.includes('/__xirang/projection')).length)
  console.log('projection requests before dblclick:', projBefore)

  // --- DOUBLE CLICK at node center ---
  console.log('=== double-clicking change-realization node ===')
  const startDbl = Date.now()
  if (box) {
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2, { delay: 40 })
  } else {
    await node.dblclick({ force: true })
  }
  const dblDone = Date.now() - startDbl
  console.log('dblclick dispatched (ms):', dblDone)

  // sample main-thread responsiveness & counts over the settle window
  const latencySamples = []
  const sampleLatency = async () => {
    const ms = await page.evaluate(() => new Promise(resolve => {
      let frames = 0
      const start = performance.now()
      const tick = () => {
        frames += 1
        if (performance.now() - start >= 1000) resolve(Math.round((performance.now() - start) / frames))
        else requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }))
    latencySamples.push(ms)
  }

  for (let i = 0; i < Math.ceil(SETTLE_MS / 1000); i++) {
    await sampleLatency().catch(e => latencySamples.push(-1))
    const projNow = await page.evaluate(() => performance.getEntriesByType('resource')
      .filter(e => e.name.includes('/__xirang/projection')).length)
    console.log(`  t+${(i + 1)}s: projection requests total=${projNow} frameLatency(ms/frame)=${latencySamples[latencySamples.length - 1]} url=${page.url()}`)
    await page.waitForTimeout(100)
  }

  const projAfter = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(e => e.name.includes('/__xirang/projection')).length)

  const renderCountAfter = await page.evaluate(() => {
    const ov = document.querySelector('[data-xirang-architecture-overlay]')
    return {
      nodes: ov?.getAttribute('data-xirang-rendered-node-count'),
      hash: ov?.getAttribute('data-xirang-current-view-hash'),
      currentView: ov?.getAttribute('data-xirang-current-view'),
      source: ov?.getAttribute('data-xirang-source'),
      mode: ov?.getAttribute('data-xirang-architecture-mode'),
    }
  })
  console.log('render overlay after:', renderCountAfter)

  const visibleNodes = await page.locator('.react-flow__node:visible').count()
  const visibleEdges = await page.locator('.react-flow__edge:visible').count()

  // check for a reload: count DOM .react-flow__pane re-creation events is complex; use resource counts & navigations
  console.log('=== summary ===')
  console.log('final URL:', page.url())
  console.log('projection requests before/after:', projBefore, '->', projAfter, '(delta', projAfter - projBefore, ')')
  console.log('projection timings (status,durMs):', projectionTimings.map(p => `${p.status}/${p.durationMs ?? '?'}ms`))
  console.log('visible nodes/edges:', visibleNodes, '/', visibleEdges)
  console.log('resource request counts:', resourceCounts)
  console.log('frameLatency samples (ms/frame):', latencySamples)
  console.log('navigations (main frame):', navigations)
  console.log('reloads:', reloads)
  console.log('console errors/warnings:', consoleErrors)
  console.log('page errors:', pageErrors)

  await browser.close()
}

main().catch(e => {
  console.error('FATAL', e)
  process.exit(1)
})
