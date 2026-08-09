import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('keeps View source and full/diff mode as history steps', async ({ page }) => {
  const change = page.getByLabel('Change Selection')
  const mode = page.getByLabel('Presentation Mode')

  await change.selectOption('browser-change')
  await expect(page).toHaveURL(/change=browser-change/)

  await mode.selectOption('diff-only')
  await expect(page).toHaveURL(/mode=diff-only/)

  await page.evaluate(() => window.history.back())
  await expect(page).not.toHaveURL(/mode=diff-only/)
  await expect(page).toHaveURL(/change=browser-change/)
  await page.evaluate(() => window.history.forward())
  await expect(page).toHaveURL(/mode=diff-only/)

  await page.evaluate(() => window.history.back())
  await page.evaluate(() => window.history.back())
  await expect(page).not.toHaveURL(/change=browser-change/)
  await page.evaluate(() => window.history.forward())
  await expect(page).toHaveURL(/change=browser-change/)
})

test('browses Model View deep link and strips Xirang params on Authored Views', async ({ page }) => {
  await page.goto('/view/model/?focus=perspective.browser')
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).toContainText('Browser Perspective')
  await expect(page).toHaveURL(/focus=perspective\.browser/)

  await page.getByLabel('View Selection').selectOption('index')
  await expect(page).toHaveURL(/view=index/)
  await expect(page).not.toHaveURL(/focus=/)
})
