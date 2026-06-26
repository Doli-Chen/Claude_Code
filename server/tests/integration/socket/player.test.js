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
