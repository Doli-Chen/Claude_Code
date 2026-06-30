import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../../../src/store/playerStore'

beforeEach(() => usePlayerStore.getState().reset())

describe('playerStore', () => {
  it('starts in JOIN state', () => {
    expect(usePlayerStore.getState().state).toBe('JOIN')
  })

  it('setJoined transitions to WAITING', () => {
    usePlayerStore.getState().setJoined('GAME1', 'Alice', 'Bible Quiz', null)
    const s = usePlayerStore.getState()
    expect(s.state).toBe('WAITING')
    expect(s.nickname).toBe('Alice')
    expect(s.gameCode).toBe('GAME1')
  })

  it('setJoined stores lobbyImageUrl', () => {
    usePlayerStore.getState().setJoined('GAME1', 'Alice', 'Bible Quiz', '/uploads/cross.png')
    expect(usePlayerStore.getState().lobbyImageUrl).toBe('/uploads/cross.png')
  })

  it('setJoined stores null lobbyImageUrl when not provided', () => {
    usePlayerStore.getState().setJoined('GAME1', 'Alice', 'Bible Quiz', null)
    expect(usePlayerStore.getState().lobbyImageUrl).toBeNull()
  })

  it('setQuestionReady transitions to ANSWERING (immediate)', () => {
    const question = {
      text: 'Test?',
      imageUrl: null,
      options: [
        { text: 'A', imageUrl: null },
        { text: 'B', imageUrl: null },
        { text: 'C', imageUrl: null },
        { text: 'D', imageUrl: null },
      ],
    }
    usePlayerStore.getState().setQuestionReady(0, 5, 20, question)
    const s = usePlayerStore.getState()
    expect(s.state).toBe('ANSWERING')
    expect(s.questionIndex).toBe(0)
    expect(s.totalQuestions).toBe(5)
    expect(s.timeLimit).toBe(20)
    expect(s.currentQuestion).toEqual(question)
  })

  it('setAnswerResult stores result and transitions to RESULT', () => {
    usePlayerStore.getState().setAnswerResult({ correct: true, score: 15, totalScore: 15, rank: 1 })
    const s = usePlayerStore.getState()
    expect(s.state).toBe('RESULT')
    expect(s.lastResult?.correct).toBe(true)
    expect(s.lastResult?.score).toBe(15)
  })

  it('setLeaderboard stores top5 and transitions to LEADERBOARD', () => {
    const top5 = [{ rank: 1, nicknames: ['Alice'], total: 1, score: 50 }]
    usePlayerStore.getState().setLeaderboard(1, 50, top5)
    const s = usePlayerStore.getState()
    expect(s.state).toBe('LEADERBOARD')
    expect(s.myRank).toBe(1)
    expect(s.top5).toHaveLength(1)
  })

  it('reset returns to initial state', () => {
    usePlayerStore.getState().setJoined('GAME1', 'Alice', 'Quiz', null)
    usePlayerStore.getState().reset()
    expect(usePlayerStore.getState().state).toBe('JOIN')
    expect(usePlayerStore.getState().nickname).toBe('')
  })
})
