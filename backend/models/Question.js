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

    static async create(questionData) {
        const { course_id, question_text, url, timestamp } = questionData;
        const [result] = await db.query(
            'INSERT INTO questions (course_id, question_text, url, timestamp) VALUES (?, ?, ?, ?)',
            [course_id, question_text, url, timestamp]
        );
        return { question_id: result.insertId, ...questionData };
    }

    static async update(id, questionData) {
        const { course_id, question_text, url, timestamp } = questionData;
        const [result] = await db.query(
            'UPDATE questions SET course_id = ?, question_text = ?, url = ?, timestamp = ? WHERE question_id = ?',
            [course_id, question_text, url, timestamp, id]
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

    static async getQuestionStats(questionId) {
        const [rows] = await db.query(
            `SELECT 
                q.question_id,
                q.question_text,
                COUNT(sa.answer_id) as total_attempts,
                SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
                ROUND((SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as correct_percentage
            FROM questions q
            LEFT JOIN student_answers sa ON q.question_id = sa.question_id
            WHERE q.question_id = ?
            GROUP BY q.question_id`,
            [questionId]
        );
        return rows[0];
    }
}

module.exports = Question;