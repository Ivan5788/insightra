import { expect, type Page } from '@playwright/test'

/** Sign in through the real login form (demo credentials are pre-filled). */
export async function login(page: Page, path = '/'): Promise<void> {
  await page.goto('/auth/login')
  await page.getByTestId('login-submit').click()
  await expect(page).not.toHaveURL(/\/auth\//)
  if (path !== '/') await page.goto(path)
}

/** First KPI value text (Total Revenue). */
export async function revenueKpi(page: Page): Promise<string> {
  const value = page.getByTestId('stat-value').first()
  await expect(value).toBeVisible()
  return (await value.textContent())?.trim() ?? ''
}
