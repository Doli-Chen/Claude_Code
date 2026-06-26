export interface QuizOption {
  index: number
  text: string
}

export interface Question {
  id: string
  text: string
  imageUrl: string | null
  timeLimit: number
  options: QuizOption[]
  correctIndex: number
}

export interface Quiz {
  id: string
  title: string
  description: string
  defaultTimeLimit: number
  createdAt: string
  updatedAt: string
  questions: Question[]
}

export interface QuizSummary {
  id: string
  title: string
  questionCount: number
  updatedAt: string
}

export const VALID_TIME_LIMITS = [5, 10, 15, 20, 30, 45, 60] as const
