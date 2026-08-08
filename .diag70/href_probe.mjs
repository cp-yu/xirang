import { chromium } from '@playwright/test'
import fs from 'node:fs'
import http from 'node:http'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/href_probe.txt'
const LOG = []
const log = m => { LOG.push(m); fs.appendFileSync(OUT, m + '\n') }
const sleep = ms => new Promise(r => setTimeout(r, ms))

const beacons = []
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', c => { body += c })
  req.on('end', () => { beacons.push(body.slice(0, 5000)); res.writeHead(200); res.end('ok') })
})
server.listen(9998, '127.0.0.1')

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const cdp = await page.context().newCDPSession(page)

  const PATCH = `
    (() => {
      const send = (kind, detail) => {
        try {
          const msg = kind + ' :: ' + (detail || '') + '\\n' + (new Error().stack || '').split('\\n').slice(1, 14).join('\\n');
          navigator.sendBeacon('http://127.0.0.1:9998/nav', msg);
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
        Object.defineProperty(loc, 'href', {
          get() { return loc.href; },
          set(v) { send('location.href SETTER', String(v)); try { loc.assign(v) } catch(e){} },
          configurable: true
        });
        const push = history.pushState.bind(history);
        history.pushState = function(...a) { send('history.pushState()', String(a[2])); return push(...a); };
        const rep = history.replaceState.bind(history);
        history.replaceState = function(...a) { send('history.replaceState()', String(a[2])); return rep(...a); };
        const back = history.back.bind(history);
        history.back = function(...a) { send('history.back()', ''); return back(...a); };
        const fwd = history.forward.bind(history);
        history.forward = function(...a) { send('history.forward()', ''); return fwd(...a); };
        window.addEventListener('beforeunload', () => send('beforeunload', loc.href));
        send('PATCH-INSTALLED', '');
      } catch (e) {
        navigator.sendBeacon('http://127.0.0.1:9998/nav', 'PATCH-FAILED: ' + e.message);
      }
    })();
  `
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PATCH })

  let navCount = 0
  const started = Date.now()
  page.on('framenavigated', f => {
    if (f === page.mainFrame()) { navCount += 1; if (navCount <= 4) log(`[nav#${navCount} t+${((Date.now() - started) / 1000).toFixed(2)}s] ${f.url().slice(0, 90)}`) }
  })

  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 30000 })
  await sleep(800)
  const fit = page.locator('.react-flow__controls-fitview').first()
  if (await fit.count()) { await fit.click(); await sleep(500) }
  const box = await node.boundingBox()
  log(`node bbox=${JSON.stringify(box)} nav=${navCount} beaconsSoFar=${beacons.length}`)
  log(`beacons so far: ${JSON.stringify(beacons.map(b => b.split('\\n')[0]))}`)

  const x = box.x + box.width / 2, y = box.y + box.height / 2
  cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 2 }).catch(() => {})
  cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 2 }).catch(() => {})
  log('dblclick fired')

  for (let i = 0; i < 4; i++) {
    await sleep(1000)
    log(`[t+${((Date.now() - started) / 1000).toFixed(1)}s] nav=${navCount} beacons=${beacons.length}`)
  }

  log('=== unique beacon stacks ===')
  const seen = new Map()
  for (const b of beacons) seen.set(b, (seen.get(b) ?? 0) + 1)
  let i = 0
  for (const [body, cnt] of seen) {
    i += 1
    if (i > 15) break
    log(`----- x${cnt} -----`)
    log(body.slice(0, 1800))
  }
  log(`=== end: nav=${navCount} beacons=${beacons.length} unique=${seen.size} ===`)
  server.close()
  try { await browser.close() } catch (e) {}
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); server.close(); process.exit(1) })
