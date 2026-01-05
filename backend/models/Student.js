const db = require('../config/db');

class Student {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM students ORDER BY created_at DESC');
        return rows;
    }

    static async findById(studentId) {
        const [rows] = await db.query('SELECT * FROM students WHERE student_id = ?', [studentId]);
        return rows[0];
    }

    static async findByName(name) {
        const [rows] = await db.query('SELECT * FROM students WHERE student_name LIKE ?', [`%${name}%`]);
        return rows;
    }

    static async create(studentData) {
        const { student_id, student_name } = studentData;
        const [result] = await db.query(
            'INSERT INTO students (student_id, student_name) VALUES (?, ?)',
            [student_id, student_name]
        );
        return { student_id, student_name };
    }

    static async update(studentId, studentData) {
        const { student_name } = studentData;
        const [result] = await db.query(
            'UPDATE students SET student_name = ? WHERE student_id = ?',
            [student_name, studentId]
        );
        return result.affectedRows > 0;
    }

    static async delete(studentId) {
        const [result] = await db.query('DELETE FROM students WHERE student_id = ?', [studentId]);
        return result.affectedRows > 0;
    }

    static async getStudentPerformance(studentId) {
        const [rows] = await db.query(
            `SELECT 
                s.student_id,
                s.student_name,
                COUNT(sa.answer_id) as total_attempts,
                SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_answers,
                ROUND((SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as score_percentage
            FROM students s
            LEFT JOIN student_answers sa ON s.student_id = sa.student_id
            WHERE s.student_id = ?
            GROUP BY s.student_id`,
            [studentId]
        );
        return rows[0];
    }
}

module.exports = Student;