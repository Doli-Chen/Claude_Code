const gameService = require('../services/GameService');
const quizService = require('../services/QuizService');
const { STATES } = require('../models/GameSession');

module.exports = function registerHostHandlers(socket, io) {
  socket.on('host:create_game_join', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session) return socket.emit('host:error', { message: 'Game not found' });

    session.hostSocketId = socket.id;
    socket.join(`host:${gameCode}`);
    socket.join(`game:${gameCode}`);

    socket.emit('host:game_created', {
      gameCode: session.gameCode,
      quizTitle: session.quiz.title,
      totalQuestions: session.quiz.questions.length,
    });

    for (const [socketId, player] of session.players) {
      socket.emit('host:player_joined', {
        player: { id: socketId, nickname: player.nickname },
        playerCount: session.players.size,
      });
    }
  });

  socket.on('host:create_game', async ({ quizId }) => {
    try {
      const quiz = await quizService.getQuiz(quizId);
      const session = gameService.createSession(quiz, socket.id);
      socket.join(`host:${session.gameCode}`);
      socket.join(`game:${session.gameCode}`);
      socket.emit('host:game_created', {
        gameCode: session.gameCode,
        quizTitle: quiz.title,
        totalQuestions: quiz.questions.length,
      });
    } catch (err) {
      socket.emit('host:error', { message: err.message });
    }
  });

  socket.on('host:start_game', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session || session.hostSocketId !== socket.id) return socket.emit('host:error', { message: 'Unauthorized' });
    if (session.state !== STATES.LOBBY) return socket.emit('host:error', { message: 'Game already started' });
    gameService.startQuestion(session, io);
  });

  socket.on('host:reveal_answer', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.state !== STATES.ANSWERING) return;
    session.clearTimer();
    gameService.revealAnswer(session, io);
  });

  socket.on('host:show_leaderboard', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.state !== STATES.REVEALING_ANSWER) return;
    gameService.showLeaderboard(session, io);
  });

  socket.on('host:next_question', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session || session.hostSocketId !== socket.id) return;
    if (session.state !== STATES.LEADERBOARD) return;
    gameService.nextQuestion(session, io);
  });

  socket.on('host:end_game', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session || session.hostSocketId !== socket.id) return;
    gameService.endGame(session, io);
  });
};
