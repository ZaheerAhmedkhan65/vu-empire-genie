const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { stat } = require('fs');
// const { sendEmail } = require('../utils/emailService');

class AuthService {

    static async signup(userData) {
        try {
            // Check if user already exists
            const existingUser = await User.findByEmail(userData.email);

            if (existingUser) {
                if (existingUser.google_id && !existingUser.password) {
                    return { status: 'error', message: 'Please sign in using Google instead.' };
                } else {
                    return { status: 'error', message: 'User already exists' };
                }
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Generate verification token
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Create the user
            const newUser = await User.create({
                ...userData,
                password: hashedPassword,
                verificationToken,
                verificationTokenExpires
            });

            // Generate JWT token
            const token = this.generateToken(newUser);

            return {
                status: 'success',
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    avatar: newUser.avatar
                },
                message: 'Account created successfully! Please check your email for verification.',
                token,
                verificationToken
            };
        } catch (error) {
            throw new Error(`Signup failed: ${error.message}`);
        }
    }

    static async login(credentials) {
        try {
            // Find the user
            const user = await User.findByEmail(credentials.email);

            if (!user) {
                return { status: 'error', message: 'User not found' };
            }

            // If the user signed up using Google (google_id present)
            if (user.google_id && !user.password) {
                return { status: 'error', message: 'Please sign in using Google instead.' };
            }

            // Check if email is verified
            if (!user.email_verified) {
                return { status: 'error', message: 'Please verify your email first.' };
            }

            // Handle blocked or deleted users
            if (user.status === 'blocked') {
                return { status: 'error', message: 'Your account has been blocked. Please contact support.' };
            }

            if (user.status === 'deleted') {
                return { status: 'error', message: 'Your account has been deleted. Please contact support.' };
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            if (!isPasswordValid) {
                return { status: 'error', message: 'Invalid password!' }
            }

            // Generate JWT token
            const token = this.generateToken(user);

            return {
                status: 'success',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                message: 'Signed in successfully!',
                token
            };
        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    static async verifyEmail(token) {
        try {
            // Find user by verification token (checking expiration in the query)
            const user = await User.findByVerificationToken(token);

            if (!user) {
                return { status: 'error', message: 'Invalid or expired verification token' };
            }

            // Mark email as verified and clear the token
            await User.verifyEmail(user.id);

            return {
                status: 'success',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                message: 'Email verified successfully!'
            };
        } catch (error) {
            throw new Error('Email verification failed');
        }
    }

    static async forgotPassword(email) {
        try {
            const user = await User.findByEmail(email);
            if (!user) {
                return { status: 'error', message: 'If an account exists with this email, you will receive a reset link.' }
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

            // Save token to database
            await User.setResetToken(user.email, resetToken, resetTokenExpiry);

            return {
                status: 'success',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                message: 'Password reset email sent successfully!',
                resetToken,
                resetTokenExpiry
            };
        } catch (error) {
            throw new Error(`Password reset failed: ${error.message}`);
        }
    }

    static async resetPassword(token, newPassword) {
        try {
            // Find user by valid token
            const user = await User.findByResetToken(token);
            if (!user) {
                return { status: 'error', message: 'Invalid or expired reset token' };
            }

            // Check if token has expired
            if (new Date(user.resetTokenExpiry) < new Date()) {
                return { status: 'error', message: 'Reset token has expired' };
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear reset token
            await User.updatePassword(user.id, hashedPassword);

            return {
                status: 'success',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                message: 'Password reset successfully!'
            };
        } catch (error) {
            throw new Error(`Password reset failed: ${error.message}`);
        }
    }

    static async refreshToken(oldToken) {
        try {
            const decoded = jwt.verify(oldToken, process.env.SECRET_KEY, { ignoreExpiration: true });

            // Verify user still exists
            const user = await User.findById(decoded.userId);
            if (!user) {
                return { status: 'error', message: 'User no longer exists' };
            }

            // Generate new token
            const newToken = this.generateToken(user);

            return {
                status: 'success',
                token: newToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                },
                message: 'Token refreshed successfully!'
            };
        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }

    static generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role
            },
            process.env.SECRET_KEY,
            {
                expiresIn: process.env.JWT_EXPIRY || '7d',
                issuer: process.env.JWT_ISSUER || 'your-app-name'
            }
        );
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.SECRET_KEY);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = AuthService;