const Feedback = require('../models/Feedback');

class FeedbackService {

    static async submitFeedback(data) {
        console.log('FeedbackService.submitFeedback called with data:', data);
        if (!data.user_id) {
            throw new Error('User ID is required');
        }

        return await Feedback.upsert(data);
    }

    static async listFeedbacks() {
        return await Feedback.getAll();
    }

    static async getUserFeedback(user_id) {
        return await Feedback.getByUserId(user_id);
    }
}

module.exports = FeedbackService;