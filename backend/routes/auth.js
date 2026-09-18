const express = require('express');
const router = express.Router();
const database = require('../database');

router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

        const user = database.findUserByUsername(username);
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });
        if (!database.verifyPassword(password, user.password)) return res.status(401).json({ error: 'Invalid username or password' });

        database.updateLastLogin(user.id);
        database.addLog(user.id, 'User Login', 'system', `${user.username} logged in successfully`, 'general');

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.fullName = user.full_name;

        res.json({
            success: true,
            user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
            redirect: user.role === 'admin' ? '/admin-portal.html' : '/dashboard.html'
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.post('/register', (req, res) => {
    try {
        const { username, password, role, full_name, email, phone } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const result = database.createUser(username, password, role || 'user', full_name || '', email || '', phone || '');
        if (result.success) {
            database.addLog(null, 'User Registered', 'system', `New user "${username}" created`, 'general');
            res.json({ success: true, id: result.id });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

router.post('/logout', (req, res) => {
    try {
        if (req.session.userId) database.addLog(req.session.userId, 'User Logout', 'system', `${req.session.username} logged out`, 'general');
        req.session.destroy(() => {});
        res.json({ success: true });
    } catch (err) { res.json({ success: true }); }
});

router.get('/session', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ loggedIn: true, user: { id: req.session.userId, username: req.session.username, role: req.session.role, full_name: req.session.fullName } });
    } else {
        res.json({ loggedIn: false });
    }
});

router.post('/forgot-password', (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: 'Username or email is required' });

        let user = database.findUserByUsername(username);
        if (!user) user = database.findUserByEmail(username);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const otp = database.generateOTP(user.id);
        database.addLog(user.id, 'OTP Requested', 'system', `Password reset OTP requested`, 'general');

        const responsePayload = {
            success: true,
            message: 'OTP generated and sent to registered contact',
            userId: user.id
        };
        if (process.env.NODE_ENV !== 'production') {
            responsePayload.otp_dev = otp;
        }

        res.json(responsePayload);
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/verify-otp', (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) return res.status(400).json({ error: 'User ID and OTP required' });
        const isValid = database.verifyOTP(userId, otp);
        if (!isValid) return res.status(400).json({ error: 'Invalid or expired OTP' });
        res.json({ success: true, message: 'OTP verified' });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/reset-password', (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) return res.status(400).json({ error: 'User ID and new password required' });
        if (newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
        const result = database.updatePassword(userId, newPassword);
        if (result.success) res.json({ success: true, message: 'Password reset successfully' });
        else res.status(500).json({ error: 'Failed to reset password' });
    } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
