const Joi = require('joi');

const quizValidation = {
    // Create quiz validation
    createQuiz: Joi.object({
        quizData: Joi.array()
            .items(
                Joi.object({
                    courseCode: Joi.string()
                        .required()
                        .messages({
                            'any.required': 'Course code is required'
                        }),
                    courseName: Joi.string()
                        .required()
                        .messages({
                            'any.required': 'Course name is required'
                        }),
                    studentId: Joi.string()
                        .required()
                        .messages({
                            'any.required': 'Student ID is required'
                        }),
                    studentName: Joi.string()
                        .required()
                        .messages({
                            'any.required': 'Student name is required'
                        }),
                    question: Joi.string()
                        .required()
                        .messages({
                            'any.required': 'Question is required'
                        }),
                    explanation: Joi.string()
                        .allow('', null)
                        .optional(),
                    url: Joi.string()
                        .uri()
                        .allow('', null)
                        .optional()
                        .messages({
                            'string.uri': 'URL must be a valid URI'
                        }),
                    timestamp: Joi.date()
                        .required()
                        .messages({
                            'any.required': 'Timestamp is required',
                            'date.base': 'Timestamp must be a valid date'
                        }),
                    options: Joi.array()
                        .items(
                            Joi.object({
                                letter: Joi.string()
                                    .required()
                                    .messages({
                                        'any.required': 'Option letter is required'
                                    }),
                                text: Joi.string()
                                    .required()
                                    .messages({
                                        'any.required': 'Option text is required'
                                    }),
                                index: Joi.number()
                                    .required()
                                    .messages({
                                        'any.required': 'Option index is required',
                                        'number.base': 'Option index must be a number'
                                    }),
                                isCorrect: Joi.boolean()
                                    .required()
                                    .messages({
                                        'any.required': 'Option correctness is required',
                                        'boolean.base': 'isCorrect must be a boolean'
                                    })
                            })
                        )
                        .min(1)
                        .required()
                        .messages({
                            'any.required': 'Options are required',
                            'array.min': 'At least one option is required',
                            'array.base': 'Options must be an array'
                        })
                        .custom((options, helpers) => {
                            if (!options.some(o => o.isCorrect)) {
                                return helpers.message('At least one option must be marked as correct');
                            }
                            return options;
                        })
                })
            )
            .min(1)
            .required()
            .messages({
                'any.required': 'Quiz data is required',
                'array.min': 'At least one quiz record is required',
                'array.base': 'Quiz data must be an array'
            })
    }),

    // Course questions validation
    courseQuestions: Joi.object({
        courseCode: Joi.string()
            .required()
            .messages({
                'any.required': 'Course code is required'
            })
    }),

    // Search validation
    search: Joi.object({
        query: Joi.string()
            .required()
            .messages({
                'any.required': 'Search query is required'
            }),
        courseCode: Joi.string()
            .optional()
            .allow('')
    })
};

// Validation middleware
const validate = (schema) => (req, res, next) => {
    let validationTarget = req.body;

    // For route parameters, validate against req.params
    if (schema === quizValidation.courseQuestions) {
        validationTarget = req.params;
    }
    // For query parameters, validate against req.query
    else if (schema === quizValidation.search) {
        validationTarget = req.query;
    }

    const { error, value } = schema.validate(validationTarget, {
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

    // Assign validated values back to appropriate request property
    if (schema === quizValidation.courseQuestions) {
        req.params = value;
    } else if (schema === quizValidation.search) {
        req.query = value;
    } else {
        req.body = value;
    }

    next();
};

module.exports = {
    ...quizValidation,
    validate
};