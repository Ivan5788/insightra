import { expect, test } from '@playwright/test'
import { login } from './helpers'

/** Runs in the "mobile-chromium" project (Pixel 7 viewport). */
const PAGES = ['/', '/analytics', '/sales', '/users', '/reports', '/data', '/settings', '/notifications']

test.describe('responsive layout (mobile)', () => {
  test('no horizontal overflow on main pages', async ({ page }) => {
    await login(page)
    for (const path of PAGES) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, 'horizontal overflow on ' + path).toBeLessThanOrEqual(0)
    }
  })

  test('navigation opens as a drawer', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: '開啟選單' }).click()
    const drawer = page.getByRole('dialog', { name: '選單' })
    await expect(drawer).toBeVisible()
    await drawer.getByRole('link', { name: '銷售管理' }).click()
    await expect(page).toHaveURL(/\/sales/)
    await expect(drawer).toBeHidden()
  })

  test('data table switches to cards', async ({ page }) => {
    await login(page, '/data')
    await expect(page.locator('.data-table__card').first()).toBeVisible()
    await expect(page.locator('.data-table__table')).toBeHidden()
  })
})
