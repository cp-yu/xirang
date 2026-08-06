import { expect, test, type Page } from '@playwright/test'

async function visibleNodeIds(page: Page): Promise<string[]> {
  return page.locator('.react-flow__node:visible').evaluateAll(nodes =>
    nodes
      .map(node => node.getAttribute('data-id') ?? '')
      .filter(Boolean)
      .sort()
  )
}

async function exportPngAndCapturePopup(page: Page): Promise<{
  snapshot: Record<string, unknown> | null
  popupNodes: string[] | null
}> {
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
  await page.getByRole('menuitem', { name: 'Export as .png' }).click()
  const popup = await popupPromise
  const snapshot = await page.evaluate(() => {
    const raw = sessionStorage.getItem('xirang:export-snapshot')
    return raw ? JSON.parse(raw) : null
  })
  let popupNodes: string[] | null = null
  if (popup) {
    // The popup auto-downloads and closes itself; capture the rendered nodes before that.
    try {
      await expect.poll(async () => popup.locator('.react-flow__node:visible').count(), { timeout: 5000 })
        .toBeGreaterThan(0)
      popupNodes = await popup.locator('.react-flow__node:visible').evaluateAll(nodes =>
        nodes.map(node => node.getAttribute('data-id') ?? '').filter(Boolean).sort()
      )
    } catch {
      popupNodes = null
    }
    await popup.close().catch(() => undefined)
  }
  return { snapshot, popupNodes }
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
  await expect.poll(async () => visibleNodeIds(page), { timeout: 10_000 })
    .toEqual(['capability.drill', 'capability.leaf', 'capability.peer', 'perspective.browser'])
  const onScreen = await visibleNodeIds(page)

  // The Header export carries the current state into the export tab via sessionStorage;
  // the actual export tab must render the on-screen node set (WYSIWYG).
  const { snapshot, popupNodes } = await exportPngAndCapturePopup(page)
  expect(snapshot).toMatchObject({
    source: 'model',
    mode: 'full',
    focus: 'perspective.browser',
  })
  expect(snapshot?.expanded).toContain('capability.drill')
  expect(popupNodes).toEqual(onScreen)
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

  const { snapshot, popupNodes } = await exportPngAndCapturePopup(page)
  expect(snapshot).toMatchObject({
    source: 'change:browser-change',
    mode: 'diff',
  })
  expect(popupNodes).toContain('capability.added-parent')
})

test('exports without a snapshot', async ({ page }) => {
  await page.goto('/export/model/?download=false')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  await expect.poll(async () => (await visibleNodeIds(page)).length, { timeout: 10_000 }).toBeGreaterThan(0)
  await expect(page.locator('[data-testid="export-page"]')).toBeVisible()
})
