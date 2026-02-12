const Course = require('../models/Course');
const Student = require('../models/Student');
const Question = require('../models/Question');
const Option = require('../models/Option');
const StudentAnswer = require('../models/StudentAnswer');
const db = require('../config/db');

class QuizController {
    /**
     * Create multiple quiz records in a single API call
     * Expected payload format:
     * {
     *   "quizData": [
     *     {
     *       "courseCode": "CS610",
     *       "courseName": "CS610P - Computer Networks (Practical) (Graded Quiz No.3)",
     *       "studentId": "BC240201242",
     *       "studentName": "ZAHEER AHMED KHAN",
     *       "question": "In Wireshark, ________ shows profile name.",
     *       "url": "https://vulms.vu.edu.pk/Quiz/QuizQuestion.aspx?ver=d079d2ee-9f5e-4cef-bb31-7530525fd022",
     *       "timestamp": "2026-01-05T12:01:13.484Z",
     *       "options": [
     *         {"letter": "A", "text": "Menu Bar", "index": 0, "isCorrect": false},
     *         {"letter": "B", "text": "Status Bar", "index": 1, "isCorrect": true},
     *         {"letter": "C", "text": "Title Bar", "index": 2, "isCorrect": false},
     *         {"letter": "D", "text": "Tool Bar", "index": 3, "isCorrect": false}
     *       ],
     *       "selectedOption": "B"
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
                if (!record.selectedOption) errors.push('selectedOption is required');

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

                    // 3. Check if question already exists for this course
                    let question = await Question.findByCourse(course.course_id);
                    question = question.find(q =>
                        q.question_text === record.question &&
                        q.url === record.url
                    );

                    if (!question) {
                        // 4. Create question
                        question = await Question.create({
                            course_id: course.course_id,
                            question_text: record.question,
                            url: record.url,
                            timestamp: new Date(record.timestamp)
                        });

                        // 5. Create options
                        const optionsData = record.options.map(opt => ({
                            question_id: question.question_id,
                            letter: opt.letter,
                            option_text: opt.text,
                            index: opt.index,
                            is_correct: opt.isCorrect || false
                        }));

                        await Option.createMultiple(optionsData);
                    }

                    // 6. Check if student has already answered this question
                    let studentAnswer = await StudentAnswer.findByStudentAndQuestion(
                        record.studentId,
                        question.question_id
                    );

                    // Determine if the selected option is correct
                    const correctOption = await Option.findCorrectOption(question.question_id);
                    const isCorrect = correctOption && correctOption.letter === record.selectedOption;

                    if (!studentAnswer) {
                        // 7. Create student answer
                        studentAnswer = await StudentAnswer.create({
                            question_id: question.question_id,
                            student_id: record.studentId,
                            selected_option_letter: record.selectedOption,
                            is_correct: isCorrect,
                            answered_at: new Date(record.timestamp)
                        });

                        results.successful++;
                        results.details.push({
                            recordIndex: i,
                            status: 'created',
                            questionId: question.question_id,
                            answerId: studentAnswer.answer_id,
                            isCorrect: isCorrect,
                            message: 'Record created successfully'
                        });
                    } else {
                        // Update existing answer if needed
                        if (studentAnswer.selected_option_letter !== record.selectedOption) {
                            await StudentAnswer.update(studentAnswer.answer_id, {
                                selected_option_letter: record.selectedOption,
                                is_correct: isCorrect,
                                answered_at: new Date(record.timestamp)
                            });

                            results.successful++;
                            results.details.push({
                                recordIndex: i,
                                status: 'updated',
                                questionId: question.question_id,
                                answerId: studentAnswer.answer_id,
                                isCorrect: isCorrect,
                                message: 'Existing record updated'
                            });
                        } else {
                            results.successful++;
                            results.details.push({
                                recordIndex: i,
                                status: 'skipped',
                                questionId: question.question_id,
                                answerId: studentAnswer.answer_id,
                                isCorrect: isCorrect,
                                message: 'Record already exists, no changes needed'
                            });
                        }
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
                message: `Processed ${results.totalRecords} records`,
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
     * Get quiz data by student ID
     */
    static async getQuizDataByStudent(req, res) {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID is required'
                });
            }

            const quizResults = await StudentAnswer.getStudentAnswersWithDetails(studentId);

            if (quizResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No quiz data found for this student'
                });
            }

            // Group by course
            const groupedData = quizResults.reduce((acc, result) => {
                const courseKey = result.course_code;
                if (!acc[courseKey]) {
                    acc[courseKey] = {
                        courseCode: result.course_code,
                        courseName: result.course_name,
                        studentId: result.student_id,
                        studentName: result.student_name,
                        totalQuestions: 0,
                        correctAnswers: 0,
                        questions: []
                    };
                }

                acc[courseKey].totalQuestions++;
                if (result.is_correct) acc[courseKey].correctAnswers++;

                acc[courseKey].questions.push({
                    questionId: result.question_id,
                    questionText: result.question_text,
                    url: result.url,
                    selectedOption: result.selected_option_letter,
                    correctOption: result.correct_answer_letter,
                    isCorrect: result.is_correct,
                    answeredAt: result.answered_at
                });

                return acc;
            }, {});

            // Calculate percentages
            Object.keys(groupedData).forEach(courseKey => {
                const courseData = groupedData[courseKey];
                courseData.scorePercentage = courseData.totalQuestions > 0
                    ? Math.round((courseData.correctAnswers / courseData.totalQuestions) * 10000) / 100
                    : 0;
            });

            res.status(200).json({
                success: true,
                studentId: studentId,
                studentName: quizResults[0]?.student_name,
                totalCourses: Object.keys(groupedData).length,
                courses: Object.values(groupedData)
            });

        } catch (error) {
            console.error('Error in getQuizDataByStudent:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Get quiz statistics
     */
    static async getQuizStatistics(req, res) {
        try {
            const { studentId, courseCode } = req.query;

            let statistics = {};

            if (studentId) {
                // Get student statistics
                const student = await Student.findById(studentId);
                if (!student) {
                    return res.status(404).json({
                        success: false,
                        message: 'Student not found'
                    });
                }

                const studentStats = await Student.getStudentPerformance(studentId);
                statistics.student = studentStats;
            }

            if (courseCode) {
                // Get course statistics
                const course = await Course.findByCode(courseCode);
                if (!course) {
                    return res.status(404).json({
                        success: false,
                        message: 'Course not found'
                    });
                }

                const courseStats = await Course.getCourseStats(course.course_id);
                statistics.course = courseStats;
            }

            if (!studentId && !courseCode) {
                // Get overall statistics
                const [courses] = await Course.findAll();
                const [students] = await Student.findAll();

                const totalQuestions = await db.query(
                    'SELECT COUNT(*) as count FROM questions'
                );
                const totalAnswers = await db.query(
                    'SELECT COUNT(*) as count FROM student_answers'
                );

                statistics.overall = {
                    totalCourses: courses.length,
                    totalStudents: students.length,
                    totalQuestions: totalQuestions[0][0].count,
                    totalAnswers: totalAnswers[0][0].count
                };
            }

            res.status(200).json({
                success: true,
                data: statistics
            });

        } catch (error) {
            console.error('Error in getQuizStatistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    /**
     * Bulk upload quiz data from file (optional enhancement)
     */
    static async bulkUploadQuizData(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Parse JSON file
            let quizData;
            try {
                quizData = JSON.parse(req.file.buffer.toString());
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid JSON file format'
                });
            }

            // Reuse the createMultipleQuizRecords logic
            const controller = new QuizController();
            const mockRes = {
                json: (data) => data
            };

            const result = await controller.createMultipleQuizRecords(
                { body: { quizData } },
                mockRes
            );

            res.status(200).json(result);

        } catch (error) {
            console.error('Error in bulkUploadQuizData:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = QuizController;