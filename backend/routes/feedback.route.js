const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedback.controller');
const { createFeedback, validate } = require('../validations/feedback.validation');

// Submit feedback
router.post(
    '/',
    validate(createFeedback),
    FeedbackController.submitFeedback
);

// List all feedbacks
router.get('/', FeedbackController.listFeedback);

// Get a single feedback by ID
router.get('/:id', FeedbackController.getFeedbackById);

module.exports = router;