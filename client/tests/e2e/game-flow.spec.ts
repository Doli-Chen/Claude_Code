import { test, expect, type Page } from '@playwright/test'

async function createQuizWithQuestion(page: Page): Promise<string> {
  await page.goto('/')
  await page.fill('[aria-label="新題庫名稱"]', 'E2E Game Flow Quiz')
  await page.click('button:has-text("新增題庫")')
  await expect(page).toHaveURL(/\/design\//)

  // Add a question
  await page.click('[aria-label="新增題目"]')
  await page.fill('[aria-label="題目文字"]', '施洗約翰的父親是誰？')
  await page.fill('[aria-label="選項 A 文字"]', '以利亞')
  await page.fill('[aria-label="選項 B 文字"]', '撒迦利亞')
  await page.fill('[aria-label="選項 C 文字"]', '亞伯拉罕')
  await page.fill('[aria-label="選項 D 文字"]', '大衛')
  await page.click('[aria-label="設定選項 B 為正確答案"]')

  // Get quiz ID from URL
  const url = page.url()
  const quizId = url.split('/design/')[1]
  return quizId
}

test.describe('Game Flow', () => {
  test.setTimeout(60000)

  test('host can create a game session from quiz list', async ({ page }) => {
    await createQuizWithQuestion(page)

    // Go back to home
    await page.click('text=← 返回')
    await expect(page).toHaveURL('/')

    // Click "開始遊戲" for our quiz
    await page.click('button:has-text("開始遊戲"):near(h3:has-text("E2E Game Flow Quiz"))')
    await expect(page).toHaveURL(/\/host\//)
    await expect(page.locator('text=等待玩家加入')).toBeVisible()
  })

  test('display page shows QR code lobby screen', async ({ page, browser }) => {
    // Create quiz and start game
    const hostPage = await browser.newPage()
    await createQuizWithQuestion(hostPage)
    await hostPage.click('text=← 返回')
    await hostPage.click('button:has-text("開始遊戲"):near(h3:has-text("E2E Game Flow Quiz"))')
    await expect(hostPage).toHaveURL(/\/host\/([A-Z0-9]+)/)

    const gameCode = hostPage.url().split('/host/')[1]

    // Open display page
    await page.goto(`/display/${gameCode}`)
    await expect(page.locator('text=E2E Game Flow Quiz')).toBeVisible({ timeout: 10000 })

    await hostPage.close()
  })

  test('player can join a game', async ({ page, browser }) => {
    const hostPage = await browser.newPage()
    await createQuizWithQuestion(hostPage)
    await hostPage.click('text=← 返回')
    await hostPage.click('button:has-text("開始遊戲"):near(h3:has-text("E2E Game Flow Quiz"))')
    await expect(hostPage).toHaveURL(/\/host\/([A-Z0-9]+)/)
    const gameCode = hostPage.url().split('/host/')[1]

    // Player joins
    await page.goto(`/play/${gameCode}`)
    await page.fill('[aria-label="暱稱"]', 'E2EPlayer')
    await page.click('button:has-text("加入遊戲")')
    await expect(page.locator('text=E2EPlayer')).toBeVisible({ timeout: 5000 })

    // Host should see player count update
    await expect(hostPage.locator('text=等待玩家加入 (1)')).toBeVisible({ timeout: 5000 })

    await hostPage.close()
  })

  test('host can start the game and player sees question', async ({ page, browser }) => {
    const hostPage = await browser.newPage()
    await createQuizWithQuestion(hostPage)
    await hostPage.click('text=← 返回')
    await hostPage.click('button:has-text("開始遊戲"):near(h3:has-text("E2E Game Flow Quiz"))')
    await expect(hostPage).toHaveURL(/\/host\/([A-Z0-9]+)/)
    const gameCode = hostPage.url().split('/host/')[1]

    // Player joins
    await page.goto(`/play/${gameCode}`)
    await page.fill('[aria-label="暱稱"]', 'GamePlayer')
    await page.click('button:has-text("加入遊戲")')
    await expect(page.locator('text=GamePlayer')).toBeVisible({ timeout: 5000 })

    // Host starts game
    await hostPage.click('button:has-text("開始遊戲")')

    // Player sees question ready
    await expect(page.getByText(/第 1 題準備中/)).toBeVisible({ timeout: 8000 })

    // Player can answer
    await expect(page.locator('[aria-label="選項 A"]')).toBeVisible({ timeout: 5000 })

    await hostPage.close()
  })
})
