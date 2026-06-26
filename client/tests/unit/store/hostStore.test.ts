import { describe, it, expect, beforeEach } from 'vitest'
import { useHostStore } from '../../../src/store/hostStore'

beforeEach(() => useHostStore.getState().reset())

describe('hostStore', () => {
  it('initial state is LOBBY with empty values', () => {
    const s = useHostStore.getState()
    expect(s.state).toBe('LOBBY')
    expect(s.gameCode).toBe('')
    expect(s.players).toHaveLength(0)
  })

  it('setGameCreated updates gameCode, quizTitle, totalQuestions', () => {
    useHostStore.getState().setGameCreated('ABC123', 'Bible Quiz', 10)
    const s = useHostStore.getState()
    expect(s.gameCode).toBe('ABC123')
    expect(s.quizTitle).toBe('Bible Quiz')
    expect(s.totalQuestions).toBe(10)
    expect(s.state).toBe('LOBBY')
  })

  it('addPlayer appends to players list', () => {
    useHostStore.getState().addPlayer({ id: 'p1', nickname: 'Alice' })
    useHostStore.getState().addPlayer({ id: 'p2', nickname: 'Bob' })
    expect(useHostStore.getState().players).toHaveLength(2)
  })

  it('removePlayer removes by id', () => {
    useHostStore.getState().addPlayer({ id: 'p1', nickname: 'Alice' })
    useHostStore.getState().addPlayer({ id: 'p2', nickname: 'Bob' })
    useHostStore.getState().removePlayer('p1')
    const players = useHostStore.getState().players
    expect(players).toHaveLength(1)
    expect(players[0].nickname).toBe('Bob')
  })

  it('setState updates game state', () => {
    useHostStore.getState().setState('ANSWERING')
    expect(useHostStore.getState().state).toBe('ANSWERING')
  })

  it('setAnswerProgress updates answeredCount and totalPlayers', () => {
    useHostStore.getState().setAnswerProgress(3, 10)
    const s = useHostStore.getState()
    expect(s.answeredCount).toBe(3)
    expect(s.totalPlayers).toBe(10)
  })

  it('setLeaderboard updates leaderboard', () => {
    const scores = [{ rank: 1, nickname: 'Alice', score: 100 }]
    useHostStore.getState().setLeaderboard(scores)
    expect(useHostStore.getState().leaderboard).toHaveLength(1)
  })

  it('setQuestionIndex updates currentQuestionIndex', () => {
    useHostStore.getState().setQuestionIndex(3)
    expect(useHostStore.getState().currentQuestionIndex).toBe(3)
  })

  it('reset returns to initial state', () => {
    useHostStore.getState().setGameCreated('ABC123', 'Quiz', 5)
    useHostStore.getState().addPlayer({ id: 'p1', nickname: 'Alice' })
    useHostStore.getState().reset()
    expect(useHostStore.getState().gameCode).toBe('')
    expect(useHostStore.getState().players).toHaveLength(0)
  })
})
