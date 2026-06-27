const { GameSession, STATES } = require('../../../src/models/GameSession');
const sampleQuiz = require('../../fixtures/sampleQuiz.json');

function makeSession(overrides = {}) {
  return new GameSession({
    gameId: 'game-1',
    gameCode: 'TEST01',
    quiz: sampleQuiz,
    hostSocketId: 'host-socket',
    ...overrides,
  });
}

describe('GameSession - state machine', () => {
  it('starts in LOBBY state', () => {
    expect(makeSession().state).toBe(STATES.LOBBY);
  });

  it('allows valid transitions', () => {
    const s = makeSession();
    s.transition(STATES.QUESTION_INTRO);
    expect(s.state).toBe(STATES.QUESTION_INTRO);
  });

  it('throws on invalid transition', () => {
    const s = makeSession();
    expect(() => s.transition(STATES.GAME_OVER)).toThrow();
  });

  it('canTransition returns false for invalid next state', () => {
    const s = makeSession();
    expect(s.canTransition(STATES.GAME_OVER)).toBe(false);
    expect(s.canTransition(STATES.QUESTION_INTRO)).toBe(true);
  });
});

describe('GameSession - players', () => {
  it('adds a player successfully', () => {
    const s = makeSession();
    const result = s.addPlayer('p1', 'Alice');
    expect(result.player.nickname).toBe('Alice');
    expect(s.players.size).toBe(1);
  });

  it('rejects duplicate nicknames', () => {
    const s = makeSession();
    s.addPlayer('p1', 'Alice');
    const result = s.addPlayer('p2', 'Alice');
    expect(result.error).toBe('NICKNAME_TAKEN');
  });

  it('rejects player joining after game started', () => {
    const s = makeSession();
    s.transition(STATES.QUESTION_INTRO);
    const result = s.addPlayer('p1', 'Alice');
    expect(result.error).toBe('GAME_STARTED');
  });

  it('removes a player', () => {
    const s = makeSession();
    s.addPlayer('p1', 'Alice');
    s.removePlayer('p1');
    expect(s.players.size).toBe(0);
  });
});

describe('GameSession - answering', () => {
  function makeAnsweringSession() {
    const s = makeSession();
    s.addPlayer('p1', 'Alice');
    s.transition(STATES.QUESTION_INTRO);
    s.currentQuestionIndex = 0;
    s.questionEndTime = Date.now() + 20000;
    s.transition(STATES.ANSWERING);
    return s;
  }

  it('records a correct answer and awards points', () => {
    const s = makeAnsweringSession();
    const result = s.submitAnswer('p1', 1);
    expect(result.correct).toBe(true);
    expect(result.pointsEarned).toBeGreaterThan(0);
  });

  it('records a wrong answer with 0 points', () => {
    const s = makeAnsweringSession();
    const result = s.submitAnswer('p1', 0);
    expect(result.correct).toBe(false);
    expect(result.pointsEarned).toBe(0);
  });

  it('rejects double-answering', () => {
    const s = makeAnsweringSession();
    s.submitAnswer('p1', 1);
    const result = s.submitAnswer('p1', 1);
    expect(result.error).toBe('ALREADY_ANSWERED');
  });

  it('returns PLAYER_NOT_FOUND for unknown socket', () => {
    const s = makeAnsweringSession();
    expect(s.submitAnswer('unknown', 1).error).toBe('PLAYER_NOT_FOUND');
  });

  it('allAnswered returns true when all players answered', () => {
    const s = makeAnsweringSession();
    s.submitAnswer('p1', 1);
    expect(s.allAnswered()).toBe(true);
  });

  it('allAnswered returns false with pending players', () => {
    const s = makeSession();
    s.addPlayer('p1', 'Alice');
    s.addPlayer('p2', 'Bob');
    s.transition(STATES.QUESTION_INTRO);
    s.currentQuestionIndex = 0;
    s.questionEndTime = Date.now() + 20000;
    s.transition(STATES.ANSWERING);
    s.submitAnswer('p1', 1);
    expect(s.allAnswered()).toBe(false);
  });
});

describe('GameSession - leaderboard', () => {
  it('returns top 5 groups sorted by score', () => {
    const s = makeSession();
    ['Alice','Bob','Carol','Dan','Eve','Frank'].forEach((name, i) => {
      s.addPlayer(`p${i}`, name);
      s.players.get(`p${i}`).score = (6 - i) * 10;
    });
    const board = s.getLeaderboard(5);
    expect(board).toHaveLength(5);
    expect(board[0].nicknames).toContain('Alice');
    expect(board[0].rank).toBe(1);
    expect(board[0].total).toBe(1);
  });

  it('assigns same rank to tied players (competition ranking)', () => {
    const s = makeSession();
    s.addPlayer('p1', 'Alice');
    s.addPlayer('p2', 'Bob');
    s.addPlayer('p3', 'Carol');
    s.players.get('p1').score = 100;
    s.players.get('p2').score = 100;
    s.players.get('p3').score = 80;
    const board = s.getLeaderboard(5);
    expect(board).toHaveLength(2);
    expect(board[0].rank).toBe(1);
    expect(board[0].total).toBe(2);
    expect(board[0].nicknames).toHaveLength(2);
    expect(board[1].rank).toBe(3);
  });
});

describe('GameSession - isLastQuestion', () => {
  it('returns true on last question', () => {
    const s = makeSession();
    s.currentQuestionIndex = sampleQuiz.questions.length - 1;
    expect(s.isLastQuestion()).toBe(true);
  });

  it('returns false on non-last question', () => {
    const s = makeSession();
    s.currentQuestionIndex = 0;
    expect(s.isLastQuestion()).toBe(false);
  });
});
