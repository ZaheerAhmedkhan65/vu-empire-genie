const Course = require('../models/Course');
const Question = require('../models/Question');
const Option = require('../models/Option');
const Student = require('../models/Student');
const db = require('../config/db');

class QuizController {
    /**
     * Create multiple quiz questions (without student answers)
     * Expected payload format:
     * {
     *   "quizData": [
     *     {
     *       "courseCode": "CS610",
     *       "courseName": "CS610P - Computer Networks (Practical) (Graded Quiz No.3)",
     *       "question": "In Wireshark, ________ shows profile name.",
     *       "explanation": "Status bar in Wireshark displays the profile name...",
     *       "url": "https://vulms.vu.edu.pk/Quiz/QuizQuestion.aspx?ver=d079d2ee-9f5e-4cef-bb31-7530525fd022",
     *       "timestamp": "2026-01-05T12:01:13.484Z",
     *       "options": [
     *         {"letter": "A", "text": "Menu Bar", "index": 0, "isCorrect": false},
     *         {"letter": "B", "text": "Status Bar", "index": 1, "isCorrect": true},
     *         {"letter": "C", "text": "Title Bar", "index": 2, "isCorrect": false},
     *         {"letter": "D", "text": "Tool Bar", "index": 3, "isCorrect": false}
     *       ]
     *     }
     *   ]
     * }
     */
    static async createMultipleQuizRecords(req, res) {
        try {
            const { quizData } = req.body;

            if (!Array.isArray(quizData) || quizData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'quizData must be a non-empty array'
                });
            }

            // Validate each record
            const validationErrors = [];
            quizData.forEach((record, index) => {
                const errors = [];

                if (!record.courseCode) errors.push('courseCode is required');
                if (!record.courseName) errors.push('courseName is required');
                if (!record.studentId) errors.push('studentId is required');
                if (!record.studentName) errors.push('studentName is required');
                if (!record.question) errors.push('question is required');
                if (!record.options || !Array.isArray(record.options) || record.options.length === 0) {
                    errors.push('options must be a non-empty array');
                }
                // Validate at least one correct option
                const hasCorrectOption = record.options.some(opt => opt.isCorrect);
                if (!hasCorrectOption) {
                    errors.push('At least one option must be marked as correct');
                }

                if (errors.length > 0) {
                    validationErrors.push({
                        recordIndex: index,
                        errors: errors
                    });
                }
            });

