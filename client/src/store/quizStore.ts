import { create } from 'zustand'
import type { Quiz, QuizSummary } from '../types/quiz'

interface QuizStore {
  quizzes: QuizSummary[]
  currentQuiz: Quiz | null
  loading: boolean
  error: string | null
  setQuizzes: (quizzes: QuizSummary[]) => void
  setCurrentQuiz: (quiz: Quiz | null) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
}

export const useQuizStore = create<QuizStore>((set) => ({
  quizzes: [],
  currentQuiz: null,
  loading: false,
  error: null,
  setQuizzes: (quizzes) => set({ quizzes }),
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
