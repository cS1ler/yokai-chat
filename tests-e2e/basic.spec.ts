import { test, expect } from '@playwright/test'

test('loads landing page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Yokai/i)
})


