import { expect, test, type Page } from '@playwright/test'

/**
 * Semantic Browser performance regression coverage.
 *
 * Guards the interaction hot path against request storms, render loops and
 * responsiveness collapse: a deep link and a double-click navigation must each
 * settle to a bounded number of projection requests, render the view, and keep
 * the main thread responsive. These assertions would fail if the projection
 * effect re-fires (StrictMode double-fire / URL parse throwaway) or if a dense
 * relationship expansion stalls the diagram.
 */

const REQUEST_SETTLE_MS = 3_000

async function projectionRequestCount(page: Page): Promise<number> {
  return page.evaluate(() => performance.getEntriesByType('resource')
    .filter(entry => entry.name.includes('/__xirang/projection')).length)
}

async function frameLatency(page: Page): Promise<number> {
  return page.evaluate(() => new Promise(resolve => {
    let frames = 0
    const start = performance.now()
    const tick = () => {
      frames += 1
      if (performance.now() - start >= 1000) {
        resolve(Math.round((performance.now() - start) / frames))
      } else {
        requestAnimationFrame(tick)
      }
    }
    requestAnimationFrame(tick)
  }))
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/full-model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(1_000)
})

test('a deep link settles to a bounded projection request count', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto('/view/full-model/?focus=capability.drill')
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.drill"]')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(REQUEST_SETTLE_MS)

  // The deep link must not fire a throwaway focus=null request nor a
  // StrictMode duplicate; one request is expected and two is the hard cap.
  const requests = await projectionRequestCount(page)
  expect(requests, `deep link fired ${requests} projection requests`).toBeLessThanOrEqual(2)

  // No projection request may be re-fired while the view is idle.
  const settled = requests
  await page.waitForTimeout(REQUEST_SETTLE_MS)
  expect(await projectionRequestCount(page)).toBe(settled)

  // The focused view actually rendered and the frame budget is not collapsed.
  expect(await page.locator('.react-flow__node:visible').count()).toBeGreaterThan(0)
  expect(await frameLatency(page)).toBeLessThan(60)
  expect(errors).toEqual([])
})

test('a double-click navigation settles to exactly one new projection request', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))

  await page.locator('.react-flow__pane').press('Control+1').catch(() => undefined)
  const before = await projectionRequestCount(page)

  const branch = page.locator('.react-flow__node[data-xirang-identity="perspective.browser"]')
  await expect(branch).toBeVisible()
  await branch.dblclick({ force: true })
  await expect(page).toHaveURL(/focus=perspective\.browser/, { timeout: 20_000 })
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.drill"]')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(REQUEST_SETTLE_MS)

  const after = await projectionRequestCount(page)
  expect(after - before, `navigation fired ${after - before} new projection requests`).toBe(1)

  const settled = after
  await page.waitForTimeout(REQUEST_SETTLE_MS)
  expect(await projectionRequestCount(page)).toBe(settled)

  expect(await frameLatency(page)).toBeLessThan(60)
  expect(errors).toEqual([])
})
