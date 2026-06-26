import { test, expect } from '@playwright/test'

test.describe('Quiz Design', () => {
  test('can create a new quiz and navigate to design page', async ({ page }) => {
    await page.goto('/')
    await page.fill('[aria-label="新題庫名稱"]', 'E2E Test Bible Quiz')
    await page.click('button:has-text("新增題庫")')
    await expect(page).toHaveURL(/\/design\//)
    await expect(page.locator('h1:has-text("E2E Test Bible Quiz")')).toBeVisible()
  })

  test('can add a question to a quiz', async ({ page }) => {
    await page.goto('/')

    // Create quiz
    await page.fill('[aria-label="新題庫名稱"]', 'Add Question Test')
    await page.click('button:has-text("新增題庫")')
    await expect(page).toHaveURL(/\/design\//)

    // Add question
    await page.click('[aria-label="新增題目"]')
    await expect(page.locator('text=第 1 題')).toBeVisible()

    // Fill question text
    await page.fill('[aria-label="題目文字"]', '耶穌出生在哪裡？')
    // The auto-save fires on change; we just verify the field has our text
    await expect(page.locator('[aria-label="題目文字"]')).toHaveValue('耶穌出生在哪裡？')
  })

  test('can set the correct answer', async ({ page }) => {
    await page.goto('/')
    await page.fill('[aria-label="新題庫名稱"]', 'Correct Answer Test')
    await page.click('button:has-text("新增題庫")')
    await page.click('[aria-label="新增題目"]')

    // Click option B to set as correct
    await page.click('[aria-label="設定選項 B 為正確答案"]')
    await expect(page.locator('[aria-label="設定選項 B 為正確答案"]')).toHaveClass(/bg-green-500/)
  })

  test('can navigate back to home from design page', async ({ page }) => {
    await page.goto('/')
    await page.fill('[aria-label="新題庫名稱"]', 'Nav Test')
    await page.click('button:has-text("新增題庫")')
    await expect(page).toHaveURL(/\/design\//)

    await page.click('text=← 返回')
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1:has-text("聖經問答遊戲")')).toBeVisible()
  })

  test('existing quiz appears in quiz list', async ({ page }) => {
    await page.goto('/')
    await page.fill('[aria-label="新題庫名稱"]', 'List Test Quiz')
    await page.click('button:has-text("新增題庫")')
    await page.click('text=← 返回')
    await expect(page.locator('h3:has-text("List Test Quiz")')).toBeVisible()
  })
})
