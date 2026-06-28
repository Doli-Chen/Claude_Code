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
    const t = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
    client.once(event, (data) => { clearTimeout(t); resolve(data); });
  });
}

beforeAll((done) => {
  server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  initSocket(io);
  server.listen(0, () => { port = server.address().port; done(); });
}, 10000);

afterAll((done) => {
  server.close(() => done());
}, 10000);

describe('Display socket handlers', () => {
  let hostClient, gameCode;

  beforeEach(async () => {
    hostClient = await connect();
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    const data = await created;
    gameCode = data.gameCode;
  }, 10000);

  afterEach((done) => {
    hostClient?.disconnect();
    setTimeout(done, 100);
  });

  it('display:register in LOBBY → receives display:waiting_room', async () => {
    const display = await connect();
    const waitingRoom = waitFor(display, 'display:waiting_room');
    display.emit('display:register', { gameCode });
    const data = await waitingRoom;
    expect(data.gameCode).toBe(gameCode);
    expect(data.quizTitle).toBe(sampleQuiz.title);
    display.disconnect();
  }, 10000);

  it('display:register while game in ANSWERING → receives display:question_start (catch-up)', async () => {
    const player = await connect();
    player.emit('player:join', { gameCode, nickname: 'P1' });
    await waitFor(player, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(player, 'player:answering_start');

    // Display connects AFTER answering has started
    const display = await connect();
    const questionStart = waitFor(display, 'display:question_start');
    display.emit('display:register', { gameCode });
    const data = await questionStart;
    expect(data.questionIndex).toBe(0);
    expect(data.question.text).toBe(sampleQuiz.questions[0].text);

    player.disconnect();
    display.disconnect();
  }, 15000);

  it('display:register while game in REVEALING_ANSWER → receives question_start then reveal_answer', async () => {
    const player = await connect();
    player.emit('player:join', { gameCode, nickname: 'P1' });
    await waitFor(player, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(player, 'player:answering_start');
    hostClient.emit('host:reveal_answer', { gameCode });
    await waitFor(hostClient, 'host:question_timeout');

    // Display connects AFTER answer was revealed
    const display = await connect();
    const revealAnswer = waitFor(display, 'display:reveal_answer');
    display.emit('display:register', { gameCode });
    const data = await revealAnswer;
    expect(data.correctIndex).toBe(sampleQuiz.questions[0].correctIndex);

    player.disconnect();
    display.disconnect();
  }, 15000);

  it('display:register while game in LEADERBOARD → receives display:leaderboard', async () => {
    const player = await connect();
    player.emit('player:join', { gameCode, nickname: 'P1' });
    await waitFor(player, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(player, 'player:answering_start');
    hostClient.emit('host:reveal_answer', { gameCode });
    await waitFor(hostClient, 'host:question_timeout');
    hostClient.emit('host:show_leaderboard', { gameCode });
    await waitFor(player, 'player:leaderboard');

    const display = await connect();
    const leaderboard = waitFor(display, 'display:leaderboard');
    display.emit('display:register', { gameCode });
    const data = await leaderboard;
    expect(Array.isArray(data.scores)).toBe(true);

    player.disconnect();
    display.disconnect();
  }, 15000);

  it('display:register while game in GAME_OVER → receives display:game_over', async () => {
    hostClient.emit('host:end_game', { gameCode });

    const display = await connect();
    const gameOver = waitFor(display, 'display:game_over');
    display.emit('display:register', { gameCode });
    const data = await gameOver;
    expect(Array.isArray(data.scores)).toBe(true);

    display.disconnect();
  }, 10000);

  it('display:register returns silently for unknown game code', async () => {
    const display = await connect();
    display.emit('display:register', { gameCode: 'XXXXXX' });
    await new Promise((r) => setTimeout(r, 300));
    display.disconnect();
  }, 10000);
});
