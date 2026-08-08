import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/reload_cause.txt'
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
  await cdp.send('Network.enable')

  // Log all websocket frames (HMR messages)
  const wsFrames = []
  cdp.on('Network.webSocketFrameReceived', ({ frameId, timestamp, response }) => {
    wsFrames.push({ t: timestamp, data: (response.payloadData || '').slice(0, 300) })
    if (wsFrames.length <= 40) log(`[WS recv] ${JSON.stringify(response.payloadData || '').slice(0, 200)}`)
  })
  cdp.on('Network.webSocketFrameSent', ({ timestamp, request }) => {
    if (wsFrames.length <= 40) log(`[WS send] ${JSON.stringify(request.payloadData || '').slice(0, 200)}`)
  })

  // Patch navigation/reload triggers and record stacks into sessionStorage
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      (() => {
        const record = (kind, detail) => {
          try {
            const key = '__navstacks';
            const prev = sessionStorage.getItem(key) || '';
            const entry = kind + ' :: ' + (detail || '') + '\\n' + (new Error().stack || '').split('\\n').slice(1, 8).join('\\n');
            const next = (prev + '\\n==== ' + new Date().toISOString() + ' ====\\n' + entry).slice(-20000);
            sessionStorage.setItem(key, next);
          } catch (e) {}
        };
        const loc = window.location;
        try {
          const origReload = loc.reload.bind(loc);
          loc.reload = function(...args) { record('location.reload()', this.href); return origReload.apply(this, args); };
          const origReplace = loc.replace.bind(loc);
          loc.replace = function(u) { record('location.replace()', String(u)); return origReplace(u); };
          const origAssign = loc.assign.bind(loc);
          loc.assign = function(u) { record('location.assign()', String(u)); return origAssign(u); };
          // history
          const push = history.pushState.bind(history);
          history.pushState = function(...a) { record('history.pushState()', a[2]); return push(...a); };
          const rep = history.replaceState.bind(history);
          history.replaceState = function(...a) { record('history.replaceState()', a[2]); return rep(...a); };
          // intercept navigate-to-URL full loads via anchor click capturing is hard; also log pagehide
          window.addEventListener('beforeunload', () => { record('beforeunload', location.href); });
        } catch (e) {}
      })();
    `,
  })

  let navCount = 0
  const started = Date.now()
  page.on('framenavigated', f => {
    navCount += 1
    if (navCount <= 30) log(`[nav #${navCount} t+${((Date.now() - started) / 1000).toFixed(2)}s] MAIN=${f === page.mainFrame()} url=${f.url().slice(0, 120)}`)
  })

  log(`=== reload-cause probe ${new Date().toISOString()} ===`)
  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
  const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
  await node.waitFor({ state: 'visible', timeout: 30000 })
  await sleep(1200)
  const fit = page.locator('.react-flow__controls-fitview').first()
  if (await fit.count()) { await fit.click(); await sleep(800) }
  const box = await node.boundingBox()
  log(`node bbox=${JSON.stringify(box)} nav=${navCount}`)

  // dispatch dblclick via CDP so the page tearing down doesn't kill the input
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 1 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 2 })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x + box.width / 2, y: box.y + box.height / 2, button: 'left', clickCount: 2 })
  log('dblclick dispatched via CDP')

  await sleep(6000)
  log(`after 6s: navCount=${navCount} wsFrames=${wsFrames.length}`)

  // try reading sessionStorage stacks
  try {
    const stacks = await page.evaluate(() => sessionStorage.getItem('__navstacks') || '')
    log('=== sessionStorage __navstacks (tail) ===')
    log(stacks.slice(-6000))
  } catch (e) {
    log('could not read sessionStorage (page too unstable): ' + e.message.split('\n')[0])
  }

  // read via a fresh page in the same context? sessionStorage is per-tab; use CDP Storage API
  try {
    const data = await cdp.send('Storage.getStorageKeyForFrame', { frameId: page.mainFrame()._frameId }).catch(() => null)
    log('storage key: ' + JSON.stringify(data))
  } catch (e) { log('storage err ' + e.message.split('\n')[0]) }

  log(`=== end: nav=${navCount} wsFrames=${wsFrames.length} ===`)
  const reloadMsgs = wsFrames.filter(f => typeof f.data === 'string' && f.data.includes('reload'))
  log(`ws frames mentioning reload: ${reloadMsgs.length}`)
  for (const f of reloadMsgs.slice(0, 10)) log('  ' + f.data.slice(0, 200))
  await browser.close()
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); process.exit(1) })
