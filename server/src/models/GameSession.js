const STATES = {
  LOBBY: 'LOBBY',
  QUESTION_INTRO: 'QUESTION_INTRO',
  ANSWERING: 'ANSWERING',
  REVEALING_ANSWER: 'REVEALING_ANSWER',
  LEADERBOARD: 'LEADERBOARD',
  GAME_OVER: 'GAME_OVER',
};

const VALID_TRANSITIONS = {
  LOBBY: ['QUESTION_INTRO'],
  QUESTION_INTRO: ['ANSWERING'],
  ANSWERING: ['REVEALING_ANSWER'],
  REVEALING_ANSWER: ['LEADERBOARD'],
  LEADERBOARD: ['QUESTION_INTRO', 'GAME_OVER'],
  GAME_OVER: [],
};

class GameSession {
  constructor({ gameId, gameCode, quiz, hostSocketId }) {
    this.gameId = gameId;
    this.gameCode = gameCode;
    this.quiz = quiz;
    this.hostSocketId = hostSocketId;
    this.displaySocketId = null;
    this.state = STATES.LOBBY;
    this.currentQuestionIndex = -1;
    this.questionStartTime = null;
    this.questionEndTime = null;
    this.timerInterval = null;
    this.players = new Map();
    this.createdAt = Date.now();
  }

  canTransition(nextState) {
    return VALID_TRANSITIONS[this.state]?.includes(nextState) ?? false;
  }

  transition(nextState) {
    if (!this.canTransition(nextState)) {
      throw new Error(`Invalid transition: ${this.state} → ${nextState}`);
    }
    this.state = nextState;
  }

  addPlayer(socketId, nickname) {
    if (this.state !== STATES.LOBBY) return { error: 'GAME_STARTED' };
    for (const [, p] of this.players) {
      if (p.nickname === nickname) return { error: 'NICKNAME_TAKEN' };
    }
    if (this.players.size >= 100) return { error: 'FULL' };
    const player = {
      id: socketId,
      nickname,
      score: 0,
      rank: null,
      answers: [],
      hasAnsweredCurrent: false,
    };
    this.players.set(socketId, player);
    return { player };
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  submitAnswer(socketId, answerIndex) {
    const player = this.players.get(socketId);
    if (!player) return { error: 'PLAYER_NOT_FOUND' };
    if (this.state !== STATES.ANSWERING) return { error: 'NOT_ANSWERING' };
    if (player.hasAnsweredCurrent) return { error: 'ALREADY_ANSWERED' };

    const question = this.quiz.questions[this.currentQuestionIndex];
    const correct = answerIndex === question.correctIndex;
    const pointsEarned = correct
      ? Math.max(1, Math.ceil((this.questionEndTime - Date.now()) / 1000))
      : 0;

    player.hasAnsweredCurrent = true;
    player.score += pointsEarned;
    player.answers.push({
      questionIndex: this.currentQuestionIndex,
      answerIndex,
      correct,
      pointsEarned,
    });

    return { correct, pointsEarned, totalScore: player.score };
  }

  getAnswerCounts() {
    const counts = [0, 0, 0, 0];
    for (const [, p] of this.players) {
      const answer = p.answers[this.currentQuestionIndex];
      if (answer !== undefined) counts[answer.answerIndex]++;
    }
    return counts;
  }

  getLeaderboard(top = 5) {
    const sorted = [...this.players.values()].sort((a, b) => b.score - a.score);
    return sorted.slice(0, top).map((p, i) => ({
      rank: i + 1,
      nickname: p.nickname,
      score: p.score,
    }));
  }

  getPlayerRank(socketId) {
    const sorted = [...this.players.values()].sort((a, b) => b.score - a.score);
    return sorted.findIndex((p) => p.id === socketId) + 1;
  }

  resetAnswerFlags() {
    for (const [, p] of this.players) {
      p.hasAnsweredCurrent = false;
    }
  }

  allAnswered() {
    for (const [, p] of this.players) {
      if (!p.hasAnsweredCurrent) return false;
    }
    return this.players.size > 0;
  }

  answeredCount() {
    let count = 0;
    for (const [, p] of this.players) {
      if (p.hasAnsweredCurrent) count++;
    }
    return count;
  }

  isLastQuestion() {
    return this.currentQuestionIndex >= this.quiz.questions.length - 1;
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}

module.exports = { GameSession, STATES };
