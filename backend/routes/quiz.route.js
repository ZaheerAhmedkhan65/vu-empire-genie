const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quiz.controller');
const validate = require('../middlewares/validate');
const quizValidation = require('../validations/quiz.validation');

// Create
router.post('/save', validate(quizValidation.createQuiz), QuizController.createMultipleQuizRecords);

// Read
router.get('/course/:courseCode',
    validate(quizValidation.courseQuestions),
    QuizController.getCourseQuestions
);

router.get('/bank', QuizController.getQuestionBank);
router.get('/statistics', QuizController.getQuestionStatistics);
router.get('/search',
    validate(quizValidation.search),
    QuizController.searchQuestions
);

module.exports = router;