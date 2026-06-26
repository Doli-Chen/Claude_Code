import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { socket } from '../socket'
import { socketService } from '../services/socketService'
import { usePlayerStore } from '../store/playerStore'
import { JoinForm } from '../components/player/JoinForm'
import { WaitingLobby } from '../components/player/WaitingLobby'
import { AnswerPad } from '../components/player/AnswerPad'
import { AnswerFeedback } from '../components/player/AnswerFeedback'
import { RankView } from '../components/player/RankView'
import { FinalResult } from '../components/player/FinalResult'

export default function PlayerPage() {
  const { gameCode: codeFromUrl } = useParams<{ gameCode?: string }>()
  const store = usePlayerStore()
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => {
    socket.on('player:join_success', ({ gameCode, nickname, quizTitle }) => {
      setJoinError(null)
      store.setJoined(gameCode, nickname, quizTitle)
    })
    socket.on('player:join_error', ({ code }) => {
      const messages: Record<string, string> = {
        GAME_NOT_FOUND: '找不到此遊戲',
        NICKNAME_TAKEN: '暱稱已被使用',
        GAME_STARTED: '遊戲已開始',
        FULL: '遊戲已滿',
      }
      setJoinError(messages[code] ?? '加入失敗')
    })
    socket.on('player:question_ready', ({ questionIndex, totalQuestions, timeLimit }) => {
      store.setQuestionReady(questionIndex, totalQuestions, timeLimit)
    })
    socket.on('player:answering_start', () => {
      store.setState('ANSWERING')
    })
    socket.on('player:answer_result', (result) => {
      store.setAnswerResult(result)
    })
    socket.on('player:leaderboard', ({ myRank, myScore, top5 }) => {
      store.setLeaderboard(myRank, myScore, top5)
    })
    socket.on('player:game_over', ({ finalRank, finalScore, top5 }) => {
      store.setLeaderboard(finalRank, finalScore, top5)
      store.setState('GAME_OVER')
    })
    socket.on('player:kicked', () => {
      store.reset()
      setJoinError('你已被主持人移除')
    })

    return () => {
      socket.off('player:join_success')
      socket.off('player:join_error')
      socket.off('player:question_ready')
      socket.off('player:answering_start')
      socket.off('player:answer_result')
      socket.off('player:leaderboard')
      socket.off('player:game_over')
      socket.off('player:kicked')
      socketService.disconnect()
      store.reset()
    }
  }, [])

  function handleJoin(gameCode: string, nickname: string) {
    socketService.connect('player', gameCode)
    socketService.joinGame(gameCode, nickname)
  }

  function handleAnswer(answerIndex: number) {
    socketService.submitAnswer(store.gameCode, answerIndex)
    store.setState('ANSWERED')
  }

  const { state, nickname, quizTitle, questionIndex, totalQuestions, lastResult, myRank, myScore, top5 } = store

  if (state === 'JOIN') {
    return <JoinForm initialCode={codeFromUrl} onJoin={handleJoin} error={joinError} />
  }
  if (state === 'WAITING') {
    return <WaitingLobby nickname={nickname} quizTitle={quizTitle} />
  }
  if (state === 'QUESTION_READY') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl animate-pulse">第 {questionIndex + 1} 題準備中...</p>
      </div>
    )
  }
  if (state === 'ANSWERING') {
    return <AnswerPad questionIndex={questionIndex} totalQuestions={totalQuestions} onAnswer={handleAnswer} />
  }
  if (state === 'ANSWERED') {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <p className="text-white text-xl animate-pulse">等待結果...</p>
      </div>
    )
  }
  if (state === 'RESULT' && lastResult) {
    return <AnswerFeedback result={lastResult} />
  }
  if (state === 'LEADERBOARD') {
    return <RankView myRank={myRank} myScore={myScore} top5={top5} />
  }
  if (state === 'GAME_OVER') {
    return <FinalResult finalRank={myRank} finalScore={myScore} top5={top5} />
  }

  return null
}
