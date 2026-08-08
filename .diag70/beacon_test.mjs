import { chromium } from '@playwright/test'
import http from 'node:http'
const beacons = []
const server = http.createServer((req, res) => {
  let body = ''
  req.on('data', c => { body += c })
  req.on('end', () => { beacons.push(body); res.writeHead(200, { 'Access-Control-Allow-Origin': '*' }); res.end('ok') })
})
server.listen(9997, '127.0.0.1')
const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage','--no-sandbox','--disable-gpu'] })
const page = await browser.newPage()
await page.goto('http://localhost:43171/view/model/?focus=realization-process', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2000)
const r1 = await page.evaluate(() => navigator.sendBeacon('http://127.0.0.1:9997/t', 'hello-from-page'))
console.log('sendBeacon returned:', r1)
await page.waitForTimeout(1000)
console.log('beacons received:', JSON.stringify(beacons))
await browser.close()
server.close()
