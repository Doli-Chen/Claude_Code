import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { socket } from '../socket'
import { socketService } from '../services/socketService'
import { useDisplayStore } from '../store/displayStore'
import { useNetworkInfo } from '../hooks/useNetworkInfo'
import { WaitingRoom } from '../components/display/WaitingRoom'
import { QuestionSlide } from '../components/display/QuestionSlide'
import { LeaderboardSlide } from '../components/display/LeaderboardSlide'
import { GameOverSlide } from '../components/display/GameOverSlide'

export default function DisplayPage() {
  const { gameCode } = useParams<{ gameCode: string }>()
  const store = useDisplayStore()
  const networkInfo = useNetworkInfo()

  useEffect(() => {
    if (!gameCode) return
    socketService.connect('display', gameCode)

    socket.on('connect', () => socketService.registerDisplay(gameCode))
    socket.on('display:waiting_room', ({ gameCode: gc, quizTitle, playerCount }) => {
      store.setWaitingRoom(gc, quizTitle, playerCount)
    })
    socket.on('display:player_count', ({ count, latestNickname }) => {
      store.setPlayerCount(count, latestNickname)
    })
    socket.on('display:question_start', (data) => {
      store.setQuestion(data)
    })
    socket.on('display:time_update', ({ timeRemaining }) => {
      store.setTimeRemaining(timeRemaining)
    })
    socket.on('display:reveal_answer', ({ correctIndex, counts }) => {
      store.setRevealAnswer(correctIndex, counts)
    })
    socket.on('display:leaderboard', ({ scores }) => {
      store.setLeaderboard(scores)
    })
    socket.on('display:game_over', ({ scores }) => {
      store.setLeaderboard(scores)
      store.setState('GAME_OVER')
    })

    return () => {
      socket.off('connect')
      socket.off('display:waiting_room')
      socket.off('display:player_count')
      socket.off('display:question_start')
      socket.off('display:time_update')
      socket.off('display:reveal_answer')
      socket.off('display:leaderboard')
      socket.off('display:game_over')
      socketService.disconnect()
      store.reset()
    }
  }, [gameCode])

  if (!gameCode) return null

  const { state, quizTitle, playerCount, latestNickname, question, timeRemaining, timeLimit, correctIndex, leaderboard } = store

  const joinPort = import.meta.env.DEV ? 5173 : networkInfo?.port
  const serverUrl = import.meta.env.VITE_SERVER_URL ||
    (networkInfo ? `http://${networkInfo.localIP}:${joinPort}` : window.location.origin)
  const joinUrl = `${serverUrl}/play/${gameCode}`

  if (state === 'LOBBY') {
    return (
      <WaitingRoom
        gameCode={gameCode}
        quizTitle={quizTitle}
        playerCount={playerCount}
        latestNickname={latestNickname}
        joinUrl={joinUrl}
      />
    )
  }

  if ((state === 'QUESTION_INTRO' || state === 'ANSWERING' || state === 'REVEALING_ANSWER') && question) {
    return (
      <QuestionSlide
        question={question}
        questionIndex={store.questionIndex}
        totalQuestions={store.totalQuestions}
        timeRemaining={timeRemaining}
        timeLimit={timeLimit}
        showTimer={state === 'ANSWERING'}
        correctIndex={state === 'REVEALING_ANSWER' ? correctIndex : undefined}
      />
    )
  }

  if (state === 'LEADERBOARD') {
    return <LeaderboardSlide scores={leaderboard} />
  }

  if (state === 'GAME_OVER') {
    return <GameOverSlide scores={leaderboard} />
  }

  return (
    <div className="min-h-screen bg-indigo-900 flex items-center justify-center">
      <p className="text-white text-2xl">遊戲代碼：{gameCode}</p>
    </div>
  )
}
