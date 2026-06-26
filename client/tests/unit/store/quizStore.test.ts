import { describe, it, expect, beforeEach } from 'vitest'
import { useQuizStore } from '../../../src/store/quizStore'

beforeEach(() => {
  useQuizStore.setState({ quizzes: [], currentQuiz: null, loading: false, error: null })
})

describe('quizStore', () => {
  it('setQuizzes updates the list', () => {
    const quizzes = [{ id: '1', title: 'Test', questionCount: 2, updatedAt: '2026-01-01' }]
    useQuizStore.getState().setQuizzes(quizzes)
    expect(useQuizStore.getState().quizzes).toHaveLength(1)
  })

  it('setLoading updates loading flag', () => {
    useQuizStore.getState().setLoading(true)
    expect(useQuizStore.getState().loading).toBe(true)
  })

  it('setError stores error message', () => {
    useQuizStore.getState().setError('Something went wrong')
    expect(useQuizStore.getState().error).toBe('Something went wrong')
  })

  it('setCurrentQuiz updates currentQuiz', () => {
    const quiz = {
      id: '1', title: 'Q', description: '', defaultTimeLimit: 20,
      createdAt: '', updatedAt: '', questions: []
    }
    useQuizStore.getState().setCurrentQuiz(quiz)
    expect(useQuizStore.getState().currentQuiz?.id).toBe('1')
  })
})
