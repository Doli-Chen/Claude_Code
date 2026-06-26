import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../../../src/store/playerStore'

beforeEach(() => usePlayerStore.getState().reset())

describe('playerStore', () => {
  it('starts in JOIN state', () => {
    expect(usePlayerStore.getState().state).toBe('JOIN')
  })

  it('setJoined transitions to WAITING', () => {
    usePlayerStore.getState().setJoined('GAME1', 'Alice', 'Bible Quiz')
    const s = usePlayerStore.getState()
    expect(s.state).toBe('WAITING')
    expect(s.nickname).toBe('Alice')
    expect(s.gameCode).toBe('GAME1')
  })

  it('setQuestionReady transitions to QUESTION_READY', () => {
    usePlayerStore.getState().setQuestionReady(0, 5, 20)
    const s = usePlayerStore.getState()
    expect(s.state).toBe('QUESTION_READY')
    expect(s.questionIndex).toBe(0)
    expect(s.totalQuestions).toBe(5)
    expect(s.timeLimit).toBe(20)
  })

  it('setAnswerResult stores result and transitions to RESULT', () => {
    usePlayerStore.getState().setAnswerResult({ correct: true, score: 15, totalScore: 15, rank: 1 })
    const s = usePlayerStore.getState()
    expect(s.state).toBe('RESULT')
    expect(s.lastResult?.correct).toBe(true)
    expect(s.lastResult?.score).toBe(15)
  })

  it('setLeaderboard stores top5 and transitions to LEADERBOARD', () => {
    const top5 = [{ rank: 1, nickname: 'Alice', score: 50 }]
    usePlayerStore.getState().setLeaderboard(1, 50, top5)
    const s = usePlayerStore.getState()
    expect(s.state).toBe('LEADERBOARD')
    expect(s.myRank).toBe(1)
    expect(s.top5).toHaveLength(1)
  })

  it('reset returns to initial state', () => {
    usePlayerStore.getState().setJoined('GAME1', 'Alice', 'Quiz')
    usePlayerStore.getState().reset()
    expect(usePlayerStore.getState().state).toBe('JOIN')
    expect(usePlayerStore.getState().nickname).toBe('')
  })
})
