const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

let app;
let TEST_DATA_DIR;

beforeAll(async () => {
  TEST_DATA_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'quiz-api-test-'));
  process.env.QUIZ_DATA_DIR = TEST_DATA_DIR;
  jest.resetModules();
  app = require('../../../src/app');
});

afterAll(async () => {
  delete process.env.QUIZ_DATA_DIR;
  await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
});

describe('Network info API', () => {
  it('GET /api/network returns localIP and port', async () => {
    const savedPort = process.env.PORT;
    process.env.PORT = '9999';
    const res = await request(app).get('/api/network');
    expect(res.status).toBe(200);
    expect(res.body.localIP).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
    expect(res.body.port).toBe('9999');
    process.env.PORT = savedPort;
  });

  it('GET /api/network uses default port 3001 when PORT not set', async () => {
    const savedPort = process.env.PORT;
    delete process.env.PORT;
    const res = await request(app).get('/api/network');
    expect(res.status).toBe(200);
    expect(res.body.port).toBe(3001);
    process.env.PORT = savedPort;
  });
});

describe('Quiz API', () => {
  let createdId;

  it('POST /api/quizzes - creates a quiz', async () => {
    const res = await request(app)
      .post('/api/quizzes')
      .send({ title: 'Integration Test Quiz', defaultTimeLimit: 20 });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Integration Test Quiz');
    createdId = res.body.id;
  });

  it('GET /api/quizzes - lists quizzes', async () => {
    const res = await request(app).get('/api/quizzes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/quizzes/:id - gets a quiz by id', async () => {
    const res = await request(app).get(`/api/quizzes/${createdId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdId);
  });

  it('GET /api/quizzes/:id - 404 for unknown id', async () => {
    const res = await request(app).get('/api/quizzes/nonexistent');
    expect(res.status).toBe(404);
  });

  it('PUT /api/quizzes/:id - updates title', async () => {
    const res = await request(app)
      .put(`/api/quizzes/${createdId}`)
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  it('POST /api/quizzes/:id/questions - adds a question', async () => {
    const res = await request(app)
      .post(`/api/quizzes/${createdId}/questions`)
      .send({
        text: 'Test question',
        options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }],
        correctIndex: 0,
        timeLimit: 20,
      });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Test question');
  });

  it('POST /api/quizzes - 400 for missing title', async () => {
    const res = await request(app).post('/api/quizzes').send({});
    expect(res.status).toBe(400);
  });

  it('DELETE /api/quizzes/:id - deletes the quiz', async () => {
    const res = await request(app).delete(`/api/quizzes/${createdId}`);
    expect(res.status).toBe(204);
  });
});
