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

<<<<<<< Updated upstream
    static async findByQuestionText(courseId, questionText) {
        const [rows] = await db.query(
            'SELECT * FROM questions WHERE course_id = ? AND question_text = ?',
            [courseId, questionText]
        );
        return rows[0];
    }

    static async findByCourseAndText(courseId, questionText) {
        const [rows] = await db.query(
            `SELECT * FROM questions 
         WHERE course_id = ? AND question_text = ? 
         LIMIT 1`,
            [courseId, questionText]
        );
        return rows[0];
    }

    static async create(questionData) {
        const { course_id, question_text, explanation, url, timestamp } = questionData;
        const [result] = await db.query(
            'INSERT INTO questions (course_id, question_text, explanation, url, timestamp) VALUES (?, ?, ?, ?, ?)',
            [course_id, question_text, explanation, url, timestamp]
=======
    static async create(questionData) {
        const { course_id, question_text, url, timestamp } = questionData;
        const [result] = await db.query(
            'INSERT INTO questions (course_id, question_text, url, timestamp) VALUES (?, ?, ?, ?)',
            [course_id, question_text, url, timestamp]
>>>>>>> Stashed changes
        );
        return { question_id: result.insertId, ...questionData };
    }

    static async update(id, questionData) {
<<<<<<< Updated upstream
        const { course_id, question_text, explanation, url, timestamp } = questionData;
        const [result] = await db.query(
            'UPDATE questions SET course_id = ?, question_text = ?, explanation = ?, url = ?, timestamp = ? WHERE question_id = ?',
            [course_id, question_text, explanation, url, timestamp, id]
=======
        const { course_id, question_text, url, timestamp } = questionData;
        const [result] = await db.query(
            'UPDATE questions SET course_id = ?, question_text = ?, url = ?, timestamp = ? WHERE question_id = ?',
            [course_id, question_text, url, timestamp, id]
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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

    static async search(query, courseCode){
        const [rows] = await db.query(`
            SELECT 
                q.question_id,
                q.question_text,
                c.course_code,
                c.course_name,
                DATE_FORMAT(q.timestamp, '%Y-%m-%d %H:%i') as added_time,
                GROUP_CONCAT(CASE WHEN o.is_correct = TRUE THEN o.letter END) as correct_answers
            FROM questions q
            JOIN courses c ON q.course_id = c.course_id
            LEFT JOIN options o ON q.question_id = o.question_id
            WHERE q.question_text LIKE ? AND c.course_code = ?
            GROUP BY q.question_id, q.question_text, c.course_code, c.course_name, q.timestamp
            ORDER BY q.timestamp DESC
        `, [`%${query}%`, courseCode]);
        return rows;
=======
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
>>>>>>> Stashed changes
    }
}

module.exports = Question;