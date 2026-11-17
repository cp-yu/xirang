import { expect, test } from '@playwright/test'
import { promises as fs } from 'node:fs'
import path from 'node:path'

test('opens relative Contract references outside the View and preserves the diagram', async ({ page }) => {
  await page.goto('/view/full-model/?view=index')
  await expect(page.locator('.react-flow__pane')).toBeVisible({ timeout: 20_000 })
  const node = page.locator('.react-flow__node[data-xirang-identity="single"]')
  await expect(node).toBeVisible()
  await node.click()
  await expect(node).toHaveClass(/selected/)
  await node.click()
  const dialog = page.locator('dialog[open]')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  const body = dialog.locator('[data-xirang-contract-content]')
  await expect(body.getByRole('link', { name: '证据', exact: true })).toBeVisible()
  const url = page.url()
  const transform = await page.locator('.react-flow__viewport').getAttribute('style')
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.leaf"]')).toHaveCount(0)

  await body.getByRole('link', { name: '无目标', exact: true }).click()
  await expect(body.getByRole('status')).toHaveText('无法定位引用目标')
  await body.getByRole('link', { name: '无正文', exact: true }).click()
  await expect(body.getByRole('status')).toHaveText('无法定位引用目标')
  await expect(body.getByRole('link', { name: '外部网页' })).toHaveAttribute('href', 'https://example.com')

  await body.getByRole('link', { name: '证据', exact: true }).click()
  await expect(dialog.getByRole('tab', { name: 'Contracts' })).toHaveAttribute('aria-selected', 'true')
  await expect(body).toContainText('第一份时间证据')
  await expect(body.locator('[data-xirang-heading="时间依据"]')).toBeInViewport()
  await expect(page).toHaveURL(url)
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', transform!)
  await expect(page.locator('.react-flow__node[data-xirang-identity="capability.leaf"]')).toHaveCount(0)

  await body.getByRole('link', { name: '返回', exact: true }).click()
  await body.getByRole('link', { name: '重复标题', exact: true }).click()
  await expect(body.locator('[data-xirang-heading="时间依据-1"]')).toBeInViewport()
  await body.getByRole('link', { name: '仅标题', exact: true }).click()
  await expect(body.locator('[data-xirang-heading="时间依据"]')).toBeInViewport()
  await body.getByRole('link', { name: '返回', exact: true }).click()
  await body.getByRole('link', { name: '丢失标题', exact: true }).click()
  await expect(body.getByRole('status')).toHaveText('未找到定位位置')
  await expect(body).toContainText('第一份时间证据')
  await expect(page).toHaveURL(url)
})


test('opens relative Contract references using the refreshed map after a file rename', async ({ page }) => {
  await page.goto('/view/full-model/?view=index')
  const node = page.locator('.react-flow__node[data-xirang-identity="single"]')
  await expect(node).toBeVisible({ timeout: 20_000 })
  await node.click()
  await expect(node).toHaveClass(/selected/)
  await node.click()
  const dialog = page.locator('dialog[open]')
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  const body = dialog.locator('[data-xirang-contract-content]')
  await expect(body.getByRole('link', { name: '证据', exact: true })).toBeVisible()
  const file = path.resolve('test/fixtures/contract-browser/.xirang/model/elements/capability.leaf.md')
  const renamed = path.join(path.dirname(file), 'renamed-evidence.md')
  const url = page.url()
  const transform = await page.locator('.react-flow__viewport').evaluate(el => getComputedStyle(el).transform)
  try {
    const refreshed = page.waitForResponse(async response => {
      const address = new URL(response.url())
      if (address.pathname !== '/__xirang/contract' || address.searchParams.get('element') !== 'single') return false
      try {
        const payload = await response.json()
        return payload.links?.some((link: { href: string; element?: string }) =>
          link.href === 'capability.leaf.md#时间依据' && link.element === undefined) ?? false
      } catch {
        // A second watcher event may cancel the intermediate request.
        return false
      }
    })
    await fs.rename(file, renamed)
    await refreshed
    await body.getByRole('link', { name: '证据', exact: true }).click()
    await expect(body.getByRole('status')).toHaveText('无法定位引用目标')
    await expect(body).toContainText('Single Contract behavior')
    await expect(page.locator('.react-flow__pane')).toBeVisible()
    await expect.poll(() => page.locator('.react-flow__viewport').evaluate(el => getComputedStyle(el).transform)).toBe(transform)
    await expect(page).toHaveURL(url)
  } finally {
    await fs.rename(renamed, file)
  }
})

