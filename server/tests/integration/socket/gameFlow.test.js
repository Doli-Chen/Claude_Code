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
let hostClient, playerClient, displayClient;

beforeAll((done) => {
  server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  initSocket(io);
  server.listen(0, () => {
    port = server.address().port;
    done();
  });
});

afterAll((done) => {
  [hostClient, playerClient, displayClient].forEach((c) => c?.disconnect());
  server.close(done);
});

function connect(role) {
  return new Promise((resolve) => {
    const c = Client(`http://localhost:${port}`);
    c.on('connect', () => resolve(c));
  });
}

function waitFor(client, event) {
  return new Promise((resolve) => client.once(event, resolve));
}

describe('Game flow integration', () => {
  let gameCode;

  beforeAll(async () => {
    hostClient = await connect();
    playerClient = await connect();
    displayClient = await connect();
  });

  it('host creates a game', async () => {
    const created = waitFor(hostClient, 'host:game_created');
    hostClient.emit('host:create_game', { quizId: sampleQuiz.id });
    const data = await created;
    expect(data.quizTitle).toBe(sampleQuiz.title);
    gameCode = data.gameCode;
  });

  it('display registers for waiting room', async () => {
    const waitingRoom = waitFor(displayClient, 'display:waiting_room');
    displayClient.emit('display:register', { gameCode });
    const data = await waitingRoom;
    expect(data.gameCode).toBe(gameCode);
  });

  it('player joins game', async () => {
    const joined = waitFor(playerClient, 'player:join_success');
    playerClient.emit('player:join', { gameCode, nickname: 'TestPlayer' });
    const data = await joined;
    expect(data.nickname).toBe('TestPlayer');
  });

  it('player gets error for duplicate nickname', async () => {
    const extraClient = await connect();
    const error = waitFor(extraClient, 'player:join_error');
    extraClient.emit('player:join', { gameCode, nickname: 'TestPlayer' });
    const data = await error;
    expect(data.code).toBe('NICKNAME_TAKEN');
    extraClient.disconnect();
  });

  it('host starts game and question appears', async () => {
    const questionReady = waitFor(playerClient, 'player:question_ready');
    const questionStart = waitFor(displayClient, 'display:question_start');
    hostClient.emit('host:start_game', { gameCode });
    const [playerData, displayData] = await Promise.all([questionReady, questionStart]);
    expect(playerData.questionIndex).toBe(0);
    expect(displayData.question.text).toBe(sampleQuiz.questions[0].text);
  });

  it('player submits answer and gets result', async () => {
    const answering = waitFor(playerClient, 'player:answering_start');
    await answering;
    const result = waitFor(playerClient, 'player:answer_result');
    playerClient.emit('player:submit_answer', { gameCode, answerIndex: 1 });
    const data = await result;
    expect(data.correct).toBe(true);
    expect(data.totalScore).toBeGreaterThan(0);
  });
});
