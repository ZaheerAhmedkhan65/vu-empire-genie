//config/app.js
const express = require('express');
const cors = require('cors');
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const methodOverride = require("method-override");
const quizRoutes = require('../routes/quiz.route');
const authRoutes = require('../routes/auth.route');
const feedbackRoutes = require('../routes/feedback.route');
const multer = require('multer');
const path = require('path');

const app = express();

require("dotenv").config();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', async (req, res) => {
    try {
        const db = require('./db');

        // Get overall statistics
        const [overallStats] = await db.query(`
            SELECT 
                COUNT(DISTINCT c.course_id) as total_courses,
                COUNT(q.question_id) as total_questions,
                COUNT(DISTINCT DATE(q.timestamp)) as days_active,
                MIN(q.timestamp) as first_question_date,
                MAX(q.timestamp) as latest_question_date
            FROM courses c
            LEFT JOIN questions q ON c.course_id = q.course_id
        `);

        // Get course-wise statistics
        const [courseStats] = await db.query(`
            SELECT 
                c.course_code,
                c.course_name,
                COUNT(q.question_id) as question_count,
                DATE_FORMAT(MAX(q.timestamp), '%Y-%m-%d %H:%i') as last_updated,
                COUNT(DISTINCT DATE(q.timestamp)) as days_active
            FROM courses c
            LEFT JOIN questions q ON c.course_id = q.course_id
            GROUP BY c.course_id
            ORDER BY question_count DESC, c.course_code
        `);

        // Get recent questions
        // In config/app.js, replace the recentQuestions query with this:
        const [recentQuestions] = await db.query(`
            SELECT 
                q.question_id,
                q.question_text,
                LEFT(q.question_text, 100) as question_preview,
                c.course_code,
                c.course_name,
                DATE_FORMAT(q.timestamp, '%Y-%m-%d %H:%i') as added_time,
                GROUP_CONCAT(CASE WHEN o.is_correct = TRUE THEN o.letter END) as correct_answers
            FROM questions q
            JOIN courses c ON q.course_id = c.course_id
            LEFT JOIN options o ON q.question_id = o.question_id
            GROUP BY q.question_id, q.question_text, c.course_code, c.course_name, q.timestamp
            ORDER BY q.timestamp DESC
            LIMIT 10
        `);

        // Get daily question counts for chart
        const [dailyStats] = await db.query(`
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as question_count
            FROM questions
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(timestamp)
            ORDER BY date
        `);

        res.render('index', {
            title: 'Quiz Question Bank - Statistics',
            overallStats: overallStats[0] || {},
            courseStats: courseStats || [],
            recentQuestions: recentQuestions || [],
            dailyStats: dailyStats || [],
            currentYear: new Date().getFullYear()
        });
    } catch (error) {
        console.error('Error rendering home page:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : ''
        });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON format',
            error: err.message
        });
    }
    next(err);
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Quiz API'
    });
});

// Error handling middleware
// In your error handler middleware in config/app.js, update to:
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: 'File upload error',
            error: err.message
        });
    }

    // Render error page for HTML requests
    if (req.accepts('html')) {
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Something went wrong on our end',
            error: process.env.NODE_ENV === 'development' ? err.message : '',
            overallStats: { total_questions: 0, total_courses: 0 }, // Add default stats
            currentYear: new Date().getFullYear()
        });
    } else {
        // JSON response for API requests
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

module.exports = app