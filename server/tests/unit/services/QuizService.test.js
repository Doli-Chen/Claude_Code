jest.mock('../../../src/repositories/QuizRepository');

const repo = require('../../../src/repositories/QuizRepository');
const service = require('../../../src/services/QuizService');

const baseQuiz = {
  id: 'q1',
  title: 'Test Quiz',
  description: '',
  defaultTimeLimit: 20,
  lobbyImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  questions: [],
};

const validQuestion = {
  text: 'Who made the world?',
  options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }, { text: 'D' }],
  correctIndex: 0,
  timeLimit: 20,
};

beforeEach(() => jest.clearAllMocks());

describe('createQuiz', () => {
  it('creates a quiz with trimmed title', async () => {
    repo.save.mockResolvedValue({ ...baseQuiz, title: 'My Quiz' });
    const quiz = await service.createQuiz({ title: '  My Quiz  ' });
    expect(repo.save).toHaveBeenCalled();
    const saved = repo.save.mock.calls[0][0];
    expect(saved.title).toBe('My Quiz');
  });

  it('initialises lobbyImageUrl to null', async () => {
    repo.save.mockResolvedValue({ ...baseQuiz });
    await service.createQuiz({ title: 'My Quiz' });
    const saved = repo.save.mock.calls[0][0];
    expect(saved.lobbyImageUrl).toBeNull();
  });

  it('throws 400 if title is empty', async () => {
    await expect(service.createQuiz({ title: '' })).rejects.toMatchObject({ status: 400 });
  });
});

describe('updateQuiz', () => {
  it('updates lobbyImageUrl', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz });
    repo.save.mockImplementation((q) => Promise.resolve(q));
    const result = await service.updateQuiz('q1', { lobbyImageUrl: '/uploads/banner.png' });
    expect(result.lobbyImageUrl).toBe('/uploads/banner.png');
  });

  it('clears lobbyImageUrl when set to null', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz, lobbyImageUrl: '/uploads/old.png' });
    repo.save.mockImplementation((q) => Promise.resolve(q));
    const result = await service.updateQuiz('q1', { lobbyImageUrl: null });
    expect(result.lobbyImageUrl).toBeNull();
  });

  it('does not change lobbyImageUrl when not in updates', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz, lobbyImageUrl: '/uploads/keep.png' });
    repo.save.mockImplementation((q) => Promise.resolve(q));
    const result = await service.updateQuiz('q1', { title: 'New Title' });
    expect(result.lobbyImageUrl).toBe('/uploads/keep.png');
  });
});

describe('getQuiz', () => {
  it('returns quiz when found', async () => {
    repo.findById.mockResolvedValue(baseQuiz);
    const quiz = await service.getQuiz('q1');
    expect(quiz.id).toBe('q1');
  });

  it('throws 404 when not found', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getQuiz('missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('deleteQuiz', () => {
  it('deletes successfully', async () => {
    repo.remove.mockResolvedValue(true);
    await expect(service.deleteQuiz('q1')).resolves.toBeUndefined();
  });

  it('throws 404 when not found', async () => {
    repo.remove.mockResolvedValue(false);
    await expect(service.deleteQuiz('missing')).rejects.toMatchObject({ status: 404 });
  });
});

describe('addQuestion', () => {
  it('adds a valid question', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz });
    repo.save.mockResolvedValue({});
    const q = await service.addQuestion('q1', validQuestion);
    expect(q.text).toBe('Who made the world?');
    expect(q.correctIndex).toBe(0);
  });

  it('throws 400 when options count is not 4', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz });
    await expect(
      service.addQuestion('q1', { ...validQuestion, options: [{ text: 'A' }] })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 when 256 questions already exist', async () => {
    const fullQuiz = {
      ...baseQuiz,
      questions: Array(256).fill({}),
    };
    repo.findById.mockResolvedValue(fullQuiz);
    await expect(service.addQuestion('q1', validQuestion)).rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 for invalid timeLimit', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz });
    await expect(
      service.addQuestion('q1', { ...validQuestion, timeLimit: 99 })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('preserves imageUrl on each option', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz });
    repo.save.mockResolvedValue({});
    const q = await service.addQuestion('q1', {
      ...validQuestion,
      options: [
        { text: 'A', imageUrl: '/uploads/a.png' },
        { text: 'B' },
        { text: 'C' },
        { text: 'D' },
      ],
    });
    expect(q.options[0].imageUrl).toBe('/uploads/a.png');
    expect(q.options[1].imageUrl).toBeNull();
  });
});

describe('updateQuestion', () => {
  it('updates an existing question', async () => {
    const quiz = { ...baseQuiz, questions: [{ ...validQuestion, id: 'q-x', options: validQuestion.options }] };
    repo.findById.mockResolvedValue(quiz);
    repo.save.mockImplementation((q) => Promise.resolve(q));
    const updated = await service.updateQuestion('q1', 0, { text: 'Updated text' });
    expect(updated.text).toBe('Updated text');
  });

  it('throws 404 for invalid question index', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz, questions: [] });
    await expect(service.updateQuestion('q1', 0, {})).rejects.toMatchObject({ status: 404 });
  });
});

describe('deleteQuestion', () => {
  it('removes a question by index', async () => {
    const quiz = { ...baseQuiz, questions: [{ id: 'a' }, { id: 'b' }] };
    repo.findById.mockResolvedValue(quiz);
    repo.save.mockImplementation((q) => Promise.resolve(q));
    await service.deleteQuestion('q1', 0);
    expect(repo.save.mock.calls[0][0].questions).toHaveLength(1);
  });

  it('throws 404 for invalid index', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz, questions: [] });
    await expect(service.deleteQuestion('q1', 0)).rejects.toMatchObject({ status: 404 });
  });
});

describe('reorderQuestions', () => {
  it('moves a question from one index to another', async () => {
    const quiz = {
      ...baseQuiz,
      questions: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    };
    repo.findById.mockResolvedValue(quiz);
    repo.save.mockImplementation((q) => Promise.resolve(q));
    const result = await service.reorderQuestions('q1', 0, 2);
    expect(result.questions[0].id).toBe('b');
    expect(result.questions[2].id).toBe('a');
  });

  it('throws 400 for out-of-bounds indices', async () => {
    repo.findById.mockResolvedValue({ ...baseQuiz, questions: [{ id: 'a' }] });
    await expect(service.reorderQuestions('q1', 0, 5)).rejects.toMatchObject({ status: 400 });
  });
});
