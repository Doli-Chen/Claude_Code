import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { quizApi } from '../services/quizApi'
import { socketService } from '../services/socketService'
import { useQuizStore } from '../store/quizStore'
import { socket } from '../socket'
import type { QuizSummary } from '../types/quiz'

export default function HomePage() {
  const navigate = useNavigate()
  const { quizzes, setQuizzes, loading, setLoading } = useQuizStore()
  const [creating, setCreating] = useState(false)
  const [displayCode, setDisplayCode] = useState('')
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    setLoading(true)
    quizApi.list().then(setQuizzes).finally(() => setLoading(false))
  }, [setQuizzes, setLoading])

  async function handleCreateGame(quiz: QuizSummary) {
    socketService.disconnect()
    socket.auth = { role: 'host', gameCode: '' }
    socket.connect()
    socket.once('host:game_created', ({ gameCode }: { gameCode: string }) => {
      socket.disconnect()
      navigate(`/host/${gameCode}`)
    })
    socketService.createGame(quiz.id)
  }

  async function handleCreateQuiz(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const quiz = await quizApi.create({ title: newTitle.trim() })
      navigate(`/design/${quiz.id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">聖經問答遊戲</h1>
      </header>

      <main className="max-w-3xl mx-auto p-6 flex flex-col gap-8">
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-3">建立新題庫</h2>
          <form onSubmit={handleCreateQuiz} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="題庫名稱"
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="新題庫名稱"
            />
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? '建立中...' : '新增題庫'}
            </button>
          </form>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-800">題庫列表</h2>
          </div>
          {loading ? (
            <p className="text-gray-500">載入中...</p>
          ) : quizzes.length === 0 ? (
            <p className="text-gray-500">尚未建立題庫</p>
          ) : (
            <div className="flex flex-col gap-3">
              {quizzes.map((q) => (
                <div key={q.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{q.title}</h3>
                    <p className="text-sm text-gray-500">{q.questionCount} 題</p>
                  </div>
                  <button
                    onClick={() => navigate(`/design/${q.id}`)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleCreateGame(q)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    開始遊戲
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-3">開啟顯示畫面</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayCode}
              onChange={(e) => setDisplayCode(e.target.value.toUpperCase())}
              placeholder="遊戲代碼"
              maxLength={6}
              className="flex-1 border rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="顯示畫面遊戲代碼"
            />
            <button
              onClick={() => displayCode && navigate(`/display/${displayCode}`)}
              disabled={!displayCode.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              開啟顯示
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
