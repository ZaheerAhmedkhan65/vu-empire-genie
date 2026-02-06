//authController.js
const AuthService = require('../services/auth.service');

const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const result = await AuthService.signup({ name, email, password });

        saveCookie(res, result.token);

        const verificationUrl = `${req.protocol}://${req.get('host')}/auth/verify-email?token=${result.verificationToken}`;

        res.status(201).json({ ...result });
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
}

const verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const result = await AuthService.verifyEmail(token);

        res.status(200).json({ ...result });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error verifying email' });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await AuthService.login({ email, password });

        saveCookie(res, result.token);

        return res.status(200).json({ ...result });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Error logging in' });
    }
};


const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const result = await AuthService.forgotPassword(email);

        // Send reset email
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password?token=${result.resetToken}`;

        // Send reset email
        // await sendEmail({
        //     to: user.email,
        //     subject: 'Password Reset Request',
        //     template: 'password-reset',
        //     context: {
        //         name: user.name,
        //         resetUrl,
        //         expiryHours: 1
        //     }
        // });

        return res.status(200).json({ ...result });
    } catch (error) {
        return res.status(500).json({ message: 'Error forgotting password' });
    }
}

const resetPassword = async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;
    try {
        const result = await AuthService.resetPassword(token, password);

        // Send confirmation email
        // await sendEmail({
        //     to: user.email,
        //     subject: 'Password Changed Successfully',
        //     template: 'password-changed',
        //     context: {
        //         name: user.name
        //     }
        // });

        return res.status(200).json({ ...result });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password' });
    }
}

const refreshToken = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const result = await AuthService.refreshToken(token);

        saveCookie(res, result.newToken);

        res.status(200).json({ ...result });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

const logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ status: 'success', message: 'Logout successfully!' });
}

function saveCookie(res, token) {
    // Set JWT cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
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