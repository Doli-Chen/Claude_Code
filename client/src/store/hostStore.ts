import { create } from 'zustand'
import type { GameState, ScoreEntry } from '../types/game'

interface Player { id: string; nickname: string }

interface HostStore {
  gameCode: string
  quizTitle: string
  totalQuestions: number
  state: GameState
  currentQuestionIndex: number
  players: Player[]
  answeredCount: number
  totalPlayers: number
  leaderboard: ScoreEntry[]
  setGameCreated: (gameCode: string, quizTitle: string, totalQuestions: number) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  setState: (state: GameState) => void
  setQuestionIndex: (idx: number) => void
  setAnswerProgress: (answered: number, total: number) => void
  setLeaderboard: (scores: ScoreEntry[]) => void
  reset: () => void
}

const initial = {
  gameCode: '',
  quizTitle: '',
  totalQuestions: 0,
  state: 'LOBBY' as GameState,
  currentQuestionIndex: -1,
  players: [] as Player[],
  answeredCount: 0,
  totalPlayers: 0,
  leaderboard: [] as ScoreEntry[],
}

export const useHostStore = create<HostStore>((set) => ({
  ...initial,
  setGameCreated: (gameCode, quizTitle, totalQuestions) =>
    set({ gameCode, quizTitle, totalQuestions, state: 'LOBBY' }),
  addPlayer: (player) => set((s) => ({ players: [...s.players, player] })),
  removePlayer: (playerId) => set((s) => ({ players: s.players.filter((p) => p.id !== playerId) })),
  setState: (state) => set({ state }),
  setQuestionIndex: (idx) => set({ currentQuestionIndex: idx }),
  setAnswerProgress: (answered, total) => set({ answeredCount: answered, totalPlayers: total }),
  setLeaderboard: (scores) => set({ leaderboard: scores }),
  reset: () => set(initial),
}))
