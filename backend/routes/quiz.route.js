const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quiz.controller');
const { createQuiz, courseQuestions, search, validate } = require('../validations/quiz.validation');

// Create
router.post('/save', validate(createQuiz), QuizController.createMultipleQuizRecords);

// Read
router.get('/course/:courseCode',
    validate(courseQuestions),
    QuizController.getCourseQuestions
);

router.get('/bank', QuizController.getQuestionBank);
router.get('/statistics', QuizController.getQuestionStatistics);
router.get('/search',
    validate(search),
    QuizController.searchQuestions
);

module.exports = router;