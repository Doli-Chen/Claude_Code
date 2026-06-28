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
  nicknames: string[]
  total: number
  score: number
}

export interface DisplayQuestion {
  text: string
  imageUrl: string | null
  options: Array<{ text: string; imageUrl: string | null }>
}

export interface AnswerResult {
  correct: boolean
  score: number
  totalScore: number
  rank: number
}
