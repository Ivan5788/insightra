import { expect, test } from '@playwright/test'
import { login, revenueKpi } from './helpers'

test.describe('dashboard overview', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('renders KPI cards, charts and the mock-data label', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('總覽儀表板')
    await expect(page.getByTestId('stat-value')).toHaveCount(6)
    await expect(page.locator('canvas').first()).toBeVisible()
    await expect(page.getByText('模擬資料', { exact: true }).first()).toBeVisible()
  })

  test('changing the date range updates KPIs and the URL', async ({ page }) => {
    const before = await revenueKpi(page)
    await page.getByTestId('date-range-trigger').click()
    await page.getByTestId('preset-last7').click()
    await expect(page).toHaveURL(/range=last7/)
    await expect.poll(() => revenueKpi(page)).not.toBe(before)
  })

  test('widget changes are saved and restored after reload', async ({ page }) => {
    const widgets = page.locator('[data-widget-id]')
    await expect(widgets.first()).toBeVisible()
    const count = await widgets.count()
    expect(count).toBeGreaterThan(5)

    await page.getByTestId('edit-dashboard').click()
    await page.getByTestId('widget-remove').first().click()
    await page.getByTestId('confirm-ok').click()
    await page.getByTestId('add-widget').click()
    await page.getByTestId('add-activity').click()
    await page.getByTestId('save-dashboard').click()
    await expect(widgets).toHaveCount(count) // -1 +1

    await page.reload()
    await expect(widgets).toHaveCount(count)
    // The removed widget (Total Revenue KPI) is gone, the new activity widget is last.
    await expect(widgets.last()).toContainText('最近動態')
  })

  test('cancel discards unsaved edits', async ({ page }) => {
    const widgets = page.locator('[data-widget-id]')
    await expect(widgets.first()).toBeVisible()
    const count = await widgets.count()
    expect(count).toBeGreaterThan(5)
    await page.getByTestId('edit-dashboard').click()
    // Regression: edit toolbars on small KPI widgets must not cause horizontal scroll.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await page.getByTestId('widget-remove').first().click()
    await page.getByTestId('confirm-ok').click()
    await page.getByTestId('cancel-edit').click()
    await page.getByTestId('confirm-ok').click()
    await expect(widgets).toHaveCount(count)
  })

  test('dark mode is applied and remembered', async ({ page }) => {
    const html = page.locator('html')
    const initial = await html.getAttribute('data-theme')
    await page.getByTestId('theme-toggle').click()
    const toggled = initial === 'dark' ? 'light' : 'dark'
    await expect(html).toHaveAttribute('data-theme', toggled)
    await page.reload()
    await expect(html).toHaveAttribute('data-theme', toggled)
  })
})
