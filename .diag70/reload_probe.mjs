import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:43171'
const OUT = process.env.OUT || '/tmp/diag70/reload_probe.txt'
const LOG = []
const log = m => { LOG.push(m); fs.appendFileSync(OUT, m + '\n') }

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  })
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

  let navCount = 0
  let navLogCount = 0
  let reqCount = 0
  const reqKinds = {}
  const started = Date.now()
  page.on('framenavigated', f => {
    navCount += 1
    if (navLogCount < 25) {
      navLogCount += 1
      log(`[nav #${navCount} t+${((Date.now() - started) / 1000).toFixed(2)}s] frame=${f === page.mainFrame() ? 'MAIN' : 'sub'} url=${f.url()}`)
    }
  })
  page.on('request', req => {
    reqCount += 1
    const u = req.url()
    let k = 'other'
    if (u.includes('/__xirang/projection')) k = 'projection'
    else if (u.includes('/__xirang/changes')) k = 'changes'
    else if (u.includes('/__xirang/')) k = 'xirang'
    else if (u.endsWith('/')) k = 'html'
    else if (/\.(ts|tsx|mjs|js|css)$/.test(u) || u.includes('?import')) k = 'module'
    reqKinds[k] = (reqKinds[k] ?? 0) + 1
    if (reqCount <= 20) log(`  [req #${reqCount} t+${((Date.now() - started) / 1000).toFixed(2)}s] ${req.method()} ${u.slice(0, 160)}`)
  })

  log(`=== probe start ${new Date().toISOString()} ===`)
  log(`goto ${BASE}/view/model/?focus=realization-process`)
  await page.goto(`${BASE}/view/model/?focus=realization-process`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => log('goto error: ' + e.message.split('\n')[0]))

  // sample every second
  for (let i = 0; i < 20; i++) {
    await sleep(1000)
    const navs = navCount
    const reqs = reqCount
    let mainResponsive = false
    try {
      await Promise.race([
        page.evaluate('1+1'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('eval-timeout')), 3000)),
      ])
      mainResponsive = true
    } catch { mainResponsive = false }
    log(`[t+${i + 1}s] navCount=${navs} reqCount=${reqs} reqKinds=${JSON.stringify(reqKinds)} mainResponsive=${mainResponsive} url=${page.url().slice(0, 100)}`)
    if (navs > 100) {
      log('>>> RELOAD LOOP DETECTED (navCount > 100) - stopping early')
      break
    }
  }

  // check html for meta refresh on a stable load
  try {
    const html = await page.content().catch(() => '')
    const metaRefresh = /<meta[^>]*http-equiv=["']refresh["']/i.test(html)
    log(`meta refresh tag in final HTML: ${metaRefresh}`)
    const frameCount = page.frames().length
    log(`frame count: ${frameCount}`)
    for (const fr of page.frames()) log(`  frame: ${fr === page.mainFrame() ? 'MAIN' : 'sub'} url=${fr.url().slice(0, 120)}`)
  } catch (e) { log('html probe error: ' + e.message.split('\n')[0]) }

  log(`=== probe end: total nav=${navCount} req=${reqCount} reqKinds=${JSON.stringify(reqKinds)} ===`)
  await browser.close()
}

main().catch(e => { log('FATAL ' + e.message.split('\n')[0]); process.exit(1) })
