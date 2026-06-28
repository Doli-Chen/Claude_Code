import { describe, it, expect } from 'vitest'
import { quizApi } from '../../../src/services/quizApi'

describe('quizApi', () => {
  it('list returns quiz summaries', async () => {
    const result = await quizApi.list()
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].title).toBe('Test Quiz')
  })

  it('get returns a full quiz', async () => {
    const result = await quizApi.get('quiz-1')
    expect(result.id).toBe('quiz-1')
    expect(result.questions).toBeDefined()
  })

  it('create returns new quiz', async () => {
    const result = await quizApi.create({ title: 'New Quiz' })
    expect(result.title).toBe('New Quiz')
    expect(result.id).toBe('new-quiz')
  })

  it('update returns updated quiz', async () => {
    const result = await quizApi.update('quiz-1', { title: 'Updated Title' })
    expect(result.title).toBe('Updated Title')
  })

  it('delete resolves without error', async () => {
    await expect(quizApi.delete('quiz-1')).resolves.not.toThrow()
  })

  it('addQuestion returns the new question', async () => {
    const q = {
      text: 'New Q', imageUrl: null, timeLimit: 20, correctIndex: 0,
      options: [
        { index: 0, text: 'A', imageUrl: null },
        { index: 1, text: 'B', imageUrl: null },
        { index: 2, text: 'C', imageUrl: null },
        { index: 3, text: 'D', imageUrl: null },
      ],
    }
    const result = await quizApi.addQuestion('quiz-1', q)
    expect(result.id).toBeDefined()
  })

  it('updateQuestion returns updated question', async () => {
    const result = await quizApi.updateQuestion('quiz-1', 0, { text: 'Updated?' })
    expect(result.text).toBe('Updated?')
  })

  it('deleteQuestion resolves without error', async () => {
    await expect(quizApi.deleteQuestion('quiz-1', 0)).resolves.not.toThrow()
  })

  it('reorderQuestions returns updated quiz', async () => {
    const result = await quizApi.reorderQuestions('quiz-1', 0, 1)
    expect(result.id).toBe('quiz-1')
  })
})
