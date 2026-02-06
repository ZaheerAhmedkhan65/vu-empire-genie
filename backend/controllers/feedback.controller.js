const FeedbackService = require('../services/feedback.service');

class FeedbackController {
    static async submitFeedback(req, res) {
        try {
            const user_id = req.user?.id || null; // if user is logged in
            const { feedback_type, message, contact_email, rating } = req.body;

            const feedback_id = await FeedbackService.submitFeedback({
                user_id,
                feedback_type,
                message,
                contact_email,
                rating
            });

            res.status(201).json({ message: 'Feedback submitted successfully', feedback_id });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async listFeedback(req, res) {
        try {
            const feedbacks = await FeedbackService.listFeedbacks();
            res.json(feedbacks);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }

    static async getFeedbackById(req, res) {
        try {
            const feedback = await FeedbackService.getFeedback(req.params.id);
            if (!feedback) {
                return res.status(404).json({ message: 'Feedback not found' });
            }
            res.json(feedback);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = FeedbackController;