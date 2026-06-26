import { test, expect } from '@playwright/test'

test.describe('Player Join', () => {
  test('shows join form at /play', async ({ page }) => {
    await page.goto('/play')
    await expect(page.locator('[aria-label="遊戲代碼"]')).toBeVisible()
    await expect(page.locator('[aria-label="暱稱"]')).toBeVisible()
    await expect(page.locator('button:has-text("加入遊戲")')).toBeDisabled()
  })

  test('join button enables when both fields filled', async ({ page }) => {
    await page.goto('/play')
    await page.fill('[aria-label="遊戲代碼"]', 'ABC123')
    await page.fill('[aria-label="暱稱"]', 'Alice')
    await expect(page.locator('button:has-text("加入遊戲")')).toBeEnabled()
  })

  test('pre-fills game code from URL', async ({ page }) => {
    await page.goto('/play/XYZ789')
    await expect(page.locator('[aria-label="遊戲代碼"]')).toHaveValue('XYZ789')
  })

  test('shows error when joining non-existent game', async ({ page }) => {
    await page.goto('/play')
    await page.fill('[aria-label="遊戲代碼"]', 'ZZZZZ9')
    await page.fill('[aria-label="暱稱"]', 'TestPlayer')
    await page.click('button:has-text("加入遊戲")')
    await expect(page.locator('text=找不到此遊戲')).toBeVisible({ timeout: 5000 })
  })

  test('game code is uppercased automatically', async ({ page }) => {
    await page.goto('/play')
    await page.fill('[aria-label="遊戲代碼"]', 'abc123')
    await expect(page.locator('[aria-label="遊戲代碼"]')).toHaveValue('ABC123')
  })
})
