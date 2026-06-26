const path = require('path');
const fs = require('fs').promises;
const os = require('os');

let repo;
let TEST_DIR;

beforeEach(async () => {
  TEST_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'quiz-repo-test-'));
  process.env.QUIZ_DATA_DIR = TEST_DIR;
  jest.resetModules();
  repo = require('../../../src/repositories/QuizRepository');
});

afterEach(async () => {
  delete process.env.QUIZ_DATA_DIR;
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

const sampleQuiz = {
  id: 'test-1',
  title: 'Test',
  updatedAt: '2026-01-01T00:00:00Z',
  questions: [],
};

describe('QuizRepository', () => {
  it('findAll returns empty array when no quizzes', async () => {
    const result = await repo.findAll();
    expect(result).toEqual([]);
  });

  it('save writes file and findAll returns it', async () => {
    await repo.save(sampleQuiz);
    const all = await repo.findAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('test-1');
  });

  it('findById returns quiz after save', async () => {
    await repo.save(sampleQuiz);
    const found = await repo.findById(sampleQuiz.id);
    expect(found?.id).toBe(sampleQuiz.id);
    expect(found?.title).toBe('Test');
  });

  it('findById returns null for missing id', async () => {
    const result = await repo.findById('nonexistent');
    expect(result).toBeNull();
  });

  it('remove returns true after save', async () => {
    await repo.save(sampleQuiz);
    const result = await repo.remove(sampleQuiz.id);
    expect(result).toBe(true);
    expect(await repo.findById(sampleQuiz.id)).toBeNull();
  });

  it('remove returns false for nonexistent file', async () => {
    const result = await repo.remove('nonexistent');
    expect(result).toBe(false);
  });

  it('findAll sorts by updatedAt descending', async () => {
    await repo.save({ ...sampleQuiz, id: 'a', updatedAt: '2026-01-01T00:00:00Z' });
    await repo.save({ ...sampleQuiz, id: 'b', updatedAt: '2026-06-01T00:00:00Z' });
    const all = await repo.findAll();
    expect(all[0].id).toBe('b');
  });

  it('findById rethrows non-ENOENT errors', async () => {
    const permError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
    jest.spyOn(require('fs').promises, 'readFile').mockRejectedValueOnce(permError);
    await expect(repo.findById('some-id')).rejects.toThrow('Permission denied');
    jest.restoreAllMocks();
  });

  it('remove rethrows non-ENOENT errors', async () => {
    const permError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
    jest.spyOn(require('fs').promises, 'unlink').mockRejectedValueOnce(permError);
    await expect(repo.remove('some-id')).rejects.toThrow('Permission denied');
    jest.restoreAllMocks();
  });
});
