const Course = require('../models/Course');
const Question = require('../models/Question');
const Option = require('../models/Option');
const Student = require('../models/Student');
const db = require('../config/db');

const normalize = text => text.toLowerCase().replace(/\s+/g, ' ').trim();

class QuizService {

    static async createMultipleQuizRecords(quizData) {
        const results = {
            totalRecords: quizData.length,
            successful: 0,
            failed: 0,
            details: []
        };

        console.log('Creating multiple quiz records...', results.totalRecords);

        for (let i = 0; i < quizData.length; i++) {
            const record = quizData[i];

            try {
                // --- Course ---
                let course = await Course.findByCode(record.courseCode);
                if (!course) {
                    course = await Course.create({
                        course_code: record.courseCode,
                        course_name: record.courseName
                    });
                }

                // --- Student ---
                let student = await Student.findById(record.studentId);
                if (!student) {
                    student = await Student.create({
                        student_id: record.studentId,
                        student_name: record.studentName
                    });
                }

                // --- Normalize question for duplicate check ---
                const normalizedQuestion = normalize(record.question);

                // --- Check duplicate question (case-insensitive, trimmed) ---
                const existingQuestion = await Question.findByCourseAndText(
                    course.course_id,
                    normalizedQuestion
                );

                if (!existingQuestion) {
                    // --- Create question ---
                    const question = await Question.create({
                        course_id: course.course_id,
                        question_text: record.question.trim(),
                        explanation: record.explanation || '',
                        url: record.url || '',
                        timestamp: record.timestamp ? new Date(record.timestamp) : new Date()
                    });

                    // --- Prepare options ---
                    const optionsData = record.options.map((opt, index) => ({
                        question_id: question.question_id,
                        letter: opt.letter,
                        option_text: opt.option_text,      // fixed mapping
                        index: index + 1,                  // optional: store order
                        is_correct: !!opt.is_correct       // fixed mapping
                    }));

                    // --- Insert options ---
                    await Option.createMultiple(optionsData);

                    results.successful++;
                    results.details.push({
                        recordIndex: i,
                        status: 'created',
                        questionId: question.question_id
                    });

                    console.log(`Question created: ${question.question_id}`);
                } else {
                    // --- Skip duplicate ---
                    results.details.push({
                        recordIndex: i,
                        status: 'skipped',
                        questionId: existingQuestion.question_id
                    });

                    console.log(`Duplicate found, skipped: ${existingQuestion.question_id}`);
                }

            } catch (error) {
                results.failed++;
                results.details.push({
                    recordIndex: i,
                    status: 'failed',
                    error: error.message
                });

                console.error(`Error on record ${i}:`, error.message);
            }
        }

        return results;
    }

    static async getCourseQuestions(courseCode) {
        return Question.getCourseQuestions(courseCode);
    }

    static async getQuestionBank(courseCode) {
        return courseCode
            ? Question.getCourseQuestions(courseCode)
            : Question.getQuestionBank();
    }

    static async getQuestionStatistics() {
        const [byCourse] = await db.query(`
            SELECT 
                c.course_code,
                c.course_name,
                COUNT(q.question_id) as total_questions
            FROM courses c
            LEFT JOIN questions q ON c.course_id = q.course_id
            GROUP BY c.course_id
        `);

        const [summary] = await db.query(`
            SELECT 
                COUNT(*) as total_questions,
                COUNT(DISTINCT course_id) as total_courses
            FROM questions
        `);

        return {
            summary: summary[0],
            byCourse
        };
    }

    static async searchQuestions(query, courseCode) {
        return Question.search(query, courseCode);
    }
}

module.exports = QuizService;