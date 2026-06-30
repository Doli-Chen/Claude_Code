const { v4: uuidv4 } = require('uuid');
const repo = require('../repositories/QuizRepository');

const VALID_TIME_LIMITS = [5, 10, 15, 20, 30, 45, 60];
const MAX_QUESTIONS = 256;

function validateQuestion(q) {
  if (!q.text && !q.imageUrl) throw Object.assign(new Error('Question must have text or image'), { status: 400 });
  if (!Array.isArray(q.options) || q.options.length !== 4) throw Object.assign(new Error('Question must have exactly 4 options'), { status: 400 });
  if (q.correctIndex < 0 || q.correctIndex > 3) throw Object.assign(new Error('correctIndex must be 0-3'), { status: 400 });
  if (q.timeLimit !== undefined && !VALID_TIME_LIMITS.includes(q.timeLimit)) {
    throw Object.assign(new Error(`timeLimit must be one of ${VALID_TIME_LIMITS.join(',')}`), { status: 400 });
  }
}

async function listQuizzes() {
  return repo.findAll();
}

async function getQuiz(id) {
  const quiz = await repo.findById(id);
  if (!quiz) throw Object.assign(new Error('Quiz not found'), { status: 404 });
  return quiz;
}

async function createQuiz({ title, description = '', defaultTimeLimit = 10 }) {
  if (!title?.trim()) throw Object.assign(new Error('title is required'), { status: 400 });
  const now = new Date().toISOString();
  const quiz = {
    id: uuidv4(),
    title: title.trim(),
    description,
    defaultTimeLimit,
    lobbyImageUrl: null,
    createdAt: now,
    updatedAt: now,
    questions: [],
  };
  return repo.save(quiz);
}

async function updateQuiz(id, updates) {
  const quiz = await getQuiz(id);
  if (updates.title !== undefined) quiz.title = updates.title.trim();
  if (updates.description !== undefined) quiz.description = updates.description;
  if (updates.defaultTimeLimit !== undefined) {
    if (!VALID_TIME_LIMITS.includes(updates.defaultTimeLimit)) {
      throw Object.assign(new Error(`defaultTimeLimit must be one of ${VALID_TIME_LIMITS.join(',')}`), { status: 400 });
    }
    quiz.defaultTimeLimit = updates.defaultTimeLimit;
  }
  if (updates.lobbyImageUrl !== undefined) quiz.lobbyImageUrl = updates.lobbyImageUrl;
  quiz.updatedAt = new Date().toISOString();
  return repo.save(quiz);
}

async function duplicateQuiz(id) {
  const original = await getQuiz(id);
  const now = new Date().toISOString();
  const copy = {
    id: uuidv4(),
    title: `${original.title} (複製)`,
    description: original.description,
    defaultTimeLimit: original.defaultTimeLimit,
    lobbyImageUrl: original.lobbyImageUrl ?? null,
    createdAt: now,
    updatedAt: now,
    questions: original.questions.map((q) => ({ ...q, id: uuidv4() })),
  };
  return repo.save(copy);
}

async function deleteQuiz(id) {
  const deleted = await repo.remove(id);
  if (!deleted) throw Object.assign(new Error('Quiz not found'), { status: 404 });
}

async function addQuestion(quizId, questionData) {
  const quiz = await getQuiz(quizId);
  if (quiz.questions.length >= MAX_QUESTIONS) {
    throw Object.assign(new Error(`Quiz cannot have more than ${MAX_QUESTIONS} questions`), { status: 400 });
  }
  validateQuestion(questionData);
  const question = {
    id: uuidv4(),
    text: questionData.text || '',
    imageUrl: questionData.imageUrl || null,
    timeLimit: questionData.timeLimit ?? quiz.defaultTimeLimit,
    options: questionData.options.map((o, i) => ({ index: i, text: o.text || '', imageUrl: o.imageUrl || null })),
    correctIndex: questionData.correctIndex,
  };
  quiz.questions.push(question);
  quiz.updatedAt = new Date().toISOString();
  await repo.save(quiz);
  return question;
}

async function updateQuestion(quizId, questionIndex, updates) {
  const quiz = await getQuiz(quizId);
  const idx = parseInt(questionIndex, 10);
  if (idx < 0 || idx >= quiz.questions.length) {
    throw Object.assign(new Error('Question not found'), { status: 404 });
  }
  const q = { ...quiz.questions[idx], ...updates };
  validateQuestion(q);
  quiz.questions[idx] = q;
  quiz.updatedAt = new Date().toISOString();
  await repo.save(quiz);
  return quiz.questions[idx];
}

async function deleteQuestion(quizId, questionIndex) {
  const quiz = await getQuiz(quizId);
  const idx = parseInt(questionIndex, 10);
  if (idx < 0 || idx >= quiz.questions.length) {
    throw Object.assign(new Error('Question not found'), { status: 404 });
  }
  quiz.questions.splice(idx, 1);
  quiz.updatedAt = new Date().toISOString();
  await repo.save(quiz);
}

async function reorderQuestions(quizId, fromIndex, toIndex) {
  const quiz = await getQuiz(quizId);
  const qs = quiz.questions;
  if (fromIndex < 0 || fromIndex >= qs.length || toIndex < 0 || toIndex >= qs.length) {
    throw Object.assign(new Error('Index out of bounds'), { status: 400 });
  }
  const [moved] = qs.splice(fromIndex, 1);
  qs.splice(toIndex, 0, moved);
  quiz.updatedAt = new Date().toISOString();
  await repo.save(quiz);
  return quiz;
}

module.exports = {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  duplicateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
};
