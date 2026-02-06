const Joi = require('joi');

const feedbackValidation = {
    // Create feedback validation
    createFeedback: Joi.object({
        feedback_type: Joi.string()
            .valid('feature', 'bug', 'suggestion', 'compliment', 'other')
            .required()
            .messages({
                'any.required': 'Feedback type is required',
                'any.only': 'Feedback type must be one of: feature, bug, suggestion, compliment, other'
            }),

        message: Joi.string()
            .min(5)
            .required()
            .messages({
                'any.required': 'Message is required',
                'string.min': 'Message must be at least 5 characters long'
            }),

        contact_email: Joi.string()
            .email({ tlds: { allow: false } })
            .optional()
            .allow(null, '')
            .max(255)
            .messages({
                'string.email': 'Please provide a valid email address'
            }),

        rating: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .optional()
            .allow(null)
            .messages({
                'number.base': 'Rating must be a number',
                'number.integer': 'Rating must be an integer',
                'number.min': 'Rating must be at least 1',
                'number.max': 'Rating cannot be more than 5'
            })
    })
};

// Validation middleware
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
    });

    if (error) {
        const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
        }));

        return res.status(400).json({
            error: 'Validation Error',
            details: errors
        });
    }

    req.body = value;
    next();
};

module.exports = {
    ...feedbackValidation,
    validate
};