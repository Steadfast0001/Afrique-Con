# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.js >> admin can login and see dashboard
- Location: tests\login.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - heading "Afr ique Con" [level=1] [ref=e5]
  - paragraph [ref=e6]: Global Authentication Service
  - generic [ref=e7]: Admin Email
  - textbox [ref=e8]: admin@example.com
  - generic [ref=e9]: Password
  - textbox [ref=e10]: secret123
  - generic [ref=e12]:
    - checkbox "Remember my device" [checked] [ref=e13]
    - text: Remember my device
  - button "Authenticate" [active] [ref=e14]
  - generic [ref=e15]: Failed to fetch
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test')
  2  | 
  3  | test('admin can login and see dashboard', async ({ page, baseURL }) => {
  4  |   const frontendUrl = (baseURL || 'http://127.0.0.1:5173')
  5  |   await page.goto(`${frontendUrl}/login`)
  6  |   await expect(page.locator('text=Authenticate')).toBeVisible()
  7  |   await page.fill('input[type="email"]', 'admin@example.com')
  8  |   await page.fill('input[type="password"]', 'secret123')
  9  |   await page.check('input[type="checkbox"]')
  10 |   await page.click('button:has-text("Authenticate")')
  11 | 
> 12 |   await page.waitForURL('**/')
     |              ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  13 |   await expect(page.locator('text=Admin Dashboard')).toBeVisible()
  14 |   await expect(page.locator('text=Assigned branch')).toBeVisible()
  15 | })
  16 | 
```