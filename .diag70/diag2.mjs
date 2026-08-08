import { chromium } from '@playwright/test'

const BASE = 'http://localhost:43170'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const cdp = await page.context().newCDPSession(page)

  const logs = []
  const log = m => { logs.push(m); console.log(m) }

  page.on('console', msg => { if (msg.type() === 'error') log(`[console.error] ${msg.text()}`) })
  page.on('pageerror', err => log(`[pageerror] ${err}`))
  let navigations = 0
  let lastNavUrl = null
  page.on('framenavigated', f => { if (f === page.mainFrame()) { navigations += 1; lastNavUrl = f.url(); log(`[framenavigated ${navigations}] ${f.url()}`) } })

  const projReq = []
  page.on('request', req => {
    if (req.url().includes('/__xirang/projection')) { req._t = Date.now(); projReq.push({ t: req._t, url: req.url() }) }
  })
  page.on('response', res => {
    const req = res.request()
    if (req._t && res.url().includes('/__xirang/projection')) {
      log(`[projection response] ${Date.now() - req._t}ms status=${res.status()}`)
    }
  })

  log('--- goto page ---')
  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded' })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
  await sleep(2000)

  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 20000 })
  const fit = page.locator('.react-flow__controls-fitview').first()
  if (await fit.count()) { await fit.click(); await sleep(800) }
  const box = await node.boundingBox()
  log(`node bbox: ${JSON.stringify(box)}`)
  log(`URL before dblclick: ${page.url()}`)

  log('--- starting CPU profile ---')
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
  await cdp.send('Profiler.start')

  log('--- dblclick ---')
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2, { delay: 40 })
  log('dblclick dispatched')

  // try a trivial evaluate with a 5s timeout — if it hangs, main thread is blocked
  const check = async (label) => {
    const t0 = Date.now()
    try {
      const r = await Promise.race([
        page.evaluate('1+1'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('evaluate timeout after 5s')), 5000)),
      ])
      log(`${label}: main thread RESPONSIVE (${Date.now() - t0}ms, 1+1=${r})`)
    } catch (e) {
      log(`${label}: MAIN THREAD BLOCKED (${e.message})`)
    }
  }

  await check('t+1s')
  await sleep(4000)
  await check('t+5s')

  log('--- stopping CPU profile ---')
  const profile = await cdp.send('Profiler.stop')
  log(`profile nodes: ${profile.profile.nodes.length}, samples: ${profile.profile.samples.length}, timeDeltas: ${profile.profile.timeDeltas.length}`)

  // Analyze: find hottest frames by self time
  const { nodes, samples, timeDeltas } = profile.profile
  const idToNode = new Map(nodes.map(n => [n.id, n]))
  const selfTime = new Map() // nodeId -> ms
  for (let i = 0; i < samples.length; i++) {
    const id = samples[i]
    const dt = timeDeltas[i] ?? 0
    selfTime.set(id, (selfTime.get(id) ?? 0) + dt)
  }
  const top = [...selfTime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
  log('=== top self-time frames ===')
  const frameCache = new Map()
  for (const [id, ms] of top) {
    let n = idToNode.get(id)
    let callFrame = n?.callFrame
    if (!callFrame) continue
    // build the chain
    const chain = []
    let cur = n
    const seen = new Set()
    while (cur && !seen.has(cur.id) && chain.length < 8) {
      seen.add(cur.id)
      chain.unshift(`${cur.callFrame.functionName || '(anon)'} @${cur.callFrame.url.split('/').pop()}:${cur.callFrame.lineNumber}`)
      cur = idToNode.get(cur.parent)
    }
    const key = chain.join(' <- ')
    frameCache.set(key, (frameCache.get(key) ?? 0) + ms)
  }
  const sortedFrames = [...frameCache.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  for (const [key, ms] of sortedFrames) {
    log(`${(ms / 1000).toFixed(1)}ms  ${key}`)
  }

  log('--- raw top nodes ---')
  for (const [id, ms] of top.slice(0, 15)) {
    const n = idToNode.get(id)
    log(`${(ms / 1000).toFixed(1)}ms ${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.lineNumber}`)
  }

  log(`navigations: ${navigations} lastNavUrl: ${lastNavUrl}`)
  log(`projection requests captured: ${projReq.length}`)
  log('--- end ---')
  require('fs').writeFileSync('/tmp/diag70/cdp_results.txt', logs.join('\n'))
  await browser.close()
}

main().catch(e => { console.error('FATAL', e); process.exit(1) })
