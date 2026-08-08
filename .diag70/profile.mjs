import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/profile.txt'
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
  const started = Date.now()
  page.on('framenavigated', f => { if (f === page.mainFrame()) { navCount += 1; if (navCount <= 4) log(`[nav#${navCount}] ${f.url().slice(0, 90)}`) } })

  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 30000 })
  await sleep(900)
  const fit = page.locator('.react-flow__controls-fitview').first()
  if (await fit.count()) { await fit.click(); await sleep(500) }
  const box = await node.boundingBox()
  log(`node bbox=${JSON.stringify(box)} nav=${navCount}`)

  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 100 })
  await cdp.send('Profiler.start')

  const x = box.x + box.width / 2, y = box.y + box.height / 2
  cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 2 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 2 }).catch(() => {})
  log('dblclick fired; profiling 4s...')

  await sleep(4000)
  log(`nav at stop: ${navCount}`)
  const profile = await cdp.send('Profiler.stop')
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
    while (cur && !seen.has(cur.id) && chain.length < 12) {
      seen.add(cur.id)
      const url = cur.callFrame.url || ''
      const short = url.includes('main') ? 'main' : url.includes('tanstack') ? '@tanstack' : url.includes('react-dom') ? 'react-dom' : url.split('/').pop()
      chain.unshift(`${cur.callFrame.functionName || '(anon)'} ${short}:${cur.callFrame.lineNumber}`)
      cur = idToNode.get(cur.parent)
    }
    const key = chain.join(' <- ')
    frameAgg.set(key, (frameAgg.get(key) ?? 0) + ms)
  }
  const top = [...frameAgg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  log('=== top self-time stacks (ms) ===')
  for (const [k, ms] of top) log(`${(ms / 1000).toFixed(1)}ms  ${k}`)

  // raw top nodes
  log('=== top raw nodes ===')
  const rawTop = [...selfTime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  for (const [id, ms] of rawTop) {
    const n = idToNode.get(id)
    const url = n.callFrame.url || ''
    const short = url.includes('main') ? 'main' : url.includes('tanstack') ? '@tanstack' : url.includes('react-dom') ? 'react-dom' : url.split('/').pop()
    log(`${(ms / 1000).toFixed(1)}ms ${n.callFrame.functionName || '(anon)'} ${short}:${n.callFrame.lineNumber}`)
  }
  log(`=== end: nav=${navCount} ===`)
  try { await browser.close() } catch (e) {}
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); process.exit(1) })
