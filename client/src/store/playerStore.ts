import { create } from 'zustand'
import type { PlayerState, AnswerResult, ScoreEntry } from '../types/game'

interface PlayerStore {
  state: PlayerState
  gameCode: string
  nickname: string
  quizTitle: string
  questionIndex: number
  totalQuestions: number
  timeLimit: number
  lastResult: AnswerResult | null
  myRank: number
  myScore: number
  top5: ScoreEntry[]
  setState: (s: PlayerState) => void
  setJoined: (gameCode: string, nickname: string, quizTitle: string) => void
  setQuestionReady: (questionIndex: number, totalQuestions: number, timeLimit: number) => void
  setAnswerResult: (result: AnswerResult) => void
  setLeaderboard: (myRank: number, myScore: number, top5: ScoreEntry[]) => void
  reset: () => void
}

const initial = {
  state: 'JOIN' as PlayerState,
  gameCode: '',
  nickname: '',
  quizTitle: '',
  questionIndex: 0,
  totalQuestions: 0,
  timeLimit: 20,
  lastResult: null as AnswerResult | null,
  myRank: 0,
  myScore: 0,
  top5: [] as ScoreEntry[],
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initial,
  setState: (state) => set({ state }),
  setJoined: (gameCode, nickname, quizTitle) =>
    set({ gameCode, nickname, quizTitle, state: 'WAITING' }),
  setQuestionReady: (questionIndex, totalQuestions, timeLimit) =>
    set({ questionIndex, totalQuestions, timeLimit, state: 'ANSWERING' }),
  setAnswerResult: (result) => set({ lastResult: result, state: 'RESULT' }),
  setLeaderboard: (myRank, myScore, top5) => set({ myRank, myScore, top5, state: 'LEADERBOARD' }),
  reset: () => set(initial),
}))
