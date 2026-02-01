// authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require("passport");

// Google OAuth login route
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback route
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/login", failureFlash: true }),
    async (req, res) => {
        // Generate JWT like normal login
        const user = req.user;

        const jwt = require("jsonwebtoken");
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
            },
            process.env.SECRET_KEY,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ status: "success", message: "Signed in successfully!" });
    }
);


// Authentication actions
router.post('/create-account', authController.signup);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/logout', authController.logout);

// Email verification
router.get('/verify-email', authController.verifyEmail);

// Password reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;