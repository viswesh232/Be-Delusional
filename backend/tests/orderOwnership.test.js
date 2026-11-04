const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../models/Order');
const { getOrderById } = require('../controllers/orderController');

function response() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
}

function queryReturning(order) {
    return {
        select() { return this; },
        populate() { return Promise.resolve(order); },
    };
}

test('customer cannot read another customer order by database id', async () => {
    const previousFindOne = Order.findOne;
    const previousFindById = Order.findById;
    const otherCustomerOrder = { _id: 'order-1', user: { _id: 'customer-B' } };
    Order.findOne = () => queryReturning(null);
    Order.findById = () => queryReturning(otherCustomerOrder);
    try {
        const req = { params: { id: 'order-1' }, user: { _id: 'customer-A', role: 'customer' } };
        const res = response();
        await getOrderById(req, res);
        assert.equal(res.statusCode, 403);
        assert.match(res.body.message, /Not authorized/);
    } finally {
        Order.findOne = previousFindOne;
        Order.findById = previousFindById;
    }
});

test('customer can read their own order', async () => {
    const previousFindOne = Order.findOne;
    const previousFindById = Order.findById;
    const ownOrder = { _id: 'order-2', user: { _id: 'customer-A' } };
    Order.findOne = () => queryReturning(null);
    Order.findById = () => queryReturning(ownOrder);
    try {
        const req = { params: { id: 'order-2' }, user: { _id: 'customer-A', role: 'customer' } };
        const res = response();
        await getOrderById(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body, ownOrder);
    } finally {
        Order.findOne = previousFindOne;
        Order.findById = previousFindById;
    }
});

test('admin can read an order belonging to another customer', async () => {
    const previousFindOne = Order.findOne;
    const previousFindById = Order.findById;
    const order = { _id: 'order-3', user: { _id: 'customer-B' } };
    Order.findOne = () => queryReturning(null);
    Order.findById = () => queryReturning(order);
    try {
        const req = { params: { id: 'order-3' }, user: { _id: 'admin-1', role: 'admin' } };
        const res = response();
        await getOrderById(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body, order);
    } finally {
        Order.findOne = previousFindOne;
        Order.findById = previousFindById;
    }
});