            if (validationErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            // Process all records
            const results = {
                totalRecords: quizData.length,
                successful: 0,
                failed: 0,
                details: []
            };

            for (let i = 0; i < quizData.length; i++) {
                const record = quizData[i];

                try {
                    // 1. Create or get course
                    let course = await Course.findByCode(record.courseCode);
                    if (!course) {
                        course = await Course.create({
                            course_code: record.courseCode,
                            course_name: record.courseName
                        });
                    }

                    // 2. Create or get student
                    let student = await Student.findById(record.studentId);
                    if (!student) {
                        student = await Student.create({
                            student_id: record.studentId,
                            student_name: record.studentName
                        });
                    }

                    // 2. Check if question already exists for this course
                    let question = await Question.findByQuestionText(course.course_id, record.question);

                    if (!question) {
                        // 3. Create question with explanation
                        question = await Question.create({
                            course_id: course.course_id,
                            question_text: record.question,
                            explanation: record.solution?.explanation || record.explanation || '',
                            url: record.url,
                            timestamp: new Date(record.timestamp)
                        });

                        // 4. Create options
                        const optionsData = record.options.map(opt => ({
                            question_id: question.question_id,
                            letter: opt.letter,
                            option_text: opt.text,
                            index: opt.index,
                            is_correct: opt.isCorrect || false
                        }));

                        await Option.createMultiple(optionsData);

                        results.successful++;
                        results.details.push({
                            recordIndex: i,
                            status: 'created',
                            questionId: question.question_id,
                            message: 'Question added to question bank'
                        });
                    } else {
                        results.successful++;
                        results.details.push({
                            recordIndex: i,
                            status: 'skipped',
                            questionId: question.question_id,
                            message: 'Question already exists in question bank'
                        });
                    }

                } catch (error) {
                    console.error(`Error processing record ${i}:`, error);
                    results.failed++;
                    results.details.push({
                        recordIndex: i,
                        status: 'failed',
                        error: error.message,
                        message: 'Failed to process record'
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: `Processed ${results.totalRecords} quiz questions`,
                summary: {
                    total: results.totalRecords,
                    successful: results.successful,
                    failed: results.failed
                },
                details: results.details
            });

        } catch (error) {
            console.error('Error in createMultipleQuizRecords:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get all questions for a course
     */
    static async getCourseQuestions(req, res) {
        try {
            const { courseCode } = req.params;

            if (!courseCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Course code is required'
                });
            }

            const questions = await Question.getCourseQuestions(courseCode);

            if (questions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No questions found for this course'
                });
            }

            res.status(200).json({
                success: true,
                courseCode: courseCode,
                count: questions.length,
                data: questions
            });

        } catch (error) {
            console.error('Error in getCourseQuestions:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get complete question bank
     */
    static async getQuestionBank(req, res) {
        try {
            const { courseCode } = req.query;
            let questionBank;

            if (courseCode) {
                // Get questions for specific course
                questionBank = await Question.getCourseQuestions(courseCode);
            } else {
                // Get all questions
                questionBank = await Question.getQuestionBank();
            }

            if (questionBank.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No questions found in the question bank'
                });
            }

            res.status(200).json({
                success: true,
                count: questionBank.length,
                data: questionBank
            });

        } catch (error) {
            console.error('Error in getQuestionBank:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get question statistics
     */
    static async getQuestionStatistics(req, res) {
        try {
            const [stats] = await db.query(
                `SELECT 
                    c.course_code,
                    c.course_name,
                    COUNT(q.question_id) as total_questions,
                    COUNT(DISTINCT DATE(q.timestamp)) as days_with_questions,
                    MIN(q.timestamp) as first_question_date,
                    MAX(q.timestamp) as latest_question_date
                FROM courses c
                LEFT JOIN questions q ON c.course_id = q.course_id
                GROUP BY c.course_id
                ORDER BY total_questions DESC`
            );

            // Get total counts
            const [totalCounts] = await db.query(
                `SELECT 
                    COUNT(*) as total_questions,
                    COUNT(DISTINCT course_id) as total_courses
                FROM questions`
            );

            res.status(200).json({
                success: true,
                summary: totalCounts[0],
                byCourse: stats
            });

        } catch (error) {
            console.error('Error in getQuestionStatistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Search questions
     */
    static async searchQuestions(req, res) {
        try {
            const { query, courseCode } = req.query;

            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            let sql = `
                SELECT 
                    q.question_id,
                    q.course_id,
                    q.question_text,
                    q.explanation,
                    q.url,
                    q.timestamp,
                    c.course_code,
                    c.course_name,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'letter', o.letter,
                            'option_text', o.option_text,
                            'is_correct', o.is_correct
                        )
                    ) AS options
                FROM questions q
                JOIN courses c ON q.course_id = c.course_id
                LEFT JOIN options o ON q.question_id = o.question_id
                WHERE (q.question_text LIKE ? OR q.explanation LIKE ?)
            `;

            const params = [`%${query}%`, `%${query}%`];

            if (courseCode) {
                sql += ' AND c.course_code = ?';
                params.push(courseCode);
            }

            sql += `
                GROUP BY 
                    q.question_id,
                    q.course_id,
                    q.question_text,
                    q.explanation,
                    q.url,
                    q.timestamp,
                    c.course_code,
                    c.course_name
                ORDER BY q.timestamp DESC
            `;

            const [questions] = await db.query(sql, params);

            res.status(200).json({
                success: true,
                query: query,
                count: questions.length,
                data: questions
            });

        } catch (error) {
            console.error('Error in searchQuestions:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = QuizController;