import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PlayerPage from '../../../src/pages/PlayerPage'
import { usePlayerStore } from '../../../src/store/playerStore'

// vi.hoisted runs before imports, making the object available in vi.mock factories
const mockSocket = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void
  const handlers: Record<string, Handler[]> = {}
  return {
    _handlers: handlers,
    on(event: string, cb: Handler) {
      handlers[event] = [...(handlers[event] ?? []), cb]
    },
    off(event: string) {
      delete handlers[event]
    },
    emit(event: string, ...args: unknown[]) {
      handlers[event]?.forEach((cb) => cb(...args))
    },
  }
})

vi.mock('../../../src/socket', () => ({ socket: mockSocket }))

vi.mock('../../../src/services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinGame: vi.fn(),
    submitAnswer: vi.fn(),
  },
}))

beforeEach(() => {
  usePlayerStore.getState().reset()
  const h = mockSocket._handlers
  Object.keys(h).forEach((k) => delete h[k])
})

function renderPlayerPage(code?: string) {
  const path = code ? `/play/${code}` : '/play'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/play/:gameCode" element={<PlayerPage />} />
        <Route path="/play" element={<PlayerPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PlayerPage', () => {
  it('shows JoinForm initially', () => {
    renderPlayerPage()
    expect(screen.getByLabelText('遊戲代碼')).toBeInTheDocument()
    expect(screen.getByLabelText('暱稱')).toBeInTheDocument()
  })

  it('pre-fills game code from URL parameter', () => {
    renderPlayerPage('XYZ123')
    expect(screen.getByLabelText('遊戲代碼')).toHaveValue('XYZ123')
  })

  it('shows error message on player:join_error GAME_NOT_FOUND', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_error', { code: 'GAME_NOT_FOUND' })
    await waitFor(() => expect(screen.getByText('找不到此遊戲')).toBeInTheDocument())
  })

  it('shows error for NICKNAME_TAKEN', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_error', { code: 'NICKNAME_TAKEN' })
    await waitFor(() => expect(screen.getByText('暱稱已被使用')).toBeInTheDocument())
  })

  it('shows WaitingLobby after join success', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_success', { gameCode: 'ABC123', nickname: 'Alice', quizTitle: 'Bible Quiz' })
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('shows AnswerPad immediately when question_ready received', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_success', { gameCode: 'ABC123', nickname: 'Alice', quizTitle: 'Quiz' })
    mockSocket.emit('player:question_ready', { questionIndex: 0, totalQuestions: 5, timeLimit: 20 })
    await waitFor(() => expect(screen.getByLabelText('選項 A')).toBeInTheDocument())
  })

  it('shows waiting state after answer submitted', async () => {
    const user = userEvent.setup()
    renderPlayerPage()
    mockSocket.emit('player:join_success', { gameCode: 'ABC123', nickname: 'Alice', quizTitle: 'Quiz' })
    mockSocket.emit('player:question_ready', { questionIndex: 0, totalQuestions: 5, timeLimit: 20 })
    await waitFor(() => screen.getByLabelText('選項 A'))
    await user.click(screen.getByLabelText('選項 A'))
    await waitFor(() => expect(screen.getByText('等待結果...')).toBeInTheDocument())
  })

  it('shows AnswerFeedback after player:answer_result', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_success', { gameCode: 'ABC123', nickname: 'Alice', quizTitle: 'Quiz' })
    mockSocket.emit('player:question_ready', { questionIndex: 0, totalQuestions: 5, timeLimit: 20 })
    mockSocket.emit('player:answer_result', { correct: true, score: 15, totalScore: 15, rank: 1 })
    await waitFor(() => expect(screen.getByText('答對了！')).toBeInTheDocument())
  })

  it('shows RankView after player:leaderboard', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_success', { gameCode: 'ABC123', nickname: 'Alice', quizTitle: 'Quiz' })
    mockSocket.emit('player:leaderboard', { myRank: 1, myScore: 15, top5: [{ rank: 1, nicknames: ['Alice'], total: 1, score: 15 }] })
    await waitFor(() => expect(screen.getByText('第 1 名')).toBeInTheDocument())
  })

  it('shows FinalResult after player:game_over', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_success', { gameCode: 'ABC123', nickname: 'Alice', quizTitle: 'Quiz' })
    mockSocket.emit('player:game_over', { finalRank: 1, finalScore: 50, top5: [{ rank: 1, nicknames: ['Alice'], total: 1, score: 50 }] })
    await waitFor(() => expect(screen.getByText('遊戲結束！')).toBeInTheDocument())
  })

  it('resets to JoinForm on player:kicked', async () => {
    renderPlayerPage()
    mockSocket.emit('player:join_success', { gameCode: 'ABC123', nickname: 'Alice', quizTitle: 'Quiz' })
    await waitFor(() => screen.getByText('Alice'))
    mockSocket.emit('player:kicked', {})
    await waitFor(() => expect(screen.getByText('你已被主持人移除')).toBeInTheDocument())
  })
})
