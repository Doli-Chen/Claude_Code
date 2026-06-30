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
      lobbyImageUrl: session.quiz.lobbyImageUrl ?? null,
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

  socket.on('player:rejoin', ({ gameCode, nickname }) => {
    const session = gameService.getByCode(gameCode);
    if (!session) return socket.emit('player:join_error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });

    const result = session.reconnectPlayer(socket.id, nickname?.trim());
    if (result.error) return socket.emit('player:join_error', { code: result.error, message: result.error });

    // Cancel the pending removal timer from the disconnect grace period
    if (session.pendingRemovals.has(result.oldSocketId)) {
      clearTimeout(session.pendingRemovals.get(result.oldSocketId));
      session.pendingRemovals.delete(result.oldSocketId);
    }

    socket.join(`game:${gameCode}`);
    socket.data.gameCode = gameCode;

    socket.emit('player:join_success', {
      playerId: socket.id,
      nickname: result.player.nickname,
      gameCode,
      quizTitle: session.quiz.title,
      lobbyImageUrl: session.quiz.lobbyImageUrl ?? null,
    });

    // Catch up to current game state
    const { state, quiz, currentQuestionIndex } = session;
    if (state === 'QUESTION_INTRO' || state === 'ANSWERING' || state === 'REVEALING_ANSWER') {
      const q = quiz.questions[currentQuestionIndex];
      socket.emit('player:question_ready', {
        questionIndex: currentQuestionIndex,
        totalQuestions: quiz.questions.length,
        timeLimit: q.timeLimit,
        question: {
          text: q.text,
          imageUrl: q.imageUrl ?? null,
          options: q.options.map((o) => ({ text: o.text, imageUrl: o.imageUrl ?? null })),
        },
      });
    } else if (state === 'LEADERBOARD') {
      const top5 = session.getLeaderboard(5);
      const myRank = session.getPlayerRank(socket.id);
      const myScore = session.players.get(socket.id)?.score ?? 0;
      socket.emit('player:leaderboard', { myRank, myScore, top5 });
    } else if (state === 'GAME_OVER') {
      const top5 = session.getLeaderboard(5);
      const myRank = session.getPlayerRank(socket.id);
      const myScore = session.players.get(socket.id)?.score ?? 0;
      socket.emit('player:game_over', { finalRank: myRank, finalScore: myScore, top5 });
    }
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

    // Grace period before removing the player, to allow reconnection (configurable for tests)
    const gracePeriod = parseInt(process.env.DISCONNECT_GRACE_PERIOD_MS ?? '30000', 10);
    const timeoutId = setTimeout(() => {
      if (session.players.has(socket.id)) {
        session.removePlayer(socket.id);
        session.pendingRemovals.delete(socket.id);
        io.to(`host:${gameCode}`).emit('host:player_left', {
          playerId: socket.id,
          playerCount: session.players.size,
        });
      }
    }, gracePeriod);
    timeoutId.unref(); // allow process to exit cleanly even if timer is pending
    session.pendingRemovals.set(socket.id, timeoutId);
  });
};
