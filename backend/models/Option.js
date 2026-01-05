const db = require('../config/db');

class Option {
    static async findByQuestionId(questionId) {
        const [rows] = await db.query(
            'SELECT * FROM options WHERE question_id = ? ORDER BY `index`',
            [questionId]
        );
        return rows;
    }

    static async findCorrectOption(questionId) {
        const [rows] = await db.query(
            'SELECT * FROM options WHERE question_id = ? AND is_correct = TRUE',
            [questionId]
        );
        return rows[0];
    }

    static async findById(optionId) {
        const [rows] = await db.query('SELECT * FROM options WHERE option_id = ?', [optionId]);
        return rows[0];
    }

    static async create(optionData) {
        const { question_id, letter, option_text, index, is_correct } = optionData;
        const [result] = await db.query(
            'INSERT INTO options (question_id, letter, option_text, `index`, is_correct) VALUES (?, ?, ?, ?, ?)',
            [question_id, letter, option_text, index, is_correct]
        );
        return { option_id: result.insertId, ...optionData };
    }

    static async createMultiple(optionsData) {
        const values = optionsData.map(opt => [
            opt.question_id,
            opt.letter,
            opt.option_text,
            opt.index,
            opt.is_correct || false
        ]);

        const [result] = await db.query(
            'INSERT INTO options (question_id, letter, option_text, `index`, is_correct) VALUES ?',
            [values]
        );
        return result.affectedRows;
    }

    static async update(optionId, optionData) {
        const { letter, option_text, index, is_correct } = optionData;
        const [result] = await db.query(
            'UPDATE options SET letter = ?, option_text = ?, `index` = ?, is_correct = ? WHERE option_id = ?',
            [letter, option_text, index, is_correct, optionId]
        );
        return result.affectedRows > 0;
    }

    static async delete(optionId) {
        const [result] = await db.query('DELETE FROM options WHERE option_id = ?', [optionId]);
        return result.affectedRows > 0;
    }

    static async deleteByQuestionId(questionId) {
        const [result] = await db.query('DELETE FROM options WHERE question_id = ?', [questionId]);
        return result.affectedRows;
    }
}

module.exports = Option;