import type { Quiz, Question } from '../../src/types/quiz'

export function makeQuiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    id: 'quiz-1',
    title: 'Test Quiz',
    description: '',
    defaultTimeLimit: 20,
    lobbyImageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    questions: [],
    ...overrides,
  }
}

export function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-1',
    text: 'Who wrote Romans?',
    imageUrl: null,
    timeLimit: 20,
    options: [
      { index: 0, text: 'Peter', imageUrl: null },
      { index: 1, text: 'Paul', imageUrl: null },
      { index: 2, text: 'John', imageUrl: null },
      { index: 3, text: 'James', imageUrl: null },
    ],
    correctIndex: 1,
    ...overrides,
  }
}
