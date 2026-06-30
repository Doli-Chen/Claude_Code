const http = require('http');
const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const app = require('../../../src/app');
const initSocket = require('../../../src/socket');
const sampleQuiz = require('../../fixtures/sampleQuiz.json');

jest.mock('../../../src/services/QuizService', () => ({
  getQuiz: jest.fn().mockResolvedValue(require('../../fixtures/sampleQuiz.json')),
}));

let server, port;

function connect() {
  return new Promise((resolve) => {
    const c = Client(`http://localhost:${port}`);
    c.on('connect', () => resolve(c));
  });
}

function waitFor(client, event, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout: ${event}`)), timeout);
    client.once(event, (data) => { clearTimeout(t); resolve(data); });
  });
}

beforeAll((done) => {
  server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  initSocket(io);
  server.listen(0, () => { port = server.address().port; done(); });
}, 10000);

afterAll((done) => { server.close(() => done()); }, 10000);

describe('Player socket error paths', () => {
  it('emits GAME_NOT_FOUND when game code is unknown', async () => {
    const c = await connect();
    const error = waitFor(c, 'player:join_error');
    c.emit('player:join', { gameCode: 'XXXXXX', nickname: 'Ghost' });
    const data = await error;
    expect(data.code).toBe('GAME_NOT_FOUND');
    c.disconnect();
  }, 10000);

  it('submit_answer does nothing when game not found', async () => {
    const c = await connect();
    c.emit('player:submit_answer', { gameCode: 'XXXXXX', answerIndex: 0 });
    await new Promise((r) => setTimeout(r, 200));
    c.disconnect();
  }, 10000);

  it('disconnect without gameCode does not throw', async () => {
    const c = await connect();
    await new Promise((r) => setTimeout(r, 100));
    c.disconnect();
    await new Promise((r) => setTimeout(r, 200));
  }, 10000);

  it('display:register with unknown gameCode does nothing', async () => {
    const c = await connect();
    c.emit('display:register', { gameCode: 'XXXXXX' });
    await new Promise((r) => setTimeout(r, 200));
    c.disconnect();
  }, 10000);
});

describe('Player rejoin', () => {
  let hostClient, gameCode;

  beforeAll(async () => {
    hostClient = await connect();
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    gameCode = (await created).gameCode;
  }, 15000);

  afterAll(() => hostClient?.disconnect());

  it('rejoins successfully within grace period', async () => {
    const p1 = await connect();
    const joined = waitFor(p1, 'player:join_success');
    p1.emit('player:join', { gameCode, nickname: 'ReconnectAlice' });
    await joined;
    p1.disconnect();

    await new Promise((r) => setTimeout(r, 150));

    const p2 = await connect();
    const rejoinData = waitFor(p2, 'player:join_success');
    p2.emit('player:rejoin', { gameCode, nickname: 'ReconnectAlice' });
    const data = await rejoinData;
    expect(data.nickname).toBe('ReconnectAlice');
    p2.disconnect();
  }, 15000);

  it('returns PLAYER_NOT_FOUND for unknown nickname on rejoin', async () => {
    const c = await connect();
    const error = waitFor(c, 'player:join_error');
    c.emit('player:rejoin', { gameCode, nickname: 'Ghost' });
    const data = await error;
    expect(data.code).toBe('PLAYER_NOT_FOUND');
    c.disconnect();
  }, 10000);

  it('returns GAME_NOT_FOUND on rejoin for unknown gameCode', async () => {
    const c = await connect();
    const error = waitFor(c, 'player:join_error');
    c.emit('player:rejoin', { gameCode: 'XXXXXX', nickname: 'Anyone' });
    const data = await error;
    expect(data.code).toBe('GAME_NOT_FOUND');
    c.disconnect();
  }, 10000);
});

describe('Player rejoin during ANSWERING state', () => {
  let hostClient, gameCode;

  beforeAll(async () => {
    hostClient = await connect();
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    gameCode = (await created).gameCode;

    const p = await connect();
    const joined = waitFor(p, 'player:join_success');
    p.emit('player:join', { gameCode, nickname: 'RejoinBob' });
    await joined;

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(p, 'player:answering_start');
    p.disconnect();

    await new Promise((r) => setTimeout(r, 150));
  }, 20000);

  afterAll(() => hostClient?.disconnect());

  it('receives player:question_ready on rejoin during ANSWERING', async () => {
    const p2 = await connect();
    const successP = waitFor(p2, 'player:join_success');
    const questionP = waitFor(p2, 'player:question_ready');
    p2.emit('player:rejoin', { gameCode, nickname: 'RejoinBob' });
    await successP;
    const qData = await questionP;
    expect(qData).toHaveProperty('questionIndex');
    expect(qData).toHaveProperty('question');
    p2.disconnect();
  }, 15000);
});

describe('Player rejoin during LEADERBOARD state', () => {
  let hostClient, gameCode;

  beforeAll(async () => {
    hostClient = await connect();
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    gameCode = (await created).gameCode;

    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'LBBob' });
    await waitFor(p, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(p, 'player:answering_start');

    hostClient.emit('host:reveal_answer', { gameCode });
    await waitFor(p, 'player:answer_result');

    hostClient.emit('host:show_leaderboard', { gameCode });
    await waitFor(p, 'player:leaderboard');

    p.disconnect();
    await new Promise((r) => setTimeout(r, 150));
  }, 20000);

  afterAll(() => hostClient?.disconnect());

  it('receives player:leaderboard on rejoin during LEADERBOARD', async () => {
    const p2 = await connect();
    const successP = waitFor(p2, 'player:join_success');
    const lbP = waitFor(p2, 'player:leaderboard');
    p2.emit('player:rejoin', { gameCode, nickname: 'LBBob' });
    await successP;
    const lbData = await lbP;
    expect(lbData).toHaveProperty('myRank');
    expect(lbData).toHaveProperty('top5');
    p2.disconnect();
  }, 15000);
});

describe('Player rejoin during GAME_OVER state', () => {
  let hostClient, gameCode;

  beforeAll(async () => {
    hostClient = await connect();
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    gameCode = (await created).gameCode;

    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'GOCarol' });
    await waitFor(p, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(p, 'player:answering_start');

    hostClient.emit('host:end_game', { gameCode });
    await waitFor(p, 'player:game_over');

    p.disconnect();
    await new Promise((r) => setTimeout(r, 150));
  }, 20000);

  afterAll(() => hostClient?.disconnect());

  it('receives player:game_over on rejoin during GAME_OVER', async () => {
    const p2 = await connect();
    const successP = waitFor(p2, 'player:join_success');
    const goP = waitFor(p2, 'player:game_over');
    p2.emit('player:rejoin', { gameCode, nickname: 'GOCarol' });
    await successP;
    const goData = await goP;
    expect(goData).toHaveProperty('finalRank');
    expect(goData).toHaveProperty('top5');
    p2.disconnect();
  }, 15000);
});

describe('Player disconnect grace period expiry', () => {
  const GRACE_MS = 300;
  let hostClient, gameCode;

  beforeAll(async () => {
    process.env.DISCONNECT_GRACE_PERIOD_MS = String(GRACE_MS);
    hostClient = await connect();
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    gameCode = (await created).gameCode;
  }, 10000);

  afterAll(() => {
    delete process.env.DISCONNECT_GRACE_PERIOD_MS;
    hostClient?.disconnect();
  });

  it('removes player and notifies host after grace period expires', async () => {
    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'GracePlayer' });
    await waitFor(p, 'player:join_success');

    const playerLeftP = waitFor(hostClient, 'host:player_left', 5000);
    p.disconnect();

    const leftData = await playerLeftP;
    expect(leftData.playerCount).toBe(0);
  }, 10000);

  it('cannot rejoin after grace period expires', async () => {
    // Player was already removed in previous test — rejoin should fail
    const c = await connect();
    const errorP = waitFor(c, 'player:join_error');
    c.emit('player:rejoin', { gameCode, nickname: 'GracePlayer' });
    const data = await errorP;
    expect(data.code).toBe('PLAYER_NOT_FOUND');
    c.disconnect();
  }, 10000);
});

describe('Player full game - GAME_STARTED error', () => {
  let hostClient, gameCode;

  beforeAll(async () => {
    hostClient = await connect();
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    const data = await created;
    gameCode = data.gameCode;

    const p = await connect();
    const joined = waitFor(p, 'player:join_success');
    p.emit('player:join', { gameCode, nickname: 'Early' });
    await joined;

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(p, 'player:answering_start');
    p.disconnect();
  }, 15000);

  afterAll(() => hostClient?.disconnect());

  it('rejects late joiners with GAME_STARTED', async () => {
    const lateClient = await connect();
    const error = waitFor(lateClient, 'player:join_error');
    lateClient.emit('player:join', { gameCode, nickname: 'LateJoiner' });
    const data = await error;
    expect(data.code).toBe('GAME_STARTED');
    lateClient.disconnect();
  }, 10000);
});
