const Joi = require('joi');

const quizOptionSchema = Joi.object({
    letter: Joi.string().required(),
    text: Joi.string().required(),
    index: Joi.number().required(),
    isCorrect: Joi.boolean().required()
});

const quizRecordSchema = Joi.object({
    courseCode: Joi.string().required(),
    courseName: Joi.string().required(),
    studentId: Joi.string().required(),
    studentName: Joi.string().required(),
    question: Joi.string().required(),
    explanation: Joi.string().allow('', null),
    url: Joi.string().uri().allow('', null),
    timestamp: Joi.date().required(),
    options: Joi.array()
        .items(quizOptionSchema)
        .min(1)
        .required()
        .custom((options, helpers) => {
            if (!options.some(o => o.isCorrect)) {
                return helpers.error('any.custom');
            }
            return options;
        }, 'At least one correct option')
});

module.exports = {
    createQuiz: {
        body: Joi.object({
            quizData: Joi.array().items(quizRecordSchema).min(1).required()
        })
    },

    courseQuestions: {
        params: Joi.object({
            courseCode: Joi.string().required()
        })
    },

    search: {
        query: Joi.object({
            query: Joi.string().required(),
            courseCode: Joi.string().optional()
        })
    }
};