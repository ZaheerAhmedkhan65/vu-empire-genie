// auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {
    signup: signupValidation,
    signin: signinValidation,
    forgotPassword: forgotPasswordValidation,
    resetPassword: resetPasswordValidation,
    validate
} = require('../validations/auth.validation');
const {
    authLimiter,
    passwordResetLimiter,
    burstLimitMiddleware
} = require('../middlewares/rateLimiter');

router.get('/verify-email', authController.verifyEmail);

router.use(burstLimitMiddleware);
// Authentication actions
router.post('/create-account', authLimiter, validate(signupValidation), authController.signup);
router.post('/login', authLimiter, validate(signinValidation), authController.login);
router.patch('/refresh-token', authController.refreshToken);
router.delete('/logout', authController.logout);

// Password reset
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordValidation), authController.forgotPassword);
router.patch('/reset-password', validate(resetPasswordValidation), authController.resetPassword);

module.exports = router;