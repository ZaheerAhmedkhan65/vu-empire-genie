const FeedbackService = require('../services/feedback.service');

class FeedbackController {

    static async submit(req, res) {
        try {
            const {
                user_id,
                rating,
                feedback_type,
                message,
                contact_email
            } = req.body;
            console.log('Submitting feedback for user_id:', user_id);
            const feedback_id = await FeedbackService.submitFeedback({
                user_id,
                rating: Number(rating),
                feedback_type,
                message,
                contact_email
            });

            res.status(200).json({
                success: true,
                message: 'Feedback saved successfully',
                feedback_id
            });

        } catch (err) {
            res.status(400).json({
                success: false,
                message: err.message
            });
        }
    }

    static async list(req, res) {
        try {
            const feedbacks = await FeedbackService.listFeedbacks();
            res.json(feedbacks);
        } catch (err) {
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