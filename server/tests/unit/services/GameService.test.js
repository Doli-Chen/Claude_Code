const sampleQuiz = require('../../fixtures/sampleQuiz.json');

let gameService;

beforeEach(() => {
  jest.resetModules();
  gameService = require('../../../src/services/GameService');
});

function makeMockIo() {
  const emitted = {};
  const to = jest.fn().mockReturnThis();
  const emit = jest.fn().mockImplementation((event, data) => {
    emitted[event] = data;
  });
  return { to, emit, emitted, io: { to } };
}

describe('GameService - session management', () => {
  it('creates a session with a game code', () => {
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    expect(session.gameCode).toHaveLength(6);
    expect(session.quiz.title).toBe(sampleQuiz.title);
  });

  it('getByCode returns the session', () => {
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    const found = gameService.getByCode(session.gameCode);
    expect(found).toBe(session);
  });

  it('getByCode returns null for unknown code', () => {
    expect(gameService.getByCode('XXXXXX')).toBeNull();
  });

  it('getById returns session', () => {
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    expect(gameService.getById(session.gameId)).toBe(session);
  });

  it('removeSession cleans up', () => {
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    gameService.removeSession(session.gameCode);
    expect(gameService.getByCode(session.gameCode)).toBeNull();
  });
});

describe('GameService - startQuestion', () => {
  it('transitions session to QUESTION_INTRO and emits events', () => {
    jest.useFakeTimers();
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    const { io, to, emit } = makeMockIo();
    const mockIo = { to: jest.fn().mockReturnValue({ emit }) };

    gameService.startQuestion(session, mockIo);
    expect(session.state).toBe('QUESTION_INTRO');
    expect(session.currentQuestionIndex).toBe(0);
    expect(mockIo.to).toHaveBeenCalledWith(`display:${session.gameCode}`);

    jest.clearAllTimers();
    jest.useRealTimers();
  });
});

describe('GameService - revealAnswer', () => {
  it('transitions to REVEALING_ANSWER and emits', () => {
    jest.useFakeTimers();
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    session.addPlayer('p1', 'Alice');
    const mockIo = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };

    gameService.startQuestion(session, mockIo);
    jest.advanceTimersByTime(3000);
    gameService.revealAnswer(session, mockIo);

    expect(session.state).toBe('REVEALING_ANSWER');
    jest.useRealTimers();
  });

  it('does nothing if not in ANSWERING state', () => {
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    const mockIo = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
    gameService.revealAnswer(session, mockIo);
    expect(session.state).toBe('LOBBY');
  });
});

describe('GameService - showLeaderboard', () => {
  it('transitions to LEADERBOARD and emits to display and players', () => {
    jest.useFakeTimers();
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    session.addPlayer('p1', 'Alice');
    const mockIo = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };

    gameService.startQuestion(session, mockIo);
    jest.advanceTimersByTime(3000);
    gameService.revealAnswer(session, mockIo);
    gameService.showLeaderboard(session, mockIo);

    expect(session.state).toBe('LEADERBOARD');
    jest.useRealTimers();
  });
});

describe('GameService - endGame', () => {
  it('sets state to GAME_OVER', () => {
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    session.addPlayer('p1', 'Alice');
    const mockIo = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
    gameService.endGame(session, mockIo);
    expect(session.state).toBe('GAME_OVER');
  });
});

describe('GameService - nextQuestion', () => {
  it('calls endGame on last question', () => {
    const session = gameService.createSession(sampleQuiz, 'host-socket');
    session.addPlayer('p1', 'Alice');
    const mockIo = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
    session.currentQuestionIndex = sampleQuiz.questions.length - 1;
    session.state = 'LEADERBOARD';
    gameService.nextQuestion(session, mockIo);
    expect(session.state).toBe('GAME_OVER');
  });
});
