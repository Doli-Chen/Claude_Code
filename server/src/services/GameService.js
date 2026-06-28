const { v4: uuidv4 } = require('uuid');
const { GameSession, STATES } = require('../models/GameSession');
const { generateGameCode } = require('../utils/gameCode');

const sessions = new Map();
const codeToId = new Map();

function createSession(quiz, hostSocketId) {
  const gameId = uuidv4();
  const gameCode = generateGameCode(new Set(codeToId.keys()));
  const session = new GameSession({ gameId, gameCode, quiz, hostSocketId });
  sessions.set(gameId, session);
  codeToId.set(gameCode, gameId);
  return session;
}

function getByCode(gameCode) {
  const id = codeToId.get(gameCode);
  return id ? sessions.get(id) : null;
}

function getById(gameId) {
  return sessions.get(gameId) ?? null;
}

function startQuestion(session, io) {
  session.transition(STATES.QUESTION_INTRO);
  session.currentQuestionIndex++;
  session.resetAnswerFlags();

  const question = session.quiz.questions[session.currentQuestionIndex];
  const timeLimit = question.timeLimit;
  session.questionStartTime = Date.now();

  const questionStartPayload = {
    questionIndex: session.currentQuestionIndex,
    totalQuestions: session.quiz.questions.length,
    question: {
      text: question.text,
      imageUrl: question.imageUrl,
      options: question.options,
    },
    timeLimit,
  };
  io.to(`display:${session.gameCode}`).emit('display:question_start', questionStartPayload);
  io.to(`host:${session.gameCode}`).emit('display:question_start', questionStartPayload);

  io.to(`game:${session.gameCode}`).emit('player:question_ready', {
    questionIndex: session.currentQuestionIndex,
    totalQuestions: session.quiz.questions.length,
    timeLimit,
    question: {
      text: question.text,
      imageUrl: question.imageUrl,
      options: question.options,
    },
  });

  beginAnswering(session, io);
}

function beginAnswering(session, io) {
  if (session.state !== STATES.QUESTION_INTRO) return;
  session.transition(STATES.ANSWERING);
  const question = session.quiz.questions[session.currentQuestionIndex];
  session.questionEndTime = Date.now() + question.timeLimit * 1000;
  io.to(`game:${session.gameCode}`).emit('player:answering_start', {});
  startTimer(session, io);
}

function startTimer(session, io) {
  session.clearTimer();
  session.timerInterval = setInterval(() => {
    const remaining = (session.questionEndTime - Date.now()) / 1000;
    io.to(`display:${session.gameCode}`).emit('display:time_update', {
      timeRemaining: Math.max(0, remaining),
    });

    const answered = session.answeredCount();
    io.to(`host:${session.gameCode}`).emit('host:answer_progress', {
      answered,
      total: session.players.size,
    });

    if (remaining <= 0) {
      session.clearTimer();
      revealAnswer(session, io);
    }
  }, 500);
}

function revealAnswer(session, io) {
  if (session.state !== STATES.ANSWERING) return;
  session.transition(STATES.REVEALING_ANSWER);
  const question = session.quiz.questions[session.currentQuestionIndex];
  const counts = session.getAnswerCounts();

  io.to(`display:${session.gameCode}`).emit('display:reveal_answer', {
    correctIndex: question.correctIndex,
    counts,
  });

  io.to(`host:${session.gameCode}`).emit('host:question_timeout', {
    questionIndex: session.currentQuestionIndex,
  });

  for (const [socketId, player] of session.players) {
    const answerRecord = player.answers.find(a => a.questionIndex === session.currentQuestionIndex);
    if (answerRecord) {
      io.to(socketId).emit('player:answer_result', {
        correct: answerRecord.correct,
        score: answerRecord.pointsEarned,
        totalScore: player.score,
        rank: session.getPlayerRank(socketId),
      });
    } else {
      io.to(socketId).emit('player:answer_result', {
        correct: false,
        score: 0,
        totalScore: player.score,
        rank: session.getPlayerRank(socketId),
      });
    }
  }
}

function showLeaderboard(session, io) {
  session.transition(STATES.LEADERBOARD);
  const scores = session.getLeaderboard(5);

  io.to(`display:${session.gameCode}`).emit('display:leaderboard', { scores });
  io.to(`host:${session.gameCode}`).emit('display:leaderboard', { scores });

  for (const [socketId, player] of session.players) {
    const myRank = session.getPlayerRank(socketId);
    io.to(socketId).emit('player:leaderboard', {
      myRank,
      myScore: player.score,
      top5: scores,
    });
  }
}

function nextQuestion(session, io) {
  if (session.isLastQuestion()) {
    endGame(session, io);
  } else {
    startQuestion(session, io);
  }
}

function endGame(session, io) {
  session.state = STATES.GAME_OVER;
  session.clearTimer();
  const scores = session.getLeaderboard(5);

  io.to(`display:${session.gameCode}`).emit('display:game_over', { scores });
  io.to(`host:${session.gameCode}`).emit('display:game_over', { scores });

  for (const [socketId, player] of session.players) {
    io.to(socketId).emit('player:game_over', {
      finalRank: session.getPlayerRank(socketId),
      finalScore: player.score,
      top5: scores,
    });
  }
}

function removeSession(gameCode) {
  const id = codeToId.get(gameCode);
  if (id) {
    sessions.delete(id);
    codeToId.delete(gameCode);
  }
}

module.exports = {
  createSession,
  getByCode,
  getById,
  startQuestion,
  beginAnswering,
  revealAnswer,
  showLeaderboard,
  nextQuestion,
  endGame,
  removeSession,
};
