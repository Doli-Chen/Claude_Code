import { socket } from '../socket'

export const socketService = {
  connect(role: 'host' | 'display' | 'player', gameCode: string) {
    socket.auth = { role, gameCode }
    socket.connect()
  },

  disconnect() {
    socket.disconnect()
  },

  // Host
  createGame: (quizId: string) => socket.emit('host:create_game', { quizId }),
  startGame: (gameCode: string) => socket.emit('host:start_game', { gameCode }),
  revealAnswer: (gameCode: string) => socket.emit('host:reveal_answer', { gameCode }),
  showLeaderboard: (gameCode: string) => socket.emit('host:show_leaderboard', { gameCode }),
  nextQuestion: (gameCode: string) => socket.emit('host:next_question', { gameCode }),
  endGame: (gameCode: string) => socket.emit('host:end_game', { gameCode }),

  // Player
  joinGame: (gameCode: string, nickname: string) => socket.emit('player:join', { gameCode, nickname }),
  submitAnswer: (gameCode: string, answerIndex: number) =>
    socket.emit('player:submit_answer', { gameCode, answerIndex, clientTimestamp: Date.now() }),

  // Display
  registerDisplay: (gameCode: string) => socket.emit('display:register', { gameCode }),
}
