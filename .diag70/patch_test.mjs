import { chromium } from '@playwright/test'
import http from 'node:http'
const beacons = []
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', c => { body += c })
  req.on('end', () => { beacons.push(body); res.writeHead(200); res.end('ok') })
})
server.listen(9996, '127.0.0.1')
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage','--no-sandbox','--disable-gpu'] })
const page = await browser.newPage()
const cdp = await page.context().newCDPSession(page)
const PATCH = `
  (() => {
    try {
      const loc = window.location;
      const origReload = loc.reload.bind(loc);
      loc.reload = function(...a) { return origReload.apply(this, a); };
      const push = history.pushState.bind(history);
      history.pushState = function(...a) { return push(...a); };
      navigator.sendBeacon('http://127.0.0.1:9996/nav', 'PATCH-INSTALLED');
    } catch (e) {
      navigator.sendBeacon('http://127.0.0.1:9996/nav', 'PATCH-FAILED: ' + e.message);
    }
  })();
`
await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PATCH })
await page.goto('http://localhost:43171/view/model/?focus=realization-process', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2000)
console.log('beacons:', JSON.stringify(beacons))
await browser.close()
server.close()
