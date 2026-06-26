import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DisplayPage from '../../../src/pages/DisplayPage'
import { useDisplayStore } from '../../../src/store/displayStore'

vi.mock('../../../src/components/shared/QRCodeDisplay', () => ({
  QRCodeDisplay: ({ url }: { url: string }) => <div data-testid="qr-url">{url}</div>,
}))

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
vi.mock('../../../src/services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    registerDisplay: vi.fn(),
  },
}))

beforeEach(() => {
  useDisplayStore.getState().reset()
  const h = mockSocket._handlers
  Object.keys(h).forEach((k) => delete h[k])
  vi.clearAllMocks()
})

function renderDisplayPage(code = 'ABC123') {
  return render(
    <MemoryRouter initialEntries={[`/display/${code}`]}>
      <Routes>
        <Route path="/display/:gameCode" element={<DisplayPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DisplayPage', () => {
  it('shows WaitingRoom in LOBBY state', () => {
    useDisplayStore.setState({ state: 'LOBBY', quizTitle: 'Bible Quiz', playerCount: 3, latestNickname: '', gameCode: 'ABC123' } as never)
    renderDisplayPage()
    expect(screen.getByText('Bible Quiz')).toBeInTheDocument()
  })

  it('shows QuestionSlide in QUESTION_INTRO state', () => {
    useDisplayStore.setState({
      state: 'QUESTION_INTRO',
      question: { text: 'Who wrote Romans?', imageUrl: null, options: [
        { text: 'Peter' }, { text: 'Paul' },
        { text: 'John' }, { text: 'James' },
      ]},
      questionIndex: 0, totalQuestions: 5, timeRemaining: 20, timeLimit: 20, correctIndex: -1,
    } as never)
    renderDisplayPage()
    expect(screen.getByText('Who wrote Romans?')).toBeInTheDocument()
  })

  it('shows LeaderboardSlide in LEADERBOARD state', () => {
    useDisplayStore.setState({
      state: 'LEADERBOARD',
      leaderboard: [{ rank: 1, nickname: 'Alice', score: 100 }],
    } as never)
    renderDisplayPage()
    expect(screen.getByText('排行榜')).toBeInTheDocument()
  })

  it('shows GameOverSlide in GAME_OVER state', () => {
    useDisplayStore.setState({
      state: 'GAME_OVER',
      leaderboard: [{ rank: 1, nickname: 'Alice', score: 100 }],
    } as never)
    renderDisplayPage()
    expect(screen.getByText(/遊戲結束！/)).toBeInTheDocument()
  })

  it('shows game code when no other state matches', () => {
    // After reset, state is LOBBY, but if we force a state with no question
    useDisplayStore.setState({ state: 'ANSWERING', question: null } as never)
    renderDisplayPage()
    expect(screen.getByText(/遊戲代碼：ABC123/)).toBeInTheDocument()
  })

  it('handles display:waiting_room socket event', async () => {
    renderDisplayPage()
    mockSocket.emit_event('display:waiting_room', { gameCode: 'ABC123', quizTitle: 'My Quiz', playerCount: 2 })
    await waitFor(() => expect(screen.getByText('My Quiz')).toBeInTheDocument())
  })

  it('handles display:player_count socket event', async () => {
    useDisplayStore.setState({ state: 'LOBBY', quizTitle: 'Quiz', playerCount: 0, latestNickname: '', gameCode: 'ABC123' } as never)
    renderDisplayPage()
    mockSocket.emit_event('display:player_count', { count: 5, latestNickname: 'Bob' })
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument())
  })

  it('builds joinUrl with Vite dev port 5173, not the server port 3001', async () => {
    useDisplayStore.setState({ state: 'LOBBY', quizTitle: 'Quiz', playerCount: 0, latestNickname: '', gameCode: 'ABC123' } as never)
    renderDisplayPage('ABC123')
    // MSW returns { localIP: '192.168.1.1', port: 3001 } from /api/network
    // In dev mode (import.meta.env.DEV === true), joinPort must be 5173 so players
    // reach the Vite dev server, not the bare Express server which lacks SPA routing
    await waitFor(() =>
      expect(screen.getByTestId('qr-url')).toHaveTextContent('192.168.1.1:5173')
    )
  })
})
