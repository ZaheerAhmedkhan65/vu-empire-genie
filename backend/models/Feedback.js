const db = require('../config/db');

class Feedback {
    static async create(feedbackData) {
        const { user_id, rating, feedback_type, message, contact_email } = feedbackData;

        // Insert feedback
        const [result] = await db.query(
            `INSERT INTO feedback (user_id, feedback_type, message, contact_email, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [user_id || null, feedback_type, message, contact_email || null]
        );

        const feedback_id = result.insertId;

        // Insert rating if provided
        if (rating) {
            await db.query(
                `INSERT INTO feedback_rating (feedback_id, user_id, rating, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [feedback_id, user_id || null, rating]
            );
        }

        return feedback_id;
    }

    static async getAll() {
        const [rows] = await db.query(`
            SELECT f.*, 
                   AVG(fr.rating) AS avg_rating
            FROM feedback f
            LEFT JOIN feedback_rating fr ON f.feedback_id = fr.feedback_id
            GROUP BY f.feedback_id
            ORDER BY f.created_at DESC
        `);
        return rows;
    }

    static async getById(feedback_id) {
        const [rows] = await db.query('SELECT * FROM feedback WHERE feedback_id = ?', [feedback_id]);
        return rows[0];
    }
}

module.exports = Feedback;