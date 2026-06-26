export type GameState =
  | 'LOBBY'
  | 'QUESTION_INTRO'
  | 'ANSWERING'
  | 'REVEALING_ANSWER'
  | 'LEADERBOARD'
  | 'GAME_OVER'

export type PlayerState =
  | 'JOIN'
  | 'WAITING'
  | 'QUESTION_READY'
  | 'ANSWERING'
  | 'ANSWERED'
  | 'RESULT'
  | 'LEADERBOARD'
  | 'GAME_OVER'

export interface ScoreEntry {
  rank: number
  nickname: string
  score: number
  delta?: number
}

export interface DisplayQuestion {
  text: string
  imageUrl: string | null
  options: Array<{ text: string }>
}

export interface AnswerResult {
  correct: boolean
  score: number
  totalScore: number
  rank: number
}
