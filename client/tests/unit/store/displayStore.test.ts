import { describe, it, expect, beforeEach } from 'vitest'
import { useDisplayStore } from '../../../src/store/displayStore'

beforeEach(() => useDisplayStore.getState().reset())

describe('displayStore', () => {
  it('starts in LOBBY state', () => {
    expect(useDisplayStore.getState().state).toBe('LOBBY')
  })

  it('setWaitingRoom sets gameCode, quizTitle, playerCount and LOBBY state', () => {
    useDisplayStore.getState().setWaitingRoom('ABC123', 'Bible Quiz', 5)
    const s = useDisplayStore.getState()
    expect(s.state).toBe('LOBBY')
    expect(s.gameCode).toBe('ABC123')
    expect(s.quizTitle).toBe('Bible Quiz')
    expect(s.playerCount).toBe(5)
  })

  it('setPlayerCount updates count and latestNickname', () => {
    useDisplayStore.getState().setPlayerCount(3, 'Alice')
    const s = useDisplayStore.getState()
    expect(s.playerCount).toBe(3)
    expect(s.latestNickname).toBe('Alice')
  })

  it('setQuestion transitions to QUESTION_INTRO', () => {
    const question = {
      text: 'Test?',
      imageUrl: null,
      options: [{ index: 0, text: 'A' }, { index: 1, text: 'B' }, { index: 2, text: 'C' }, { index: 3, text: 'D' }],
    }
    useDisplayStore.getState().setQuestion({ questionIndex: 0, totalQuestions: 5, question, timeLimit: 20 })
    const s = useDisplayStore.getState()
    expect(s.state).toBe('QUESTION_INTRO')
    expect(s.timeRemaining).toBe(20)
    expect(s.timeLimit).toBe(20)
    expect(s.correctIndex).toBe(-1)
    expect(s.answerCounts).toEqual([0, 0, 0, 0])
  })

  it('setTimeRemaining transitions to ANSWERING', () => {
    useDisplayStore.getState().setTimeRemaining(15)
    const s = useDisplayStore.getState()
    expect(s.state).toBe('ANSWERING')
    expect(s.timeRemaining).toBe(15)
  })

  it('setRevealAnswer transitions to REVEALING_ANSWER', () => {
    useDisplayStore.getState().setRevealAnswer(2, [10, 5, 20, 3])
    const s = useDisplayStore.getState()
    expect(s.state).toBe('REVEALING_ANSWER')
    expect(s.correctIndex).toBe(2)
    expect(s.answerCounts).toEqual([10, 5, 20, 3])
  })

  it('setLeaderboard transitions to LEADERBOARD', () => {
    const scores = [{ rank: 1, nickname: 'Alice', score: 50 }]
    useDisplayStore.getState().setLeaderboard(scores)
    const s = useDisplayStore.getState()
    expect(s.state).toBe('LEADERBOARD')
    expect(s.leaderboard).toHaveLength(1)
  })

  it('setState directly updates state', () => {
    useDisplayStore.getState().setState('GAME_OVER')
    expect(useDisplayStore.getState().state).toBe('GAME_OVER')
  })

  it('reset returns to initial state', () => {
    useDisplayStore.getState().setWaitingRoom('ABC123', 'Quiz', 5)
    useDisplayStore.getState().reset()
    expect(useDisplayStore.getState().gameCode).toBe('')
    expect(useDisplayStore.getState().playerCount).toBe(0)
  })
})
