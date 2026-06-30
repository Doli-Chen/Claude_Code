const express = require('express');
const router = express.Router();
const quizService = require('../services/QuizService');

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get('/', asyncHandler(async (req, res) => {
  res.json(await quizService.listQuizzes());
}));

router.post('/', asyncHandler(async (req, res) => {
  const quiz = await quizService.createQuiz(req.body);
  res.status(201).json(quiz);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.json(await quizService.getQuiz(req.params.id));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  res.json(await quizService.updateQuiz(req.params.id, req.body));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await quizService.deleteQuiz(req.params.id);
  res.status(204).end();
}));

router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const quiz = await quizService.duplicateQuiz(req.params.id);
  res.status(201).json(quiz);
}));

router.post('/:id/questions', asyncHandler(async (req, res) => {
  const question = await quizService.addQuestion(req.params.id, req.body);
  res.status(201).json(question);
}));

router.put('/:id/questions/:idx', asyncHandler(async (req, res) => {
  res.json(await quizService.updateQuestion(req.params.id, req.params.idx, req.body));
}));

router.delete('/:id/questions/:idx', asyncHandler(async (req, res) => {
  await quizService.deleteQuestion(req.params.id, req.params.idx);
  res.status(204).end();
}));

router.post('/:id/questions/reorder', asyncHandler(async (req, res) => {
  const { fromIndex, toIndex } = req.body;
  res.json(await quizService.reorderQuestions(req.params.id, fromIndex, toIndex));
}));

module.exports = router;
