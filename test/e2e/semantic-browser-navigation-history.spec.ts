import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/view/model/')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
})

test('keeps View source and full/diff mode as history steps', async ({ page }) => {
  await page.getByRole('button', { name: 'Untitled View' }).click()
  const dropdown = page.locator('[data-likec4-breadcrumbs-dropdown]')
  await expect(dropdown).toBeVisible()
  const viewSource = dropdown.getByLabel('View source')

  // Switching the source is one history step carrying the new source.
  await viewSource.selectOption('change:browser-change')
  await expect(page).toHaveURL(/source=change%3Abrowser-change/)
  await expect(page.locator('[data-xirang-architecture-overlay][data-xirang-architecture-mode]')).toBeVisible()

  // Toggling full/diff is one history step carrying the mode.
  await page.getByRole('button', { name: 'Diff only' }).click()
  await expect(page).toHaveURL(/mode=diff/)

  // Browser back/forward restores the display mode (full is the default, so it is stripped).
  await page.evaluate(() => window.history.back())
  await expect(page).not.toHaveURL(/mode=diff/)
  await page.evaluate(() => window.history.forward())
  await expect(page).toHaveURL(/mode=diff/)

  // Browser back returns to the previous source, forward re-applies the change source.
  await page.evaluate(() => window.history.back())
  await expect(page).not.toHaveURL(/mode=diff/)
  await page.evaluate(() => window.history.back())
  await expect(page).not.toHaveURL(/source=change/)
  await page.evaluate(() => window.history.forward())
  await expect(page).toHaveURL(/source=change%3Abrowser-change/)
})

test('browses Model View deep link and strips Xirang params on Authored Views', async ({ page }) => {
  // A deep link with a focus parameter restores the focused layer.
  await page.goto('/view/model/?source=model&focus=perspective.browser')
  await expect(page.locator('[data-xirang-focus-breadcrumb]')).toContainText('Browser Perspective')
  await expect(page).toHaveURL(/focus=perspective\.browser/)

  // Authored View routes must not carry Xirang navigation params.
  await page.goto('/view/index/?source=model&focus=perspective.browser&mode=diff')
  await expect(page).toHaveURL(/\/view\/index\//)
  await expect(page).not.toHaveURL(/[\?&](source|focus|mode)=/)
})
