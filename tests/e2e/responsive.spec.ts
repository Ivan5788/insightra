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

  test('dropdown menus stay inside the viewport on a 320px screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await login(page)
    for (const path of ['/', '/data']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const triggers = page.locator('.app-shell__content .dropdown > [aria-haspopup="true"]:visible')
      const count = await triggers.count()
      expect(count, 'dropdowns on ' + path).toBeGreaterThan(0)
      for (let i = 0; i < count; i++) {
        await triggers.nth(i).click()
        const menu = page.locator('.dropdown__menu')
        await expect(menu).toBeVisible()
        const box = await menu.boundingBox()
        const label = (await menu.getAttribute('aria-label')) ?? String(i)
        expect(box!.x, label + ' left edge').toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width, label + ' right edge').toBeLessThanOrEqual(320)
        await triggers.nth(i).click() // tap the trigger again to close
        await expect(menu).toBeHidden()
      }
    }
  })

  test('back-to-top button appears after scrolling and returns to the top', async ({ page }) => {
    await login(page)
    const button = page.getByTestId('back-to-top')
    await expect(button).toBeHidden()
    // Widgets load asynchronously, so retry until the page is tall enough to scroll.
    await expect(async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await expect(button).toBeVisible({ timeout: 1000 })
    }).toPass()
    await button.click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(button).toBeHidden()
  })
})
