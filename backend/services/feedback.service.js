const Feedback = require('../models/Feedback');

class FeedbackService {
    static async submitFeedback(data) {
        // Call the model
        const feedback_id = await Feedback.create(data);
        return feedback_id;
    }

    static async listFeedbacks() {
        const feedbacks = await Feedback.getAll();
        return feedbacks;
    }

    static async getFeedback(feedback_id) {
        return await Feedback.getById(feedback_id);
    }
}

module.exports = FeedbackService;