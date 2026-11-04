const RETURN_TRANSITIONS = Object.freeze({
    Pending: ['Approved', 'Rejected'],
    Approved: ['Pickup Scheduled', 'Rejected'],
    'Pickup Scheduled': ['Inspected', 'Rejected'],
    Inspected: ['Completed', 'Rejected'],
    Completed: [],
    Rejected: [],
});

function canTransitionReturnStatus(currentStatus, nextStatus) {
    return currentStatus === nextStatus || Boolean(RETURN_TRANSITIONS[currentStatus]?.includes(nextStatus));
}

module.exports = { RETURN_TRANSITIONS, canTransitionReturnStatus };