test('opens relative Contract references from nested and duplicate footnotes by their rendered targets', async ({ page }) => {
  await page.goto('/view/full-model/?view=index')
  const node = page.locator('.react-flow__node[data-xirang-identity="single"]')
  await expect(node).toBeVisible({ timeout: 20_000 })
  await node.click()
  await expect(node).toHaveClass(/selected/)
  await node.click()
  const dialog = page.locator('dialog[open]')
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  const body = dialog.locator('[data-xirang-contract-content]')
  const url = page.url()
  await expect(body.getByRole('link', { name: '被忽略的定义', exact: true })).toHaveCount(0)
  for (const name of ['嵌套脚注证据', '首次定义证据']) {
    await body.getByRole('link', { name, exact: true }).click()
    await expect(dialog.getByText('capability.leaf', { exact: true })).toBeVisible()
    await expect(body).toContainText('第一份时间证据')
    await body.getByRole('link', { name: '返回', exact: true }).click()
  }
  await body.getByRole('link', { name: '普通正文证据', exact: true }).click()
  await expect(dialog.getByText('long', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(url)
})

test('opens relative Contract references with explicit feedback when an advertised Contract disappears', async ({ page }) => {
  await page.route('**/__xirang/contract?**', async route => {
    if (new URL(route.request().url()).searchParams.get('element') === 'single') {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Contract not found' }) })
    } else {
      await route.continue()
    }
  })
  await page.goto('/view/full-model/?view=index')
  const node = page.locator('.react-flow__node[data-xirang-identity="single"]')
  await expect(node).toBeVisible({ timeout: 20_000 })
  await node.click()
  await expect(node).toHaveClass(/selected/)
  await node.click()
  const dialog = page.locator('dialog[open]')
  await dialog.getByRole('tab', { name: 'Contracts' }).click()
  const contracts = dialog.locator('[data-xirang-contracts]')
  await expect(contracts.getByText('single', { exact: true })).toBeVisible()
  await expect(contracts).toContainText('Contract not found')
  await dialog.getByRole('tab', { name: 'Properties', exact: true }).click()
  await expect(dialog.getByRole('tab', { name: 'Properties', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(dialog).toContainText('Single Contract')
})

test('opens relative Contract references without replaying a pending anchor after a source refresh', async ({ page }) => {
  let captured!: () => void
  const oldCaptured = new Promise<void>(resolve => { captured = resolve })
  let release!: () => void
  const released = new Promise<void>(resolve => { release = resolve })
  let finished!: () => void
  const oldFinished = new Promise<void>(resolve => { finished = resolve })
  let first = true
  await page.route('**/__xirang/contract?**', async route => {
    if (new URL(route.request().url()).searchParams.get('element') !== 'capability.leaf' || !first) {
      await route.continue()
      return
    }
    first = false
    try {
      const response = await route.fetch()
      captured()
      await released
      await route.fulfill({ response })
    } catch {
      // Superseding the source may abort the obsolete request before fulfillment.
    } finally {
      finished()
    }
  })
  const file = path.resolve('test/fixtures/contract-browser/.xirang/model/elements/capability.leaf.md')
  const original = await fs.readFile(file, 'utf8')
  try {
    await page.goto('/view/full-model/?view=index')
    const node = page.locator('.react-flow__node[data-xirang-identity="single"]')
    await expect(node).toBeVisible({ timeout: 20_000 })
    await node.click()
    await expect(node).toHaveClass(/selected/)
    await node.click()
    const dialog = page.locator('dialog[open]')
    await dialog.getByRole('tab', { name: 'Contracts' }).click()
    await dialog.getByRole('link', { name: '重复标题', exact: true }).click()
    await oldCaptured
    await fs.writeFile(file, original + '\n\n刷新后的证据正文。\n')
    const body = dialog.locator('[data-xirang-contract-content]')
    await expect(body).toContainText('刷新后的证据正文。')
    await expect.poll(() => body.evaluate(el => el.scrollTop)).toBe(0)
    await expect(body.locator('[data-xirang-heading="时间依据-1"]')).not.toBeInViewport()
    release()
    await oldFinished
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await expect(body).toContainText('刷新后的证据正文。')
    await expect.poll(() => body.evaluate(el => el.scrollTop)).toBe(0)
    await expect(page).toHaveURL(/view=index/)
  } finally {
    release()
    await fs.writeFile(file, original)
  }
})
