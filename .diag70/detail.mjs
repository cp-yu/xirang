import { chromium } from '@playwright/test'
import fs from 'node:fs'
import http from 'node:http'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/detail.txt'
const LOG = []
const log = m => { LOG.push(m); fs.appendFileSync(OUT, m + '\n') }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const beacons = []
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', c => { body += c })
  req.on('end', () => { beacons.push(body.slice(0, 2000)); res.writeHead(200); res.end('ok') })
})
server.listen(9993, '127.0.0.1')

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const cdp = await page.context().newCDPSession(page)

  await page.addInitScript(() => {
    let seq = 0
    const send = (kind, detail) => {
      try {
        seq += 1
        const msg = `SEQ=${seq} ${kind} :: ${detail || ''}\n${(new Error().stack || '').split('\n').slice(1, 6).join('\n')}`
        navigator.sendBeacon('http://127.0.0.1:9993/nav', msg)
      } catch (e) {}
    }
    try {
      const loc = window.location
      const origReload = loc.reload.bind(loc)
      loc.reload = function (...a) { send('RELOAD', loc.href); return origReload.apply(this, a) }
      const origReplace = loc.replace.bind(loc)
      loc.replace = function (u) { send('REPLACE', String(u)); return origReplace(u) }
      const push = history.pushState.bind(history)
      history.pushState = function (...a) { send('PUSH', `url=${String(a[2])} state=${JSON.stringify(a[0]).slice(0, 120)}`); return push(...a) }
      const rep = history.replaceState.bind(history)
      history.replaceState = function (...a) {
        send('REPLACESTATE', `url=${String(a[2])} state=${JSON.stringify(a[0]).slice(0, 160)}`)
        return rep(...a)
      }
      window.addEventListener('beforeunload', () => send('BEFOREUNLOAD', loc.href))
      send('INSTALLED', loc.href)
    } catch (e) {
      navigator.sendBeacon('http://127.0.0.1:9993/nav', 'FAILED: ' + e.message)
    }
  },)

  let navCount = 0
  const started = Date.now()
  page.on('framenavigated', f => { if (f === page.mainFrame()) { navCount += 1; if (navCount <= 3) log(`[nav#${navCount}] ${f.url().slice(0, 90)}`) } })

  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 30000 })
  await sleep(900)
  const fit = page.locator('.react-flow__controls-fitview').first()
  if (await fit.count()) { await fit.click(); await sleep(500) }
  const box = await node.boundingBox()
  log(`node bbox=${JSON.stringify(box)} nav=${navCount} beacons=${beacons.length}`)

  const x = box.x + box.width / 2, y = box.y + box.height / 2
  cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 2 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 2 }).catch(() => {})
  log('dblclick fired')

  for (let i = 0; i < 5; i++) {
    await sleep(1000)
    log(`[t+${i + 1}s] nav=${navCount} beacons=${beacons.length}`)
  }

  log('=== beacon sequence (deduped consecutive) ===')
  let prev = null, dup = 0
  for (const b of beacons) {
    const line = b.split('\n')[0]
    if (line === prev) { dup += 1; continue }
    if (dup > 0) log(`  ... x${dup} more of previous`)
    dup = 0
    prev = line
    log(line)
  }
  if (dup > 0) log(`  ... x${dup} more of previous`)
  log(`=== end: nav=${navCount} beacons=${beacons.length} ===`)
  server.close()
  try { await browser.close() } catch (e) {}
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); server.close(); process.exit(1) })
