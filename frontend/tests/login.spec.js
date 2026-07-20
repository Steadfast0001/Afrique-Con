const { test, expect } = require('@playwright/test')

test('admin can login and see dashboard', async ({ page, baseURL }) => {
  const frontendUrl = (baseURL || 'http://127.0.0.1:5173')
  await page.goto(`${frontendUrl}/login`)
  await expect(page.locator('text=Authenticate')).toBeVisible()
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'secret123')
  await page.check('input[type="checkbox"]')
  await page.click('button:has-text("Authenticate")')

  await page.waitForURL('**/')
  await expect(page.locator('text=Admin Dashboard')).toBeVisible()
  await expect(page.locator('text=Assigned branch')).toBeVisible()
})
