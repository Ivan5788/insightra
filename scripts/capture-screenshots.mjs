/**
 * Captures reference screenshots of the running app (used in README and
 * as the visual reference for rebuilding / syncing the Figma file).
 *
 *   npm run build && node .output/server/index.mjs   (PORT=3100)
 *   node scripts/capture-screenshots.mjs
 */
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const OUT = 'design/reference'
mkdirSync(OUT, { recursive: true })

const shots = [
  { name: 'desktop-overview-light', path: '/', width: 1440, height: 900, scheme: 'light' },
  { name: 'desktop-overview-dark', path: '/', width: 1440, height: 900, scheme: 'dark' },
  { name: 'desktop-analytics-light', path: '/analytics', width: 1440, height: 900, scheme: 'light' },
  { name: 'desktop-sales-dark', path: '/sales', width: 1440, height: 900, scheme: 'dark' },
  { name: 'desktop-data-light', path: '/data', width: 1440, height: 900, scheme: 'light' },
  { name: 'desktop-drilldown-light', path: '/', width: 1440, height: 900, scheme: 'light', action: 'drill' },
  { name: 'desktop-edit-mode-light', path: '/', width: 1440, height: 900, scheme: 'light', action: 'edit' },
  { name: 'tablet-overview-light', path: '/', width: 768, height: 1024, scheme: 'light' },
  { name: 'mobile-overview-light', path: '/', width: 375, height: 812, scheme: 'light' },
  { name: 'mobile-data-dark', path: '/data', width: 375, height: 812, scheme: 'dark' },
  { name: 'login-light', path: '/auth/login', width: 1440, height: 900, scheme: 'light', public: true },
]

const browser = await chromium.launch()
for (const s of shots) {
  const context = await browser.newContext({
    viewport: { width: s.width, height: s.height },
    colorScheme: s.scheme,
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  if (!s.public) {
    await page.goto(BASE + '/auth/login')
    await page.getByTestId('login-submit').click()
    await page.waitForURL((u) => !u.pathname.startsWith('/auth'))
  }
  await page.goto(BASE + s.path)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1200)
  if (s.action === 'drill') {
    await page.getByTestId('kpi-revenue-drill').click()
    await page.locator('[role=dialog] tbody tr.is-clickable').last().click()
    await page.waitForTimeout(1200)
  }
  if (s.action === 'edit') {
    await page.getByTestId('edit-dashboard').click()
    await page.waitForTimeout(800)
  }
  await page.screenshot({ path: OUT + '/' + s.name + '.png' })
  console.log('saved', s.name)
  await context.close()
}
await browser.close()
