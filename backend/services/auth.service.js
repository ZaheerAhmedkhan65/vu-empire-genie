const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');

class AuthService {

    /* -------------------- SIGNUP -------------------- */
    static async signup(userData) {
        const existingUser = await User.findByEmail(userData.email);

        if (existingUser) {
            if (existingUser.google_id && !existingUser.password) {
                throw new AppError('Please sign in using Google', 409);
            }
            throw new AppError('User already exists', 409);
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newUser = await User.create({
            ...userData,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpires
        });

        const token = this.generateToken(newUser);

        return {
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar
            },
            token,
            message: 'Account created successfully. Please verify your email.'
        };
    }

    /* -------------------- LOGIN -------------------- */
    static async login({ email, password }) {
        const user = await User.findByEmail(email);

        // Unified error → prevents user enumeration
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        if (user.google_id && !user.password) {
            throw new AppError('Please sign in using Google', 400);
        }

        if (!user.email_verified) {
            throw new AppError('Please verify your email first', 403);
        }

        if (user.status === 'blocked') {
            throw new AppError('Account blocked. Contact support.', 403);
        }

        if (user.status === 'deleted') {
            throw new AppError('Account deleted. Contact support.', 403);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password', 401);
        }

        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            },
            token,
            message: 'Signed in successfully'
        };
    }

    /* -------------------- VERIFY EMAIL -------------------- */
    static async verifyEmail(token) {
        const user = await User.findByVerificationToken(token);

        if (!user) {
            throw new AppError('Invalid or expired verification token', 400);
        }

        await User.verifyEmail(user.id);

        return {
            message: 'Email verified successfully'
        };
    }

    /* -------------------- FORGOT PASSWORD -------------------- */
    static async forgotPassword(email) {
        const user = await User.findByEmail(email);

        // Silent success → security best practice
        if (!user) {
            return { message: 'If an account exists, a reset link was sent.' };
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

        await User.setResetToken(email, resetToken, resetTokenExpiry);

        return {
            message: 'Password reset email sent'
        };
    }

    /* -------------------- RESET PASSWORD -------------------- */
    static async resetPassword(token, newPassword) {
        const user = await User.findByResetToken(token);

        if (!user || new Date(user.resetTokenExpiry) < new Date()) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(user.id, hashedPassword);

        return {
            message: 'Password reset successfully'
        };
    }

    /* -------------------- REFRESH TOKEN -------------------- */
    static async refreshToken(oldToken) {
        let decoded;

        try {
            decoded = jwt.verify(oldToken, process.env.SECRET_KEY, {
                ignoreExpiration: true
            });
        } catch {
            throw new AppError('Invalid token', 401);
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new AppError('User no longer exists', 401);
        }

        const newToken = this.generateToken(user);

        return {
            token: newToken,
            message: 'Token refreshed successfully'
        };
    }

    /* -------------------- TOKEN HELPERS -------------------- */
    static generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.SECRET_KEY,
            {
                expiresIn: process.env.JWT_EXPIRY || '7d',
                issuer: process.env.JWT_ISSUER || 'your-app'
            }
        );
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.SECRET_KEY);
        } catch {
            throw new AppError('Invalid token', 401);
        }
    }
}

module.exports = AuthService;