const QuizService = require('../services/quiz.service');

class QuizController {

    static async createMultipleQuizRecords(req, res) {
        const results = await QuizService.createMultipleQuizRecords(req.body.quizData);

        res.status(200).json({
            success: true,
            summary: {
                total: results.totalRecords,
                successful: results.successful,
                failed: results.failed
            },
            details: results.details
        });
    }

    static async getCourseQuestions(req, res) {
        const data = await QuizService.getCourseQuestions(req.params.courseCode);
        res.status(200).json({ success: true, data });
    }

    static async getQuestionBank(req, res) {
        const data = await QuizService.getQuestionBank(req.query.courseCode);
        res.status(200).json({ success: true, data });
    }

    static async getQuestionStatistics(req, res) {
        const stats = await QuizService.getQuestionStatistics();
        res.status(200).json({ success: true, ...stats });
    }

    static async searchQuestions(req, res) {
        const data = await QuizService.searchQuestions(
            req.query.query,
            req.query.courseCode
        );
        res.status(200).json({ success: true, data });
    }
}

module.exports = QuizController;