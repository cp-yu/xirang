import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/matrix.txt'
const LOG = []
const log = m => { LOG.push(m); fs.appendFileSync(OUT, m + '\n') }
const sleep = ms => new Promise(r => setTimeout(r, ms))
const MODE = process.env.MODE || 'double' // fit | single | double

async function runOnce(browser, label, doAction) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  let navCount = 0
  const started = Date.now()
  page.on('framenavigated', f => {
    if (f === page.mainFrame()) {
      navCount += 1
      if (navCount <= 8) log(`  [${label} nav#${navCount} t+${((Date.now() - started) / 1000).toFixed(2)}s] ${f.url().slice(0, 90)}`)
    }
  })
  try {
    await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.locator('.react-flow__pane').waitFor({ state: 'visible', timeout: 30000 })
    const node = page.locator('.react-flow__node[data-xirang-identity="change-realization"]')
    await node.waitFor({ state: 'visible', timeout: 30000 })
    await sleep(1000)
    await doAction(page, node)
    await sleep(4000)
    log(`  [${label}] RESULT nav=${navCount}`)
  } catch (e) {
    log(`  [${label}] ERROR ${e.message.split('\n')[0]} nav=${navCount}`)
  }
  await page.close().catch(() => {})
  return navCount
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  log(`=== matrix mode=${MODE} ${new Date().toISOString()} ===`)

  if (MODE === 'fit' || MODE === 'single' || MODE === 'double') {
    const fitAction = async (page) => {
      const fit = page.locator('.react-flow__controls-fitview').first()
      if (await fit.count()) { await fit.click(); await sleep(600) }
    }
    if (MODE === 'fit') {
      await runOnce(browser, 'fit-only', fitAction)
    }
    if (MODE === 'single' || MODE === 'double') {
      const click = async (page, node) => {
        const box = await node.boundingBox()
        const x = box.x + box.width / 2, y = box.y + box.height / 2
        if (MODE === 'single') {
          await page.mouse.click(x, y)
        } else {
          await page.mouse.dblclick(x, y, { delay: 40 })
        }
      }
      await runOnce(browser, `${MODE}-with-fit`, async (page, node) => { await fitAction(page); await click(page, node) })
      await runOnce(browser, `${MODE}-no-fit`, async (page, node) => { await click(page, node) })
    }
  }
  log('=== matrix end ===')
  await browser.close().catch(() => {})
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); process.exit(1) })
