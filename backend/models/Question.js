const db = require('../config/db');

class Question {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM questions ORDER BY timestamp DESC');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM questions WHERE question_id = ?', [id]);
        return rows[0];
    }

    static async findByCourse(courseId) {
        const [rows] = await db.query(
            'SELECT * FROM questions WHERE course_id = ? ORDER BY timestamp DESC',
            [courseId]
        );
        return rows;
    }

    static async findByQuestionText(courseId, questionText) {
        const [rows] = await db.query(
            'SELECT * FROM questions WHERE course_id = ? AND question_text = ?',
            [courseId, questionText]
        );
        return rows[0];
    }

    static async create(questionData) {
        const { course_id, question_text, explanation, url, timestamp } = questionData;
        const [result] = await db.query(
            'INSERT INTO questions (course_id, question_text, explanation, url, timestamp) VALUES (?, ?, ?, ?, ?)',
            [course_id, question_text, explanation, url, timestamp]
        );
        return { question_id: result.insertId, ...questionData };
    }

    static async update(id, questionData) {
        const { course_id, question_text, explanation, url, timestamp } = questionData;
        const [result] = await db.query(
            'UPDATE questions SET course_id = ?, question_text = ?, explanation = ?, url = ?, timestamp = ? WHERE question_id = ?',
            [course_id, question_text, explanation, url, timestamp, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM questions WHERE question_id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getQuestionWithOptions(questionId) {
        const [rows] = await db.query(
            `SELECT 
                q.*,
                c.course_code,
                c.course_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'option_id', o.option_id,
                        'letter', o.letter,
                        'option_text', o.option_text,
                        'index', o.index,
                        'is_correct', o.is_correct
                    )
                ) as options
            FROM questions q
            JOIN courses c ON q.course_id = c.course_id
            LEFT JOIN options o ON q.question_id = o.question_id
            WHERE q.question_id = ?
            GROUP BY q.question_id`,
            [questionId]
        );
        return rows[0];
    }

    static async getCourseQuestions(courseCode) {
        const [rows] = await db.query(
            `SELECT 
                q.*,
                c.course_code,
                c.course_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'letter', o.letter,
                        'option_text', o.option_text,
                        'is_correct', o.is_correct
                    )
                ) as options
            FROM questions q
            JOIN courses c ON q.course_id = c.course_id
            LEFT JOIN options o ON q.question_id = o.question_id
            WHERE c.course_code = ?
            GROUP BY q.question_id
            ORDER BY q.timestamp DESC`,
            [courseCode]
        );
        return rows;
    }

    static async getQuestionBank() {
        const [rows] = await db.query('SELECT * FROM question_bank_view ORDER BY course_code, question_added DESC');
        return rows;
    }
}

module.exports = Question;