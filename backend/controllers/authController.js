//authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        console.log('Received signup request');
        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            if (existingUser.google_id && !existingUser.password) {
                return res.status(400).json({ status: 'error', message: 'This account was created using Google. Please sign in using Google instead.' });
            } else {
                return res.status(400).json({ status: 'error', message: 'User already exists with this email! Please choose a different email.' });
            }
        }
        console.log('User does not exist, creating new user...');
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed', hashedPassword);
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        console.log('Verification token generated', verificationToken, verificationTokenExpires);
        // Create the user with default role 'user'
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'user',
            verificationToken,
            verificationTokenExpires,
            emailVerified: true
        });
        console.log('User created', newUser);
        // Send verification email
        const verificationUrl = `${req.protocol}://${req.get('host')}/auth/verify-email?token=${verificationToken}`;
        console.log(verificationUrl);
        
        res.status(201).json({ status: 'success', data: newUser, message: 'Account created successfully! Please check your email for verification.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error creating user' });
    }
}

const verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        // Find user by verification token (checking expiration in the query)
        const user = await User.findByVerificationToken(token);

        if (!user) {
            res.status(400).json({ status: 'error', message: 'Invalid or expired verification token' });
        }

        // Mark email as verified and clear the token
        await User.verifyEmail(user.id);

        res.status(200).json({ status: 'success', message: 'Email verified successfully!' });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ status: 'error', message: 'Error verifying email' });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1️⃣ Find the user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
        }

        // 2️⃣ If the user signed up using Google (google_id present)
        if (user.google_id && !user.password) {
            return res.status(400).json({ status: 'error', message: 'This account was created using Google. Please sign in using Google instead.' });
        }

        // 3️⃣ Check if email is verified
        if (!user.email_verified) {
            return res.status(400).json({ status: 'error', message: 'Your account was created, but your email is not verified. Please check your gmail inbox for verification instructions.' });
        }

        // 4️⃣ Handle blocked or deleted users
        if (user.status === 'blocked') {
            return res.status(400).json({ status: 'error', message: 'Your account has been blocked. Please contact support.' });
        }

        if (user.status === 'deleted') {
            return res.status(400).json({ status: 'error', message: 'Your account has been deleted. Please contact support.' });
        }

        // 5️⃣ Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        if (!isPasswordValid) {
            return res.status(400).json({ status: 'error', message: 'Invalid email or password' });
        }

        // 6️⃣ Generate JWT
        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                avatar: user.avatar,
                role: user.role,
                email: user.email,
            },
            process.env.SECRET_KEY,
            { expiresIn: '7d' }
        );

        // 7️⃣ Set JWT cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ status: 'success', data: user, message: 'Signed in successfully!' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ status: 'error', message: 'Error logging in' });
    }
};


const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ status: 'error', message: 'User not found' }); 
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        await User.setResetToken(user.email, resetToken, resetTokenExpires);

        // Send reset email
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${resetToken}`;
        console.log(resetUrl);
        return res.status(200).json({ status: 'success', message: 'Password reset email sent successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error forgotting password' });
    }
}

const resetPassword = async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;
    try {
        const user = await User.findByResetToken(token);
        if (!user) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear reset token
        await User.updatePassword(user.id, hashedPassword);
        return res.status(200).json({ status: 'success', message: 'Password reset successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error resetting password' });
    }
}

const refreshToken = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY, { ignoreExpiration: true });

        // Verify user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        // Issue a new token with renewed expiration
        const newToken = jwt.sign(
            {
                userId: decoded.userId,
                username: decoded.username,
                role: user.role
            },
            process.env.SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ status: 'success', message: 'Token refreshed successfully!' });
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}


const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ status: 'success', message: 'Logged out successfully!' });
}

module.exports = {
    signup,
    verifyEmail,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword
};