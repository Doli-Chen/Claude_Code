import { create } from 'zustand'
import type { PlayerState, AnswerResult, ScoreEntry, DisplayQuestion } from '../types/game'

interface PlayerStore {
  state: PlayerState
  gameCode: string
  nickname: string
  quizTitle: string
  lobbyImageUrl: string | null
  questionIndex: number
  totalQuestions: number
  timeLimit: number
  currentQuestion: DisplayQuestion | null
  lastResult: AnswerResult | null
  myRank: number
  myScore: number
  top5: ScoreEntry[]
  setState: (s: PlayerState) => void
  setJoined: (gameCode: string, nickname: string, quizTitle: string, lobbyImageUrl: string | null) => void
  setQuestionReady: (questionIndex: number, totalQuestions: number, timeLimit: number, question: DisplayQuestion) => void
  setAnswerResult: (result: AnswerResult) => void
  setLeaderboard: (myRank: number, myScore: number, top5: ScoreEntry[]) => void
  reset: () => void
}

const initial = {
  state: 'JOIN' as PlayerState,
  gameCode: '',
  nickname: '',
  quizTitle: '',
  lobbyImageUrl: null as string | null,
  questionIndex: 0,
  totalQuestions: 0,
  timeLimit: 20,
  currentQuestion: null as DisplayQuestion | null,
  lastResult: null as AnswerResult | null,
  myRank: 0,
  myScore: 0,
  top5: [] as ScoreEntry[],
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...initial,
  setState: (state) => set({ state }),
  setJoined: (gameCode, nickname, quizTitle, lobbyImageUrl) =>
    set({ gameCode, nickname, quizTitle, lobbyImageUrl, state: 'WAITING' }),
  setQuestionReady: (questionIndex, totalQuestions, timeLimit, question) =>
    set({ questionIndex, totalQuestions, timeLimit, currentQuestion: question, state: 'ANSWERING' }),
  setAnswerResult: (result) => set({ lastResult: result, state: 'RESULT' }),
  setLeaderboard: (myRank, myScore, top5) => set({ myRank, myScore, top5, state: 'LEADERBOARD' }),
  reset: () => set(initial),
}))
