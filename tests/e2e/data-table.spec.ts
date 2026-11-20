import { expect, test } from '@playwright/test'
import { login } from './helpers'

test.describe('data table', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, '/data')
  })

  test('searches by order id', async ({ page }) => {
    const firstId = (await page.locator('tbody tr').first().locator('td').nth(1).textContent())!.trim()
    await page.getByLabel('搜尋訂單').fill(firstId)
    await expect(page).toHaveURL(new RegExp('search=' + firstId))
    await expect(page.locator('tbody tr')).toHaveCount(1)
    await expect(page.locator('.pagination__summary')).toHaveText(/顯示第\s*1–1\s*筆，共\s*1\s*筆/)
  })

  test('sorts by amount and paginates', async ({ page }) => {
    await page.getByRole('button', { name: '金額' }).click()
    await expect(page).toHaveURL(/sort=total/)
    await page.getByTestId('page-next').click()
    await expect(page).toHaveURL(/page=2/)
  })

  test('selects rows and shows batch actions', async ({ page }) => {
    await expect(page.locator('tbody tr').first()).toBeVisible()
    await page.getByTestId('select-all').check()
    await expect(page.getByTestId('selected-count')).toHaveText('已選取 20 筆')
    await page.getByRole('button', { name: '標記待審查' }).click()
    await expect(page.getByTestId('selected-count')).toHaveCount(0)
  })

  test('exports CSV', async ({ page }) => {
    const download = page.waitForEvent('download')
    await page.getByTestId('export-csv').click()
    expect((await download).suggestedFilename()).toMatch(/^orders-\d{4}-\d{2}-\d{2}\.csv$/)
  })
})
