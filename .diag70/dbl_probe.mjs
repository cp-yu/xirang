import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/dbl_probe.txt'
const LOG = []
const log = m => { LOG.push(m); fs.appendFileSync(OUT, m + '\n') }
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const cdp = await page.context().newCDPSession(page)

  let navCount = 0
  let reqCount = 0
  const reqKinds = {}
  const started = Date.now()
  page.on('framenavigated', f => {
    navCount += 1
    if (navCount <= 60) log(`[nav #${navCount} t+${((Date.now() - started) / 1000).toFixed(2)}s] MAIN=${f === page.mainFrame()} url=${f.url().slice(0, 130)}`)
  })
  page.on('request', req => {
    reqCount += 1
    const u = req.url()
    let k = 'other'
    if (u.includes('/__xirang/projection')) k = 'projection'
    else if (u.includes('/__xirang/changes')) k = 'changes'
    else if (u.includes('/__xirang/')) k = 'xirang'
    else if (/\.(ts|tsx|mjs|js|css)$/.test(u) || u.includes('?import')) k = 'module'
    else if (u.endsWith('/') || u.includes('/view/')) k = 'html'
    reqKinds[k] = (reqKinds[k] ?? 0) + 1
  })

  log(`=== dblclick probe ${new Date().toISOString()} ===`)
  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 30000 })
  await sleep(1500)
  const fit = page.locator('.react-flow__controls-fitview').first()
  if (await fit.count()) { await fit.click(); await sleep(600) }
  const box = await node.boundingBox()
  log(`node bbox=${JSON.stringify(box)} url=${page.url()}`)
  log(`baseline: nav=${navCount} req=${reqCount} reqKinds=${JSON.stringify(reqKinds)}`)

  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
  await cdp.send('Profiler.start')

  log('--- dblclick at node center ---')
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2, { delay: 40 })
  log(`dblclick dispatched t+${((Date.now() - started) / 1000).toFixed(2)}s; nav=${navCount}`)

  for (let i = 0; i < 15; i++) {
    await sleep(1000)
    let resp = false
    try {
      await Promise.race([page.evaluate('1+1'), new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 2500))])
      resp = true
    } catch { resp = false }
    log(`[t+${((Date.now() - started) / 1000).toFixed(1)}s] nav=${navCount} req=${reqCount} kinds=${JSON.stringify(reqKinds)} responsive=${resp} url=${page.url().slice(0, 90)}`)
    if (navCount > 100) { log('>>> LOOP'); break }
  }

  log('--- stopping profiler ---')
  let profile
  try { profile = await cdp.send('Profiler.stop') } catch (e) { log('profiler stop failed: ' + e.message.split('\n')[0]) }
  if (profile) {
    const { nodes, samples, timeDeltas } = profile.profile
    log(`profile nodes=${nodes.length} samples=${samples.length}`)
    const idToNode = new Map(nodes.map(n => [n.id, n]))
    const selfTime = new Map()
    for (let i = 0; i < samples.length; i++) {
      const id = samples[i]; const dt = timeDeltas[i] ?? 0
      selfTime.set(id, (selfTime.get(id) ?? 0) + dt)
    }
    const frameAgg = new Map()
    for (const [id, ms] of selfTime) {
      const n = idToNode.get(id); if (!n) continue
      const chain = []
      let cur = n; const seen = new Set()
      while (cur && !seen.has(cur.id) && chain.length < 10) {
        seen.add(cur.id)
        chain.unshift(`${cur.callFrame.functionName || '(anon)'} ${cur.callFrame.url.split('/').pop()}:${cur.callFrame.lineNumber}`)
        cur = idToNode.get(cur.parent)
      }
      const key = chain.join(' <- ')
      frameAgg.set(key, (frameAgg.get(key) ?? 0) + ms)
    }
    const top = [...frameAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    log('=== top self-time stacks ===')
    for (const [k, ms] of top) log(`${(ms / 1000).toFixed(1)}ms  ${k}`)
  }
  log(`=== end: nav=${navCount} req=${reqCount} kinds=${JSON.stringify(reqKinds)} ===`)
  await browser.close()
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); process.exit(1) })
