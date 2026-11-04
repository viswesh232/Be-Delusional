const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransitionReturnStatus } = require('../utils/returnWorkflow');

test('return workflow permits only the intended forward transitions', () => {
    const allowed = [
        ['Pending', 'Approved'],
        ['Pending', 'Rejected'],
        ['Approved', 'Pickup Scheduled'],
        ['Approved', 'Rejected'],
        ['Pickup Scheduled', 'Inspected'],
        ['Pickup Scheduled', 'Rejected'],
        ['Inspected', 'Completed'],
        ['Inspected', 'Rejected'],
    ];
    for (const [from, to] of allowed) assert.equal(canTransitionReturnStatus(from, to), true, `${from} -> ${to}`);
});

test('return workflow rejects skipped, reversed and terminal transitions', () => {
    const rejected = [
        ['Pending', 'Inspected'],
        ['Approved', 'Completed'],
        ['Pickup Scheduled', 'Completed'],
        ['Completed', 'Pending'],
        ['Rejected', 'Approved'],
    ];
    for (const [from, to] of rejected) assert.equal(canTransitionReturnStatus(from, to), false, `${from} -> ${to}`);
});

test('repeating the current status is idempotently allowed', () => {
    for (const status of ['Pending', 'Approved', 'Pickup Scheduled', 'Inspected', 'Completed', 'Rejected']) {
        assert.equal(canTransitionReturnStatus(status, status), true);
    }
});
