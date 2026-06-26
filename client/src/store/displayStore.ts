import { create } from 'zustand'
import type { GameState, ScoreEntry, DisplayQuestion } from '../types/game'

interface DisplayStore {
  state: GameState
  gameCode: string
  quizTitle: string
  playerCount: number
  latestNickname: string
  questionIndex: number
  totalQuestions: number
  question: DisplayQuestion | null
  timeRemaining: number
  timeLimit: number
  correctIndex: number
  answerCounts: number[]
  leaderboard: ScoreEntry[]
  setState: (s: GameState) => void
  setWaitingRoom: (gameCode: string, quizTitle: string, playerCount: number) => void
  setPlayerCount: (count: number, latestNickname: string) => void
  setQuestion: (data: { questionIndex: number; totalQuestions: number; question: DisplayQuestion; timeLimit: number }) => void
  setTimeRemaining: (t: number) => void
  setRevealAnswer: (correctIndex: number, counts: number[]) => void
  setLeaderboard: (scores: ScoreEntry[]) => void
  reset: () => void
}

const initial = {
  state: 'LOBBY' as GameState,
  gameCode: '',
  quizTitle: '',
  playerCount: 0,
  latestNickname: '',
  questionIndex: 0,
  totalQuestions: 0,
  question: null as DisplayQuestion | null,
  timeRemaining: 0,
  timeLimit: 20,
  correctIndex: -1,
  answerCounts: [0, 0, 0, 0],
  leaderboard: [] as ScoreEntry[],
}

export const useDisplayStore = create<DisplayStore>((set) => ({
  ...initial,
  setState: (state) => set({ state }),
  setWaitingRoom: (gameCode, quizTitle, playerCount) =>
    set({ gameCode, quizTitle, playerCount, state: 'LOBBY' }),
  setPlayerCount: (count, latestNickname) => set({ playerCount: count, latestNickname }),
  setQuestion: ({ questionIndex, totalQuestions, question, timeLimit }) =>
    set({ questionIndex, totalQuestions, question, timeLimit, timeRemaining: timeLimit, state: 'QUESTION_INTRO', correctIndex: -1, answerCounts: [0, 0, 0, 0] }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining, state: 'ANSWERING' }),
  setRevealAnswer: (correctIndex, answerCounts) =>
    set({ correctIndex, answerCounts, state: 'REVEALING_ANSWER' }),
  setLeaderboard: (leaderboard) => set({ leaderboard, state: 'LEADERBOARD' }),
  reset: () => set(initial),
}))
