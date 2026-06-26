import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSocket = vi.hoisted(() => ({
  auth: {} as Record<string, unknown>,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
}))

vi.mock('../../../src/socket', () => ({ socket: mockSocket }))

// Re-import after mock is set up
const { socketService } = await import('../../../src/services/socketService')

beforeEach(() => {
  vi.clearAllMocks()
  mockSocket.auth = {}
})

describe('socketService', () => {
  it('connect sets auth and calls socket.connect', () => {
    socketService.connect('host', 'ABC123')
    expect(mockSocket.auth).toEqual({ role: 'host', gameCode: 'ABC123' })
    expect(mockSocket.connect).toHaveBeenCalled()
  })

  it('disconnect calls socket.disconnect', () => {
    socketService.disconnect()
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('createGame emits host:create_game', () => {
    socketService.createGame('quiz-1')
    expect(mockSocket.emit).toHaveBeenCalledWith('host:create_game', { quizId: 'quiz-1' })
  })

  it('startGame emits host:start_game', () => {
    socketService.startGame('ABC123')
    expect(mockSocket.emit).toHaveBeenCalledWith('host:start_game', { gameCode: 'ABC123' })
  })

  it('revealAnswer emits host:reveal_answer', () => {
    socketService.revealAnswer('ABC123')
    expect(mockSocket.emit).toHaveBeenCalledWith('host:reveal_answer', { gameCode: 'ABC123' })
  })

  it('showLeaderboard emits host:show_leaderboard', () => {
    socketService.showLeaderboard('ABC123')
    expect(mockSocket.emit).toHaveBeenCalledWith('host:show_leaderboard', { gameCode: 'ABC123' })
  })

  it('nextQuestion emits host:next_question', () => {
    socketService.nextQuestion('ABC123')
    expect(mockSocket.emit).toHaveBeenCalledWith('host:next_question', { gameCode: 'ABC123' })
  })

  it('endGame emits host:end_game', () => {
    socketService.endGame('ABC123')
    expect(mockSocket.emit).toHaveBeenCalledWith('host:end_game', { gameCode: 'ABC123' })
  })

  it('joinGame emits player:join', () => {
    socketService.joinGame('ABC123', 'Alice')
    expect(mockSocket.emit).toHaveBeenCalledWith('player:join', { gameCode: 'ABC123', nickname: 'Alice' })
  })

  it('submitAnswer emits player:submit_answer with timestamp', () => {
    socketService.submitAnswer('ABC123', 2)
    expect(mockSocket.emit).toHaveBeenCalledWith('player:submit_answer', expect.objectContaining({
      gameCode: 'ABC123',
      answerIndex: 2,
      clientTimestamp: expect.any(Number),
    }))
  })

  it('registerDisplay emits display:register', () => {
    socketService.registerDisplay('ABC123')
    expect(mockSocket.emit).toHaveBeenCalledWith('display:register', { gameCode: 'ABC123' })
  })
})
