import { useState } from 'react'

interface Props {
  initialCode?: string
  onJoin: (gameCode: string, nickname: string) => void
  error?: string | null
}

export function JoinForm({ initialCode = '', onJoin, error }: Props) {
  const [gameCode, setGameCode] = useState(initialCode)
  const [nickname, setNickname] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (gameCode.trim() && nickname.trim()) {
      onJoin(gameCode.trim().toUpperCase(), nickname.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-6">
      <h1 className="text-white text-4xl font-bold mb-2">聖經問答</h1>
      <p className="text-white/70 mb-8">輸入遊戲代碼加入</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          placeholder="遊戲代碼"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="w-full px-4 py-4 rounded-xl text-2xl font-mono text-center bg-white text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/50"
          aria-label="遊戲代碼"
        />
        <input
          type="text"
          placeholder="你的暱稱"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="w-full px-4 py-4 rounded-xl text-xl text-center bg-white text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/50"
          aria-label="暱稱"
        />
        {error && (
          <p className="text-red-300 text-center text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={!gameCode.trim() || !nickname.trim()}
          className="w-full py-4 rounded-xl text-xl font-bold bg-white text-indigo-900 disabled:opacity-50 active:scale-95 transition-transform"
        >
          加入遊戲
        </button>
      </form>
    </div>
  )
}
