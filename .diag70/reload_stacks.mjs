import { chromium } from '@playwright/test'
import fs from 'node:fs'
import http from 'node:http'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/reload_stacks.txt'
const LOG = []
const log = m => { LOG.push(m); fs.appendFileSync(OUT, m + '\n') }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// tiny beacon collector
const beacons = []
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', c => { body += c })
  req.on('end', () => {
    beacons.push({ url: req.url, body: body.slice(0, 4000) })
    res.writeHead(200); res.end('ok')
  })
})
server.listen(9999, '127.0.0.1')
log('beacon server on 9999')

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const cdp = await page.context().newCDPSession(page)

  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      (() => {
        const send = (kind, detail) => {
          try {
            const msg = kind + ' :: ' + (detail || '') + '\\n' + (new Error().stack || '').split('\\n').slice(1, 10).join('\\n');
            navigator.sendBeacon('http://127.0.0.1:9999/nav', msg);
          } catch (e) {}
        };
        try {
          const loc = window.location;
          const origReload = loc.reload.bind(loc);
          loc.reload = function(...a) { send('location.reload()', loc.href); return origReload.apply(this, a); };
          const origReplace = loc.replace.bind(loc);
          loc.replace = function(u) { send('location.replace()', String(u)); return origReplace(u); };
          const origAssign = loc.assign.bind(loc);
          loc.assign = function(u) { send('location.assign()', String(u)); return origAssign(u); };
          const push = history.pushState.bind(history);
          history.pushState = function(...a) { send('history.pushState()', String(a[2])); return push(...a); };
          const rep = history.replaceState.bind(history);
          history.replaceState = function(...a) { send('history.replaceState()', String(a[2])); return rep(...a); };
          window.addEventListener('beforeunload', () => send('beforeunload', loc.href));
        } catch (e) {}
      })();
    `,
  })

  let navCount = 0
  const started = Date.now()
  page.on('framenavigated', f => {
    navCount += 1
    if (navCount <= 12) log(`[nav #${navCount} t+${((Date.now() - started) / 1000).toFixed(2)}s] MAIN=${f === page.mainFrame()} url=${f.url().slice(0, 120)}`)
  })

  log(`=== stack probe ${new Date().toISOString()} ===`)
  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 30000 })
  await sleep(1200)
  const fit = page.locator('.react-flow__controls-fitview').first()
  if (await fit.count()) { await fit.click(); await sleep(800) }
  const box = await node.boundingBox()
  log(`node bbox=${JSON.stringify(box)} nav=${navCount}`)

  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 2 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 2 })
  log('dblclick dispatched via CDP')

  // dump unique stacks incrementally every 1s so a crash never loses evidence
  const dump = () => {
    const seen = new Map()
    for (const b of beacons) { seen.set(b.body, (seen.get(b.body) ?? 0) + 1) }
    log(`--- unique beacon stacks @t+${((Date.now()-started)/1000).toFixed(1)}s nav=${navCount} beacons=${beacons.length} unique=${seen.size} ---`)
    let i = 0
    for (const [body, cnt] of seen) {
      i += 1; if (i > 10) break
      log(`----- x${cnt} -----`)
      log(body.slice(0, 1200))
    }
  }
  const iv = setInterval(dump, 1500)
  await sleep(5000)
  clearInterval(iv)
  dump()
  log(`after 5s: nav=${navCount} beacons=${beacons.length}`)

  // dedupe identical beacon stacks
  const seen = new Map()
  for (const b of beacons) {
    const key = b.body
    if (seen.has(key)) seen.set(key, seen.get(key) + 1)
    else seen.set(key, 1)
  }
  log('=== unique beacon stacks (count) ===')
  let i = 0
  for (const [body, cnt] of seen) {
    i += 1
    if (i > 12) break
    log(`----- x${cnt} -----`)
    log(body.slice(0, 1500))
  }
  log(`=== end: nav=${navCount} beacons=${beacons.length} unique=${seen.size} ===`)
  server.close()
  try { await browser.close() } catch (e) { log('browser close: ' + e.message.split('\n')[0]) }
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); server.close(); process.exit(1) })
