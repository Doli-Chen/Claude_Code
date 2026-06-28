const gameService = require('../services/GameService');

module.exports = function registerPlayerHandlers(socket, io) {
  socket.on('player:join', ({ gameCode, nickname }) => {
    const session = gameService.getByCode(gameCode);
    if (!session) return socket.emit('player:join_error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });

    const result = session.addPlayer(socket.id, nickname?.trim());
    if (result.error) return socket.emit('player:join_error', { code: result.error, message: result.error });

    socket.join(`game:${gameCode}`);
    socket.data.gameCode = gameCode;

    socket.emit('player:join_success', {
      playerId: socket.id,
      nickname: result.player.nickname,
      gameCode,
      quizTitle: session.quiz.title,
    });

    const playerCount = session.players.size;
    io.to(`host:${gameCode}`).emit('host:player_joined', {
      player: { id: socket.id, nickname: result.player.nickname },
      playerCount,
    });
    io.to(`display:${gameCode}`).emit('display:player_count', {
      count: playerCount,
      latestNickname: result.player.nickname,
    });
  });

  socket.on('player:submit_answer', ({ gameCode, answerIndex }) => {
    const session = gameService.getByCode(gameCode);
    if (!session) return;

    const result = session.submitAnswer(socket.id, answerIndex);
    if (result.error) return;

    socket.emit('player:answer_accepted', {});

    const answered = session.answeredCount();
    io.to(`host:${gameCode}`).emit('host:answer_progress', {
      answered,
      total: session.players.size,
    });
  });

  socket.on('disconnect', () => {
    const gameCode = socket.data.gameCode;
    if (!gameCode) return;
    const session = gameService.getByCode(gameCode);
    if (!session) return;

    session.removePlayer(socket.id);
    io.to(`host:${gameCode}`).emit('host:player_left', {
      playerId: socket.id,
      playerCount: session.players.size,
    });
  });
};
