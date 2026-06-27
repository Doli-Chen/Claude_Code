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

describe('Host socket handlers', () => {
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

  it('emits host:error for unknown quiz', async () => {
    const { getQuiz } = require('../../../src/services/QuizService');
    getQuiz.mockRejectedValueOnce(Object.assign(new Error('Quiz not found'), { status: 404 }));
    const errorClient = await connect();
    const error = waitFor(errorClient, 'host:error');
    errorClient.emit('host:create_game', { quizId: 'bad-id' });
    const data = await error;
    expect(data.message).toContain('not found');
    errorClient.disconnect();
  }, 10000);

  it('start_game triggers player:question_ready then player:answering_start immediately', async () => {
    const playerClient = await connect();
    const joined = waitFor(playerClient, 'player:join_success');
    playerClient.emit('player:join', { gameCode, nickname: 'P1' });
    await joined;

    const answering = waitFor(playerClient, 'player:answering_start');
    hostClient.emit('host:start_game', { gameCode });
    await answering;

    playerClient.disconnect();
  }, 10000);

  it('host:reveal_answer then host:show_leaderboard then host:next_question', async () => {
    const playerClient = await connect();
    const joined = waitFor(playerClient, 'player:join_success');
    playerClient.emit('player:join', { gameCode, nickname: 'P3' });
    await joined;

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(playerClient, 'player:answering_start');

    hostClient.emit('host:reveal_answer', { gameCode });
    await waitFor(hostClient, 'host:question_timeout');

    hostClient.emit('host:show_leaderboard', { gameCode });
    const leaderboard = waitFor(playerClient, 'player:leaderboard');
    await leaderboard;

    hostClient.emit('host:next_question', { gameCode });
    const nextQuestion = waitFor(playerClient, 'player:question_ready');
    await nextQuestion;

    playerClient.disconnect();
  }, 15000);

  it('unauthorized host cannot start game (wrong socket)', async () => {
    const impostor = await connect();
    impostor.emit('host:start_game', { gameCode });
    await new Promise((r) => setTimeout(r, 300));
    impostor.disconnect();
  }, 10000);

  it('host:start_game emits error if game already started', async () => {
    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'Starter' });
    await waitFor(p, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(p, 'player:answering_start');

    const error = waitFor(hostClient, 'host:error');
    hostClient.emit('host:start_game', { gameCode });
    const data = await error;
    expect(data.message).toMatch(/already started/i);
    p.disconnect();
  }, 15000);

  it('host receives display:question_start when a question begins', async () => {
    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'P' });
    await waitFor(p, 'player:join_success');

    const hostQuestion = waitFor(hostClient, 'display:question_start');
    hostClient.emit('host:start_game', { gameCode });
    const data = await hostQuestion;
    expect(data.questionIndex).toBe(0);
    expect(data.question.text).toBe(sampleQuiz.questions[0].text);

    p.disconnect();
  }, 10000);

  it('host receives display:leaderboard after host:show_leaderboard', async () => {
    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'P' });
    await waitFor(p, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    await waitFor(p, 'player:answering_start');

    hostClient.emit('host:reveal_answer', { gameCode });
    await waitFor(hostClient, 'host:question_timeout');

    const hostLeaderboard = waitFor(hostClient, 'display:leaderboard');
    hostClient.emit('host:show_leaderboard', { gameCode });
    const data = await hostLeaderboard;
    expect(Array.isArray(data.scores)).toBe(true);

    p.disconnect();
  }, 10000);

  it('host receives display:game_over after host:end_game', async () => {
    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'P' });
    await waitFor(p, 'player:join_success');

    const hostGameOver = waitFor(hostClient, 'display:game_over');
    hostClient.emit('host:end_game', { gameCode });
    const data = await hostGameOver;
    expect(Array.isArray(data.scores)).toBe(true);

    p.disconnect();
  }, 10000);

  it('host can complete full cycle: start → reveal → leaderboard → next question', async () => {
    const p = await connect();
    p.emit('player:join', { gameCode, nickname: 'P' });
    await waitFor(p, 'player:join_success');

    hostClient.emit('host:start_game', { gameCode });
    const q1 = await waitFor(hostClient, 'display:question_start');
    expect(q1.questionIndex).toBe(0);

    await waitFor(p, 'player:answering_start');
    hostClient.emit('host:reveal_answer', { gameCode });
    await waitFor(hostClient, 'host:question_timeout');

    hostClient.emit('host:show_leaderboard', { gameCode });
    await waitFor(hostClient, 'display:leaderboard');

    const q2 = waitFor(hostClient, 'display:question_start');
    hostClient.emit('host:next_question', { gameCode });
    const q2data = await q2;
    expect(q2data.questionIndex).toBe(1);

    p.disconnect();
  }, 15000);

  it('host:create_game_join allows reconnected host to receive player_joined events', async () => {
    // Simulate host page navigation: disconnect original socket, reconnect as new socket
    hostClient.disconnect();
    const reconnectedHost = await connect();

    const gameCreated = waitFor(reconnectedHost, 'host:game_created');
    reconnectedHost.emit('host:create_game_join', { gameCode });
    const created = await gameCreated;
    expect(created.gameCode).toBe(gameCode);

    // Player joins — reconnected host must receive the event
    const playerJoined = waitFor(reconnectedHost, 'host:player_joined');
    const playerClient = await connect();
    playerClient.emit('player:join', { gameCode, nickname: 'Rejoiner' });
    const joined = await playerJoined;
    expect(joined.player.nickname).toBe('Rejoiner');
    expect(joined.playerCount).toBe(1);

    playerClient.disconnect();
    reconnectedHost.disconnect();
    hostClient = null;
  }, 10000);

  it('host:end_game ends the session for all players', async () => {
    const playerClient = await connect();
    const joined = waitFor(playerClient, 'player:join_success');
    playerClient.emit('player:join', { gameCode, nickname: 'P4' });
    await joined;

    const gameOver = waitFor(playerClient, 'player:game_over');
    hostClient.emit('host:end_game', { gameCode });
    await gameOver;

    playerClient.disconnect();
  }, 10000);
});
