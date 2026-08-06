import { expect, test, type Page } from '@playwright/test'

async function visibleNodeIds(page: Page): Promise<string[]> {
  return page.locator('.react-flow__node:visible').evaluateAll(nodes =>
    nodes
      .map(node => node.getAttribute('data-id') ?? '')
      .filter(Boolean)
      .sort()
  )
}

async function exportPngAndReadSnapshot(page: Page): Promise<Record<string, unknown>> {
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
  await page.getByRole('menuitem', { name: 'Export as .png' }).click()
  const popup = await popupPromise
  if (popup) {
    await popup.close().catch(() => undefined)
  }
  return page.evaluate(() => {
    const raw = sessionStorage.getItem('xirang:export-snapshot')
    return raw ? JSON.parse(raw) : null
  })
}

async function dragChangePanelAway(page: Page): Promise<void> {
  const panel = page.locator('[data-xirang-architecture-overlay][data-xirang-architecture-mode]')
  await expect(panel).toBeVisible()
  const handle = panel.getByText(/^Change \//)
  const handleBox = await handle.boundingBox()
  const before = await panel.boundingBox()
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2 - 300,
    handleBox!.y + handleBox!.height / 2 + 200,
    { steps: 12 },
  )
  await page.mouse.up()
  await expect.poll(async () => (await panel.boundingBox())?.x).toBeLessThan(before!.x - 100)
}

test('exports the current focus and expand-in-place state', async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })

  // Focus into perspective.browser, then expand capability.drill in place.
  const perspective = page.locator('.react-flow__node[data-id="perspective.browser"]')
  await expect(perspective).toBeVisible()
  await perspective.dblclick()
  await expect(page).toHaveURL(/focus=perspective\.browser/)

  const drill = page.locator('.react-flow__node[data-id="capability.drill"]')
  await expect(drill).toBeVisible()
  await drill.click({ modifiers: ['Control'] })
  await expect(page.locator('.react-flow__node[data-id="capability.leaf"]')).toBeVisible()
  await page.waitForTimeout(600)
  const onScreen = await visibleNodeIds(page)
  expect(onScreen).toEqual(['capability.drill', 'capability.leaf', 'capability.peer', 'perspective.browser'])

  // The Header export carries the current state into the export tab via sessionStorage.
  const snapshot = await exportPngAndReadSnapshot(page)
  expect(snapshot).toMatchObject({
    source: 'model',
    mode: 'full',
    focus: 'perspective.browser',
  })
  expect(snapshot?.expanded).toContain('capability.drill')

  // The export page renders exactly the on-screen node set (same-tab navigation keeps sessionStorage).
  await page.goto('/export/model/?download=false')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(1000)
  expect(await visibleNodeIds(page)).toEqual(onScreen)
})

test('exports a change source in diff mode', async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Untitled View' }).click()
  await page.locator('[data-likec4-breadcrumbs-dropdown]')
    .getByLabel('View source')
    .selectOption('change:browser-change')
  await page.getByRole('button', { name: 'Diff only' }).click()
  await expect(page.locator('.react-flow__node[data-id="capability.added-parent"]')).toBeVisible()

  // The floating Change panel overlaps the Header export button; drag it clear first.
  await dragChangePanelAway(page)

  const snapshot = await exportPngAndReadSnapshot(page)
  expect(snapshot).toMatchObject({
    source: 'change:browser-change',
    mode: 'diff',
  })

  await page.goto('/export/model/?download=false')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(1000)
  await expect(page.locator('.react-flow__node[data-id="capability.added-parent"]')).toBeVisible()
})

test('exports without a snapshot', async ({ page }) => {
  await page.goto('/export/model/?download=false')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(1000)
  const nodes = await visibleNodeIds(page)
  expect(nodes.length).toBeGreaterThan(0)
  await expect(page.locator('[data-testid="export-page"]')).toBeVisible()
})
