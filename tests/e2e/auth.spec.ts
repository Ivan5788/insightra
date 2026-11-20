import { expect, test } from '@playwright/test'

test.describe('authentication (mock)', () => {
  test('redirects to login when not signed in', async ({ page }) => {
    await page.goto('/sales')
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/)
  })

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByLabel('密碼', { exact: true }).fill('wrong-password')
    await page.getByTestId('login-submit').click()
    await expect(page.getByRole('alert')).toContainText('Email 或密碼錯誤')
  })

  test('signs in and returns to the requested page', async ({ page }) => {
    await page.goto('/sales')
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(/\/sales/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('銷售管理')
  })

  test('shows the 404 page for unknown routes', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByTestId('login-submit').click()
    await expect(page).not.toHaveURL(/\/auth\//)
    await page.goto('/does-not-exist')
    await expect(page.getByText('找不到頁面')).toBeVisible()
  })
})
