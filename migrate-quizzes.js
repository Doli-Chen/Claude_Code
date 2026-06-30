/**
 * 題庫遷移腳本：將本機題庫上傳到 Railway
 * 用法：node migrate-quizzes.js https://your-app.up.railway.app
 */

const fs = require('fs').promises
const path = require('path')

const TARGET_URL = process.argv[2]
if (!TARGET_URL) {
  console.error('請提供 Railway 網址，例如：\nnode migrate-quizzes.js https://xxxx.up.railway.app')
  process.exit(1)
}

const DATA_DIR = path.join(__dirname, 'server', 'data', 'quizzes')

async function migrateQuiz(quiz) {
  // 建立題庫
  const createRes = await fetch(`${TARGET_URL}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: quiz.title,
      description: quiz.description ?? '',
      defaultTimeLimit: quiz.defaultTimeLimit ?? 20,
    }),
  })
  if (!createRes.ok) throw new Error(`建立題庫失敗：${await createRes.text()}`)
  const { id: newId } = await createRes.json()

  // 若有等待畫面圖片，一併設定（圖片 URL 須已上傳到目標伺服器）
  if (quiz.lobbyImageUrl) {
    await fetch(`${TARGET_URL}/api/quizzes/${newId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lobbyImageUrl: quiz.lobbyImageUrl }),
    })
  }

  // 依序新增題目
  for (const q of quiz.questions ?? []) {
    const addRes = await fetch(`${TARGET_URL}/api/quizzes/${newId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: q.text ?? '',
        imageUrl: q.imageUrl ?? null,
        timeLimit: q.timeLimit ?? quiz.defaultTimeLimit ?? 20,
        options: q.options.map((o) => ({ text: o.text ?? '', imageUrl: o.imageUrl ?? null })),
        correctIndex: q.correctIndex,
      }),
    })
    if (!addRes.ok) throw new Error(`新增題目失敗：${await addRes.text()}`)
  }

  return newId
}

async function main() {
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.json'))
  console.log(`找到 ${files.length} 個題庫，開始上傳到 ${TARGET_URL} ...\n`)

  for (const file of files) {
    const quiz = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8'))
    try {
      const newId = await migrateQuiz(quiz)
      console.log(`✓ 「${quiz.title}」（${quiz.questions?.length ?? 0} 題）→ 新 ID: ${newId}`)
    } catch (err) {
      console.error(`✗ 「${quiz.title}」上傳失敗：${err.message}`)
    }
  }

  console.log('\n完成！請重新整理 Railway 網站確認題庫已出現。')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
