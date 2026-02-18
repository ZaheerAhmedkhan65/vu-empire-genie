const db = require('../config/db');

class QuizResult {
    static async findAll() {
        const [rows] = await db.query('SELECT * FROM quiz_results_view ORDER BY answered_at DESC');
        return rows;
    }

    static async findByStudent(studentId) {
        const [rows] = await db.query(
            'SELECT * FROM quiz_results_view WHERE student_id = ? ORDER BY answered_at DESC',
            [studentId]
        );
        return rows;
    }

    static async findByCourse(courseCode) {
        const [rows] = await db.query(
            'SELECT * FROM quiz_results_view WHERE course_code = ? ORDER BY answered_at DESC',
            [courseCode]
        );
        return rows;
    }

    static async findByStudentAndCourse(studentId, courseCode) {
        const [rows] = await db.query(
            'SELECT * FROM quiz_results_view WHERE student_id = ? AND course_code = ? ORDER BY answered_at DESC',
            [studentId, courseCode]
        );
        return rows;
    }

    static async getStudentSummary(studentId) {
        const [rows] = await db.query(
            `SELECT 
                student_id,
                student_name,
                COUNT(*) as total_questions,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
                ROUND((SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as score_percentage,
                COUNT(DISTINCT course_code) as courses_attempted
            FROM quiz_results_view
            WHERE student_id = ?
            GROUP BY student_id, student_name`,
            [studentId]
        );
        return rows[0];
    }

    static async getCourseSummary(courseCode) {
        const [rows] = await db.query(
            `SELECT 
                course_code,
                course_name,
                COUNT(*) as total_attempts,
                COUNT(DISTINCT student_id) as total_students,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
                ROUND((SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as average_score
            FROM quiz_results_view
            WHERE course_code = ?
            GROUP BY course_code, course_name`,
            [courseCode]
        );
        return rows[0];
    }
}

module.exports = QuizResult;