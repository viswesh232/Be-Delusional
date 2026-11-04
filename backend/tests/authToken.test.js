const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');

test('JWT contains the user id, role and token version with a finite expiry', () => {
    const previous = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-only-secret-with-sufficient-randomness';
    try {
        const token = generateToken('user-123', 'admin', 4);
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        assert.equal(payload.id, 'user-123');
        assert.equal(payload.role, 'admin');
        assert.equal(payload.tokenVersion, 4);
        assert.ok(payload.exp > payload.iat);
    } finally {
        if (previous === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previous;
    }
});

test('JWT generation refuses to run without a configured secret', () => {
    const previous = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
        assert.throws(() => generateToken('user-123', 'customer'), /JWT_SECRET is not configured/);
    } finally {
        if (previous !== undefined) process.env.JWT_SECRET = previous;
    }
});
