const jwt = require('jsonwebtoken');

const generateToken = (id, role, tokenVersion = 0) => {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Handy: User stays logged in for a month
    });
};

module.exports = generateToken;