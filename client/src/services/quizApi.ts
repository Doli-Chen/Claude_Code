import type { Quiz, QuizSummary, Question } from '../types/quiz'

const BASE = '/api/quizzes'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status })
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const quizApi = {
  list: () => request<QuizSummary[]>(BASE),

  get: (id: string) => request<Quiz>(`${BASE}/${id}`),

  create: (data: { title: string; description?: string; defaultTimeLimit?: number }) =>
    request<Quiz>(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ title: string; description: string; defaultTimeLimit: number; lobbyImageUrl: string | null }>) =>
    request<Quiz>(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  addQuestion: (quizId: string, q: Omit<Question, 'id'>) =>
    request<Question>(`${BASE}/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    }),

  updateQuestion: (quizId: string, idx: number, q: Partial<Question>) =>
    request<Question>(`${BASE}/${quizId}/questions/${idx}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    }),

  deleteQuestion: (quizId: string, idx: number) =>
    request<void>(`${BASE}/${quizId}/questions/${idx}`, { method: 'DELETE' }),

  reorderQuestions: (quizId: string, fromIndex: number, toIndex: number) =>
    request<Quiz>(`${BASE}/${quizId}/questions/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromIndex, toIndex }),
    }),
}
