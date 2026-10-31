const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');

const secret = 'test-only-secret-with-sufficient-randomness';

function response() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
}

function request(token) {
    return { headers: token ? { authorization: `Bearer ${token}` } : {} };
}

test('protect uses the current MongoDB role, not the JWT role claim', async () => {
    const previousSecret = process.env.JWT_SECRET;
    const previousFindById = User.findById;
    process.env.JWT_SECRET = secret;
    User.findById = () => ({ select: async () => ({
        _id: 'customer-1', role: 'customer', isVerified: true, tokenVersion: 0,
    }) });
    try {
        const token = jwt.sign({ id: 'customer-1', role: 'admin', tokenVersion: 0 }, secret);
        const req = request(token);
        const res = response();
        let nextCalled = false;
        await protect(req, res, () => { nextCalled = true; });
        assert.equal(nextCalled, true);
        assert.equal(req.user.role, 'customer');
        admin(req, res, () => { throw new Error('Customer must not reach admin handler'); });
        assert.equal(res.statusCode, 403);
    } finally {
        User.findById = previousFindById;
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    }
});

test('protect rejects an invalidated token version', async () => {
    const previousSecret = process.env.JWT_SECRET;
    const previousFindById = User.findById;
    process.env.JWT_SECRET = secret;
    User.findById = () => ({ select: async () => ({
        _id: 'customer-1', role: 'customer', isVerified: true, tokenVersion: 3,
    }) });
    try {
        const token = jwt.sign({ id: 'customer-1', tokenVersion: 2 }, secret);
        const res = response();
        await protect(request(token), res, () => { throw new Error('Invalidated token must not pass'); });
        assert.equal(res.statusCode, 401);
        assert.match(res.body.message, /Session expired/);
    } finally {
        User.findById = previousFindById;
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    }
});

test('protect rejects missing authentication', async () => {
    const res = response();
    await protect(request(null), res, () => { throw new Error('Anonymous request must not pass'); });
    assert.equal(res.statusCode, 401);
});
