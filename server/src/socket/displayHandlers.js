const gameService = require('../services/GameService');
const { STATES } = require('../models/GameSession');

module.exports = function registerDisplayHandlers(socket, io) {
  socket.on('display:register', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session) return;

    session.displaySocketId = socket.id;
    socket.join(`display:${gameCode}`);

    socket.emit('display:waiting_room', {
      gameCode,
      quizTitle: session.quiz.title,
      playerCount: session.players.size,
    });
  });
};
