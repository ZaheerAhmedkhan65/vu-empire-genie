const db = require('../config/db');

class StudentAnswer {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM student_answers ORDER BY answered_at DESC');
        return rows;
    }

    static async findById(answerId) {
        const [rows] = await db.query('SELECT * FROM student_answers WHERE answer_id = ?', [answerId]);
        return rows[0];
    }

    static async findByStudentAndQuestion(studentId, questionId) {
        const [rows] = await db.query(
            'SELECT * FROM student_answers WHERE student_id = ? AND question_id = ?',
            [studentId, questionId]
        );
        return rows[0];
    }

    static async findByStudent(studentId) {
        const [rows] = await db.query(
            'SELECT * FROM student_answers WHERE student_id = ? ORDER BY answered_at DESC',
            [studentId]
        );
        return rows;
    }

    static async findByQuestion(questionId) {
        const [rows] = await db.query(
            'SELECT * FROM student_answers WHERE question_id = ? ORDER BY answered_at DESC',
            [questionId]
        );
        return rows;
    }

    static async create(answerData) {
        const { question_id, student_id, selected_option_letter, is_correct, answered_at } = answerData;
        const [result] = await db.query(
            'INSERT INTO student_answers (question_id, student_id, selected_option_letter, is_correct, answered_at) VALUES (?, ?, ?, ?, ?)',
            [question_id, student_id, selected_option_letter, is_correct, answered_at]
        );
        return { answer_id: result.insertId, ...answerData };
    }

    static async update(answerId, answerData) {
        const { selected_option_letter, is_correct, answered_at } = answerData;
        const [result] = await db.query(
            'UPDATE student_answers SET selected_option_letter = ?, is_correct = ?, answered_at = ? WHERE answer_id = ?',
            [selected_option_letter, is_correct, answered_at, answerId]
        );
        return result.affectedRows > 0;
    }

    static async delete(answerId) {
        const [result] = await db.query('DELETE FROM student_answers WHERE answer_id = ?', [answerId]);
        return result.affectedRows > 0;
    }

    static async getStudentAnswersWithDetails(studentId) {
        const [rows] = await db.query(
            `SELECT 
                sa.*,
                q.question_text,
                q.url,
                c.course_code,
                c.course_name,
                o_correct.letter as correct_answer_letter,
                o_correct.option_text as correct_answer_text
            FROM student_answers sa
            JOIN questions q ON sa.question_id = q.question_id
            JOIN courses c ON q.course_id = c.course_id
            LEFT JOIN options o_correct ON q.question_id = o_correct.question_id AND o_correct.is_correct = TRUE
            WHERE sa.student_id = ?
            ORDER BY sa.answered_at DESC`,
            [studentId]
        );
        return rows;
    }

    static async getCourseAnswers(studentId, courseId) {
        const [rows] = await db.query(
            `SELECT 
                sa.*,
                q.question_text
            FROM student_answers sa
            JOIN questions q ON sa.question_id = q.question_id
            WHERE sa.student_id = ? AND q.course_id = ?
            ORDER BY sa.answered_at DESC`,
            [studentId, courseId]
        );
        return rows;
    }
}

module.exports = StudentAnswer;