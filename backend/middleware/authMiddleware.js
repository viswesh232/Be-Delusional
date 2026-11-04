const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Protection Middleware (Must be logged in)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Always load the current database role; never trust a stale JWT role claim.
            req.user = await User.findById(decoded.id).select('_id role firstName lastName email phoneNumber altPhoneNumber address isVerified tokenVersion');
            if (req.user && (decoded.tokenVersion || 0) !== (req.user.tokenVersion || 0)) {
                return res.status(401).json({ message: 'Session expired. Please sign in again.' });
            }

            if (!req.user || !req.user.isVerified) {
                return res.status(401).json({ message: 'Not authorized, account unavailable or not verified' });
            }

            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// 2. Admin Middleware (Must have Admin role)
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }
};



module.exports = { protect, admin };
