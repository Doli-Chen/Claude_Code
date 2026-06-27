import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HostPage from '../../../src/pages/HostPage'
import { useHostStore } from '../../../src/store/hostStore'

const mockSocket = vi.hoisted(() => {
  type Handler = (...args: unknown[]) => void
  const handlers: Record<string, Handler[]> = {}
  return {
    _handlers: handlers,
    on(event: string, cb: Handler) { handlers[event] = [...(handlers[event] ?? []), cb] },
    off(event: string) { delete handlers[event] },
    emit: vi.fn(),
    emit_event(event: string, ...args: unknown[]) {
      handlers[event]?.forEach((cb) => cb(...args))
    },
  }
})

vi.mock('../../../src/socket', () => ({ socket: mockSocket }))

const mockSocketService = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  startGame: vi.fn(),
  revealAnswer: vi.fn(),
  showLeaderboard: vi.fn(),
  nextQuestion: vi.fn(),
}))

vi.mock('../../../src/services/socketService', () => ({ socketService: mockSocketService }))

beforeEach(() => {
  useHostStore.getState().reset()
  const h = mockSocket._handlers
  Object.keys(h).forEach((k) => delete h[k])
  vi.clearAllMocks()
})

function renderHostPage(code = 'ABC123') {
  return render(
    <MemoryRouter initialEntries={[`/host/${code}`]}>
      <Routes>
        <Route path="/host/:gameCode" element={<HostPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('HostPage', () => {
  it('renders the game code in header', () => {
    renderHostPage('XYZ789')
    expect(screen.getByText('XYZ789')).toBeInTheDocument()
  })

  it('shows LOBBY controls with player list', () => {
    useHostStore.setState({ state: 'LOBBY', players: [{ id: 'p1', nickname: 'Alice' }], quizTitle: 'Quiz' } as never)
    renderHostPage()
    expect(screen.getByText('等待玩家加入 (1)')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('start game button is disabled with no players', () => {
    useHostStore.setState({ state: 'LOBBY', players: [] } as never)
    renderHostPage()
    expect(screen.getByRole('button', { name: '開始遊戲' })).toBeDisabled()
  })

  it('start game button is enabled with players', () => {
    useHostStore.setState({ state: 'LOBBY', players: [{ id: 'p1', nickname: 'Alice' }] } as never)
    renderHostPage()
    expect(screen.getByRole('button', { name: '開始遊戲' })).not.toBeDisabled()
  })

  it('clicking start game calls socketService.startGame', async () => {
    const user = userEvent.setup()
    useHostStore.setState({ state: 'LOBBY', players: [{ id: 'p1', nickname: 'Alice' }] } as never)
    renderHostPage()
    await user.click(screen.getByRole('button', { name: '開始遊戲' }))
    expect(mockSocketService.startGame).toHaveBeenCalledWith('ABC123')
  })

  it('shows answer progress in QUESTION_INTRO state', () => {
    useHostStore.setState({ state: 'QUESTION_INTRO', currentQuestionIndex: 0, totalQuestions: 5, answeredCount: 0, totalPlayers: 5 } as never)
    renderHostPage()
    expect(screen.getByText('0 / 5 人已作答')).toBeInTheDocument()
  })

  it('transitions to ANSWERING on player:answering_start event', async () => {
    useHostStore.setState({ state: 'QUESTION_INTRO', currentQuestionIndex: 0, totalQuestions: 5, answeredCount: 0, totalPlayers: 3 } as never)
    renderHostPage()
    mockSocket.emit_event('player:answering_start', {})
    await waitFor(() => expect(screen.getByRole('button', { name: '強制結束計時' })).toBeInTheDocument())
  })

  it('shows 強制結束計時 button in ANSWERING state when not all answered', () => {
    useHostStore.setState({ state: 'ANSWERING', currentQuestionIndex: 0, totalQuestions: 5, answeredCount: 0, totalPlayers: 3 } as never)
    renderHostPage()
    expect(screen.getByRole('button', { name: '強制結束計時' })).toBeInTheDocument()
  })

  it('shows early reveal button when all players have answered', () => {
    useHostStore.setState({ state: 'ANSWERING', currentQuestionIndex: 0, totalQuestions: 5, answeredCount: 3, totalPlayers: 3 } as never)
    renderHostPage()
    expect(screen.getByRole('button', { name: '所有玩家已作答，提早公佈答案' })).toBeInTheDocument()
    expect(screen.getByText('所有玩家已完成作答！')).toBeInTheDocument()
  })

  it('shows leaderboard button in REVEALING_ANSWER state', () => {
    useHostStore.setState({ state: 'REVEALING_ANSWER' } as never)
    renderHostPage()
    expect(screen.getByRole('button', { name: '顯示排行榜' })).toBeInTheDocument()
  })

  it('shows next question button in LEADERBOARD state (not last question)', () => {
    useHostStore.setState({ state: 'LEADERBOARD', currentQuestionIndex: 1, totalQuestions: 5, leaderboard: [] } as never)
    renderHostPage()
    expect(screen.getByRole('button', { name: '下一題 →' })).toBeInTheDocument()
  })

  it('shows end game button in LEADERBOARD when on last question', () => {
    useHostStore.setState({ state: 'LEADERBOARD', currentQuestionIndex: 4, totalQuestions: 5, leaderboard: [] } as never)
    renderHostPage()
    expect(screen.getByRole('button', { name: '結束遊戲' })).toBeInTheDocument()
  })

  it('shows game over view in GAME_OVER state', () => {
    useHostStore.setState({ state: 'GAME_OVER', leaderboard: [{ rank: 1, nicknames: ['Alice'], total: 1, score: 100 }] } as never)
    renderHostPage()
    expect(screen.getByText('🎉 遊戲結束')).toBeInTheDocument()
  })

  it('navigates home when back button clicked', async () => {
    const user = userEvent.setup()
    renderHostPage()
    await user.click(screen.getByText('← 返回'))
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument())
  })

  it('handles host:player_joined socket event', async () => {
    useHostStore.setState({ state: 'LOBBY', players: [] } as never)
    renderHostPage()
    mockSocket.emit_event('host:player_joined', { player: { id: 'p1', nickname: 'Alice' }, playerCount: 1 })
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })

  it('handles host:player_left socket event', async () => {
    useHostStore.setState({ state: 'LOBBY', players: [{ id: 'p1', nickname: 'Alice' }, { id: 'p2', nickname: 'Bob' }] } as never)
    renderHostPage()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    mockSocket.emit_event('host:player_left', { playerId: 'p1', playerCount: 1 })
    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument())
  })

  it('handles host:answer_progress socket event', async () => {
    useHostStore.setState({ state: 'ANSWERING', currentQuestionIndex: 0, totalQuestions: 5, answeredCount: 0, totalPlayers: 5 } as never)
    renderHostPage()
    mockSocket.emit_event('host:answer_progress', { answered: 3, total: 5 })
    await waitFor(() => expect(screen.getByText('3 / 5 人已作答')).toBeInTheDocument())
  })

  it('handles host:question_timeout socket event', async () => {
    useHostStore.setState({ state: 'ANSWERING', currentQuestionIndex: 0, totalQuestions: 5, answeredCount: 0, totalPlayers: 3 } as never)
    renderHostPage()
    mockSocket.emit_event('host:question_timeout', { questionIndex: 0 })
    await waitFor(() => expect(screen.getByRole('button', { name: '顯示排行榜' })).toBeInTheDocument())
  })

  it('clicking 顯示排行榜 calls socketService.showLeaderboard', async () => {
    const user = userEvent.setup()
    useHostStore.setState({ state: 'REVEALING_ANSWER' } as never)
    renderHostPage()
    await user.click(screen.getByRole('button', { name: '顯示排行榜' }))
    expect(mockSocketService.showLeaderboard).toHaveBeenCalledWith('ABC123')
  })

  it('clicking 下一題 calls socketService.nextQuestion', async () => {
    const user = userEvent.setup()
    useHostStore.setState({ state: 'LEADERBOARD', currentQuestionIndex: 1, totalQuestions: 5, leaderboard: [] } as never)
    renderHostPage()
    await user.click(screen.getByRole('button', { name: '下一題 →' }))
    expect(mockSocketService.nextQuestion).toHaveBeenCalledWith('ABC123')
  })

  it('handles display:leaderboard socket event', async () => {
    useHostStore.setState({ state: 'REVEALING_ANSWER' } as never)
    renderHostPage()
    mockSocket.emit_event('display:leaderboard', { scores: [{ rank: 1, nicknames: ['Alice'], total: 1, score: 100 }] })
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
  })
})
