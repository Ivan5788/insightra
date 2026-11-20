import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('drill-down', () => {
  test('revenue: month → day → product → orders, with breadcrumb navigation', async ({ page }) => {
    await login(page)
    await page.getByTestId('kpi-revenue-drill').click()

    const panel = page.getByRole('dialog')
    await expect(panel.getByRole('heading', { level: 2 })).toHaveText('各月營收')
    await expect(panel.getByText('第 1 層')).toBeVisible()

    // Level 2: click the most recent month row
    await panel.locator('tbody tr.is-clickable').last().click()
    await expect(panel.getByText('第 2 層')).toBeVisible()
    await expect(panel.getByRole('heading', { level: 2 })).toContainText('每日營收')

    // Level 3: first day
    await panel.locator('tbody tr.is-clickable').first().click()
    await expect(panel.getByRole('heading', { level: 2 })).toContainText('各商品營收')

    // Level 4: first product → its orders
    await panel.locator('tbody tr.is-clickable').first().click()
    await expect(panel.getByRole('heading', { level: 2 })).toContainText('訂單')
    await expect(panel.getByText('第 4 層')).toBeVisible()

    // Back one level, then jump to the top through the breadcrumb
    await panel.getByTestId('drill-back').click()
    await expect(panel.getByText('第 3 層')).toBeVisible()
    await panel
      .getByRole('navigation', { name: '鑽取路徑' })
      .getByRole('button', { name: '各月營收' })
      .click()
    await expect(panel.getByText('第 1 層')).toBeVisible()
  })

  test('channel flow shows the conversion funnel', async ({ page }) => {
    await login(page, '/analytics')
    await page.getByTestId('drill-channel').click()
    const panel = page.getByRole('dialog')
    await panel.locator('tbody tr.is-clickable').first().click()
    await expect(panel.getByText('漏斗階段')).toBeVisible()
    await expect(panel.getByText('完成購買')).toBeVisible()
  })
})
