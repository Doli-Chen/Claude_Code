const gameService = require('../services/GameService');
const { STATES } = require('../models/GameSession');

module.exports = function registerDisplayHandlers(socket, io) {
  socket.on('display:register', ({ gameCode }) => {
    const session = gameService.getByCode(gameCode);
    if (!session) return;

    session.displaySocketId = socket.id;
    socket.join(`display:${gameCode}`);

    const { state } = session;

    if (state === STATES.QUESTION_INTRO || state === STATES.ANSWERING || state === STATES.REVEALING_ANSWER) {
      const question = session.quiz.questions[session.currentQuestionIndex];
      socket.emit('display:question_start', {
        questionIndex: session.currentQuestionIndex,
        totalQuestions: session.quiz.questions.length,
        question: { text: question.text, imageUrl: question.imageUrl, options: question.options },
        timeLimit: question.timeLimit,
      });
      if (state === STATES.REVEALING_ANSWER) {
        socket.emit('display:reveal_answer', {
          correctIndex: question.correctIndex,
          counts: session.getAnswerCounts(),
        });
      }
    } else if (state === STATES.LEADERBOARD) {
      socket.emit('display:leaderboard', { scores: session.getLeaderboard(5) });
    } else if (state === STATES.GAME_OVER) {
      socket.emit('display:game_over', { scores: session.getLeaderboard(5) });
    } else {
      socket.emit('display:waiting_room', {
        gameCode,
        quizTitle: session.quiz.title,
        playerCount: session.players.size,
      });
    }
  });
};
