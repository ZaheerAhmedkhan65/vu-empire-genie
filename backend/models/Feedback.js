const db = require('../config/db');

class Feedback {

    static async upsert(feedbackData) {
        const { user_id, rating, feedback_type, message, contact_email } = feedbackData;
        
        const [result] = await db.query(
            `INSERT INTO feedback 
            (user_id, rating, feedback_type, message, contact_email)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                rating = VALUES(rating),
                feedback_type = VALUES(feedback_type),
                message = VALUES(message),
                contact_email = VALUES(contact_email),
                updated_at = NOW()`,
            [
                user_id,
                rating,
                feedback_type || null,
                message || null,
                contact_email || null
            ]
        );

        return result.insertId || user_id;
    }

    static async getAll() {
        const [rows] = await db.query(`
            SELECT *,
                   (SELECT AVG(rating) FROM feedback) AS avg_rating
            FROM feedback
            ORDER BY created_at DESC
        `);
        return rows;
    }

    static async getByUserId(user_id) {
        const [rows] = await db.query(
            `SELECT * FROM feedback WHERE user_id = ?`,
            [user_id]
        );
        return rows[0];
    }
}

module.exports = Feedback;