require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

            // Get user from the token
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['passwordHash'] }
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('[AUTH ERROR]', error.name, error.message);
            return res.status(401).json({
                message: error.name === 'TokenExpiredError' ? 'Session expired, please login again' : 'Not authorized, token failed',
                error: error.message
            });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'super_admin' || req.user.role === 'campus_admin')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an administrator' });
    }
};

module.exports = { protect, admin };
