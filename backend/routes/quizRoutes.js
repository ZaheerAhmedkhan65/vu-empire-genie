const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quizController');

// POST: Save quiz questions to question bank
router.post('/quiz/save', QuizController.createMultipleQuizRecords);

// GET: Get questions for a specific course
router.get('/quiz/course/:courseCode', QuizController.getCourseQuestions);

// GET: Get question bank (all questions or filtered by course)
router.get('/quiz/bank', QuizController.getQuestionBank);

// GET: Get question statistics
router.get('/quiz/statistics', QuizController.getQuestionStatistics);

// GET: Search questions
router.get('/quiz/search', QuizController.searchQuestions);

module.exports = router;