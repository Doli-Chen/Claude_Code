/**
 * 圖片遷移腳本：上傳本機圖片到 Railway 並更新題庫連結
 * 用法：node migrate-images.js https://your-app.up.railway.app
 */

const fs = require('fs').promises
const path = require('path')

const TARGET_URL = process.argv[2]
if (!TARGET_URL) {
  console.error('請提供 Railway 網址，例如：\nnode migrate-images.js https://xxxx.up.railway.app')
  process.exit(1)
}

const UPLOADS_DIR = path.join(__dirname, 'server', 'uploads')

function getMime(filename) {
  const ext = path.extname(filename).toLowerCase()
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' }
  return map[ext] || 'image/jpeg'
}

async function uploadImage(filename) {
  const buffer = await fs.readFile(path.join(UPLOADS_DIR, filename))
  const blob = new Blob([buffer], { type: getMime(filename) })
  const form = new FormData()
  form.append('image', blob, filename)
  const res = await fetch(`${TARGET_URL}/api/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  const { url } = await res.json()
  return url
}

async function main() {
  // 1. 上傳所有圖片，建立 舊URL → 新URL 對應表
  const files = (await fs.readdir(UPLOADS_DIR)).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
  console.log(`找到 ${files.length} 張圖片，開始上傳...\n`)

  const urlMap = {}
  for (const file of files) {
    const oldUrl = `/uploads/${file}`
    try {
      const newUrl = await uploadImage(file)
      urlMap[oldUrl] = newUrl
      console.log(`✓ ${file}`)
    } catch (err) {
      console.error(`✗ ${file} 上傳失敗：${err.message}`)
    }
  }

  // 2. 取得 Railway 上的所有題庫
  const summaries = await fetch(`${TARGET_URL}/api/quizzes`).then(r => r.json())
  console.log(`\n找到 ${summaries.length} 個題庫，開始更新圖片連結...\n`)

  for (const summary of summaries) {
    const quiz = await fetch(`${TARGET_URL}/api/quizzes/${summary.id}`).then(r => r.json())

    // 更新題庫等待畫面圖片
    const newLobbyImageUrl = quiz.lobbyImageUrl ? (urlMap[quiz.lobbyImageUrl] ?? quiz.lobbyImageUrl) : null
    if (newLobbyImageUrl !== quiz.lobbyImageUrl) {
      const res = await fetch(`${TARGET_URL}/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lobbyImageUrl: newLobbyImageUrl }),
      })
      if (res.ok) console.log(`✓ 更新「${quiz.title}」等待畫面圖片`)
      else console.error(`✗ 更新「${quiz.title}」等待畫面圖片失敗`)
    }

    // 更新各題目的圖片連結
    for (let idx = 0; idx < quiz.questions.length; idx++) {
      const q = quiz.questions[idx]
      const newImageUrl = q.imageUrl ? (urlMap[q.imageUrl] ?? q.imageUrl) : null
      const newOptions = q.options.map(o => ({
        text: o.text,
        imageUrl: o.imageUrl ? (urlMap[o.imageUrl] ?? o.imageUrl) : null,
      }))

      const changed =
        newImageUrl !== q.imageUrl ||
        newOptions.some((o, i) => o.imageUrl !== q.options[i].imageUrl)

      if (changed) {
        const res = await fetch(`${TARGET_URL}/api/quizzes/${quiz.id}/questions/${idx}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: q.text,
            imageUrl: newImageUrl,
            timeLimit: q.timeLimit,
            correctIndex: q.correctIndex,
            options: newOptions,
          }),
        })
        if (res.ok) console.log(`✓ 更新「${quiz.title}」第 ${idx + 1} 題的圖片連結`)
        else console.error(`✗ 更新「${quiz.title}」第 ${idx + 1} 題失敗`)
      }
    }
  }

  console.log('\n完成！請重新整理 Railway 網站確認圖片已正確顯示。')
}

main().catch(err => { console.error(err); process.exit(1) })
