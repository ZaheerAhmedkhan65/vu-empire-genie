const express = require('express');
const router = express.Router();
const QuizController = require('../controllers/quizController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json') {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'), false);
        }
    }
});

// POST: Create multiple quiz records
router.post('/quiz/save', QuizController.createMultipleQuizRecords);

// POST: Bulk upload from JSON file
router.post('/quiz/save-bulk', upload.single('quizFile'), QuizController.bulkUploadQuizData);

// GET: Get quiz data by student ID
router.get('/quiz/student/:studentId', QuizController.getQuizDataByStudent);

// GET: Get quiz statistics
router.get('/quiz/statistics', QuizController.getQuizStatistics);

// GET: Get all quiz records (for admin purposes)
router.get('/quiz/records', async (req, res) => {
    try {
        const QuizResult = require('../models/QuizResult');
        const records = await QuizResult.findAll();

        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// GET: Get quiz data by course
router.get('/quiz/course/:courseCode', async (req, res) => {
    try {
        const QuizResult = require('../models/QuizResult');
        const { courseCode } = req.params;

        const records = await QuizResult.findByCourse(courseCode);

        res.status(200).json({
            success: true,
            courseCode: courseCode,
            count: records.length,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router;