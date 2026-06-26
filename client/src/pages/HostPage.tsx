import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { socket } from '../socket'
import { socketService } from '../services/socketService'
import { useHostStore } from '../store/hostStore'

export default function HostPage() {
  const { gameCode } = useParams<{ gameCode: string }>()
  const navigate = useNavigate()
  const store = useHostStore()

  useEffect(() => {
    if (!gameCode) return
    socketService.connect('host', gameCode)
    socket.emit('host:create_game_join', { gameCode })

    socket.on('host:game_created', ({ gameCode: gc, quizTitle, totalQuestions }) => {
      store.setGameCreated(gc, quizTitle, totalQuestions)
    })
    socket.on('host:player_joined', ({ player, playerCount }) => {
      store.addPlayer(player)
      store.setAnswerProgress(0, playerCount)
    })
    socket.on('host:player_left', ({ playerId, playerCount }) => {
      store.removePlayer(playerId)
      store.setAnswerProgress(store.answeredCount, playerCount)
    })
    socket.on('host:answer_progress', ({ answered, total }) => {
      store.setAnswerProgress(answered, total)
    })
    socket.on('host:question_timeout', ({ questionIndex }) => {
      store.setQuestionIndex(questionIndex)
      store.setState('REVEALING_ANSWER')
    })
    socket.on('display:leaderboard', ({ scores }) => {
      store.setLeaderboard(scores)
      store.setState('LEADERBOARD')
    })
    socket.on('display:game_over', ({ scores }) => {
      store.setLeaderboard(scores)
      store.setState('GAME_OVER')
    })
    socket.on('display:question_start', ({ questionIndex }) => {
      store.setQuestionIndex(questionIndex)
      store.setState('QUESTION_INTRO')
      store.setAnswerProgress(0, store.totalPlayers)
    })

    return () => {
      socket.off('host:game_created')
      socket.off('host:player_joined')
      socket.off('host:player_left')
      socket.off('host:answer_progress')
      socket.off('host:question_timeout')
      socket.off('display:leaderboard')
      socket.off('display:game_over')
      socket.off('display:question_start')
      socketService.disconnect()
      store.reset()
    }
  }, [gameCode])

  if (!gameCode) return null

  const { state, quizTitle, players, answeredCount, totalPlayers, currentQuestionIndex, totalQuestions, leaderboard } = store

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-black/30 px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-white/60 hover:text-white text-sm">← 返回</button>
        <h1 className="font-bold">{quizTitle || '主持人控制台'}</h1>
        <span className="ml-auto font-mono text-yellow-300 text-lg">{gameCode}</span>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-xl mx-auto w-full">
        {state === 'LOBBY' && (
          <>
            <div>
              <h2 className="text-xl font-bold mb-3">等待玩家加入 ({players.length})</h2>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <span key={p.id} className="bg-white/10 rounded-full px-3 py-1 text-sm">{p.nickname}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => { socketService.startGame(gameCode); store.setState('QUESTION_INTRO') }}
              disabled={players.length === 0}
              className="w-full py-4 rounded-xl bg-green-500 text-white text-xl font-bold hover:bg-green-600 disabled:opacity-40"
            >
              開始遊戲
            </button>
          </>
        )}

        {(state === 'QUESTION_INTRO' || state === 'ANSWERING') && (
          <>
            <div className="text-center">
              <p className="text-white/60">第 {currentQuestionIndex + 1} / {totalQuestions} 題</p>
              <p className="text-2xl font-bold mt-2">
                {answeredCount} / {totalPlayers} 人已作答
              </p>
            </div>
            <button
              onClick={() => { socketService.revealAnswer(gameCode); store.setState('REVEALING_ANSWER') }}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600"
            >
              強制結束計時
            </button>
          </>
        )}

        {state === 'REVEALING_ANSWER' && (
          <button
            onClick={() => socketService.showLeaderboard(gameCode)}
            className="w-full py-4 rounded-xl bg-blue-500 text-white text-xl font-bold hover:bg-blue-600"
          >
            顯示排行榜
          </button>
        )}

        {state === 'LEADERBOARD' && (
          <>
            <div className="flex flex-col gap-2">
              {leaderboard.map((e) => (
                <div key={e.nickname} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                  <span className="text-yellow-300 font-bold w-6">#{e.rank}</span>
                  <span className="flex-1">{e.nickname}</span>
                  <span className="text-yellow-300 font-bold">{e.score}</span>
                </div>
              ))}
            </div>
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() => socketService.nextQuestion(gameCode)}
                className="w-full py-4 rounded-xl bg-green-500 text-white text-xl font-bold hover:bg-green-600"
              >
                下一題 →
              </button>
            ) : (
              <button
                onClick={() => socketService.nextQuestion(gameCode)}
                className="w-full py-4 rounded-xl bg-yellow-500 text-white text-xl font-bold hover:bg-yellow-600"
              >
                結束遊戲
              </button>
            )}
          </>
        )}

        {state === 'GAME_OVER' && (
          <>
            <h2 className="text-2xl font-bold text-center">🎉 遊戲結束</h2>
            <div className="flex flex-col gap-2">
              {leaderboard.map((e) => (
                <div key={e.nickname} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                  <span className="text-yellow-300 font-bold w-6">#{e.rank}</span>
                  <span className="flex-1">{e.nickname}</span>
                  <span className="text-yellow-300 font-bold">{e.score} 分</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
            >
              回首頁
            </button>
          </>
        )}
      </main>
    </div>
  )
}
