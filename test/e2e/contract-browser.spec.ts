import { expect, test, type Locator, type Page } from '@playwright/test'

async function openDetails(page: Page, id: string): Promise<Locator> {
  const node = page.locator(`.react-flow__node[data-id="root.${id}"]`)
  await expect(node).toBeVisible({ timeout: 20_000 })
  await node.click()
  const dialog = page.locator('dialog[open]')
  if (await dialog.count() === 0) await node.click()
  await expect(dialog).toBeVisible()
  return dialog
}

async function closeDetails(dialog: Locator): Promise<void> {
  await dialog.press('Escape')
  await expect(dialog).toHaveCount(0)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/view/index/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('browses Element Contracts through the Contract endpoint and selectors', async ({ page }) => {
  const response = await page.request.get('/__xirang/contract?project=xirang&element=single&variant=formal')
  expect(response.ok()).toBe(true)
  expect(await response.json()).toMatchObject({ element: 'single' })

  const legacy = await page.request.get('/__xirang/spec?project=xirang&element=single&variant=formal', {
    headers: { accept: 'application/json' },
  })
  expect(legacy.ok()).toBe(false)

  let dialog = await openDetails(page, 'none')
  await expect(dialog.getByRole('tab', { name: 'Contracts' })).toHaveCount(0)
  await closeDetails(dialog)

  dialog = await openDetails(page, 'single')
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  const contracts = dialog.locator('[data-xirang-contracts]')
  await expect(contracts).toHaveAttribute('data-xirang-variant', 'formal')
  await expect(contracts.locator('[data-xirang-contract-content]')).toContainText('Single Contract behavior')
  await closeDetails(dialog)

  dialog = await openDetails(page, 'long')
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  const content = dialog.locator('[data-xirang-contract-content]')
  await expect(content).toContainText('Long Contract section eight')
  expect(await content.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
})

test('keeps the Contract tab and content inside a mobile Contract dialog', async ({ page }) => {
  const dialog = await openDetails(page, 'single')
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  const content = dialog.locator('[data-xirang-contract-content]')
  await expect(content).toBeVisible()

  const bounds = await dialog.evaluate(element => {
    const dialogRect = element.getBoundingClientRect()
    const tabs = element.querySelector('[role="tablist"]')?.getBoundingClientRect()
    const contract = element.querySelector('[data-xirang-contract-content]')?.getBoundingClientRect()
    return {
      dialog: { left: dialogRect.left, right: dialogRect.right, top: dialogRect.top, bottom: dialogRect.bottom },
      tabs: tabs && { left: tabs.left, right: tabs.right, bottom: tabs.bottom },
      contract: contract && { left: contract.left, right: contract.right, top: contract.top },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }
  })

  expect(bounds.dialog.left).toBeGreaterThanOrEqual(0)
  expect(bounds.dialog.right).toBeLessThanOrEqual(bounds.viewport.width)
  expect(bounds.dialog.top).toBeGreaterThanOrEqual(0)
  expect(bounds.dialog.bottom).toBeLessThanOrEqual(bounds.viewport.height)
  expect(bounds.tabs).not.toBeNull()
  expect(bounds.contract).not.toBeNull()
  expect(bounds.tabs!.left).toBeGreaterThanOrEqual(bounds.dialog.left)
  expect(bounds.tabs!.right).toBeLessThanOrEqual(bounds.dialog.right)
  expect(bounds.contract!.left).toBeGreaterThanOrEqual(bounds.dialog.left)
  expect(bounds.contract!.right).toBeLessThanOrEqual(bounds.dialog.right)
  expect(bounds.contract!.top).toBeGreaterThanOrEqual(bounds.tabs!.bottom)
})
