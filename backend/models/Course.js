const db = require('../config/db');

class Course {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM courses ORDER BY created_at DESC');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM courses WHERE course_id = ?', [id]);
        return rows[0];
    }

    static async findByCode(courseCode) {
        const [rows] = await db.query('SELECT * FROM courses WHERE course_code = ?', [courseCode]);
        return rows[0];
    }

    static async create(courseData) {
        const { course_code, course_name } = courseData;
        const [result] = await db.query(
            'INSERT INTO courses (course_code, course_name) VALUES (?, ?)',
            [course_code, course_name]
        );
        return { course_id: result.insertId, course_code, course_name };
    }

    static async update(id, courseData) {
        const { course_code, course_name } = courseData;
        const [result] = await db.query(
            'UPDATE courses SET course_code = ?, course_name = ? WHERE course_id = ?',
            [course_code, course_name, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM courses WHERE course_id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getCourseStats(courseId) {
        const [rows] = await db.query(
            `SELECT 
                c.course_id,
                c.course_code,
                c.course_name,
                COUNT(DISTINCT q.question_id) as total_questions,
                COUNT(DISTINCT s.student_id) as total_students
            FROM courses c
            LEFT JOIN questions q ON c.course_id = q.course_id
            LEFT JOIN student_answers sa ON q.question_id = sa.question_id
            LEFT JOIN students s ON sa.student_id = s.student_id
            WHERE c.course_id = ?
            GROUP BY c.course_id`,
            [courseId]
        );
        return rows[0];
    }
}

module.exports = Course;