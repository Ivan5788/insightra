import { expect, test } from '@playwright/test'
import { login, revenueKpi } from './helpers'

/**
 * Traditional Chinese is the default; English is one click away in
 * Settings → Preferences. Switching must translate the UI AND the API
 * labels, keep the numbers identical and keep the user on the same tab.
 */
test.describe('language switch', () => {
  test('defaults to Traditional Chinese and switches to English', async ({ page }) => {
    await login(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant-TW')
    const kpiZh = await revenueKpi(page)

    await page.goto('/settings?tab=preferences')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('系統設定')
    await page.getByRole('radio', { name: 'English' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveURL(/tab=preferences/)
    await expect(page.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true')

    // Same data, English labels (including labels that come from the API).
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview')
    await expect.poll(() => revenueKpi(page)).toBe(kpiZh)
    await page.getByTestId('kpi-revenue-drill').click()
    await expect(page.getByRole('dialog').getByRole('heading', { level: 2 })).toHaveText('Revenue by month')

    // The choice is remembered.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Overview')
  })
})
