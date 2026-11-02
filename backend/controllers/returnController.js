const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const Razorpay = require('razorpay');

// @desc  Get all returns & exchanges (Admin)
// @route GET /api/returns
exports.getAllReturns = async (req, res) => {
    try {
        const returns = await ReturnRequest.find({})
            .populate('order', 'orderId createdAt')
            .populate('user', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 });
        res.json(returns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc  Get my return requests (Customer)
// @route GET /api/returns/my
exports.getMyReturns = async (req, res) => {
    try {
        const returns = await ReturnRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(returns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc  Update return/exchange status (Admin)
// @route PUT /api/returns/:id/status
exports.updateReturnStatus = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const allowedStatuses = ['Pending', 'Approved', 'Pickup Scheduled', 'Inspected', 'Completed', 'Rejected'];
        if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid return request status' });
        if (adminNotes !== undefined && (typeof adminNotes !== 'string' || adminNotes.length > 1000)) {
            return res.status(400).json({ message: 'Admin notes must be 1000 characters or fewer' });
        }

        const returnReq = await ReturnRequest.findById(req.params.id);
        if (!returnReq) return res.status(404).json({ message: 'Return request not found' });
        const transitions = {
            Pending: ['Approved', 'Rejected'],
            Approved: ['Pickup Scheduled', 'Rejected'],
            'Pickup Scheduled': ['Inspected', 'Rejected'],
            Inspected: ['Completed', 'Rejected'],
            Completed: [],
            Rejected: [],
        };
        if (returnReq.status !== status && !transitions[returnReq.status]?.includes(status)) {
            return res.status(409).json({ message: `Cannot move a request from ${returnReq.status} to ${status}` });
        }

        const order = await Order.findById(returnReq.order);
        if (!order) return res.status(404).json({ message: 'Associated order not found' });
        if (status === 'Completed' && returnReq.type === 'exchange') {
            return res.status(409).json({
                message: 'Exchange completion is disabled until replacement stock is reserved and a replacement shipment is recorded.',
            });
        }
        if (status === 'Completed' && returnReq.type === 'return' && order.paymentMethod === 'Online' && returnReq.refundStatus !== 'Processed') {
            return res.status(409).json({ message: 'Complete the verified refund before closing this return' });
        }
        if (status === 'Completed' && returnReq.type === 'return' && returnReq.status !== 'Inspected') {
            return res.status(409).json({ message: 'The returned item must be inspected before completion' });
        }

        returnReq.status = status;
        if (adminNotes !== undefined) returnReq.adminNotes = adminNotes;
        await returnReq.save();

        if (returnReq.type === 'exchange') {
            order.exchangeDetails.status = status;
            if (status === 'Completed') order.status = 'Exchanged';
            if (status === 'Rejected') order.status = 'Delivered';
        } else {
            order.returnDetails.status = status === 'Completed' && order.paymentMethod === 'COD' ? 'Completed' : status;
            if (status === 'Completed') {
                order.status = 'Returned';
                if (order.paymentMethod === 'COD') order.returnDetails.status = 'Completed';
            }
            if (status === 'Rejected') order.status = 'Delivered';
        }
        await order.save();

        res.json({ message: 'Return request updated', returnRequest: returnReq });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};

// @desc Create and verify a Razorpay refund for an approved return (Admin)
// @route POST /api/returns/:id/refund
exports.refundReturn = async (req, res) => {
    try {
        const returnReq = await ReturnRequest.findById(req.params.id);
        if (!returnReq) return res.status(404).json({ message: 'Return request not found' });
        if (returnReq.type !== 'return') return res.status(400).json({ message: 'Only return requests can be refunded' });
        if (returnReq.status !== 'Inspected') {
            return res.status(409).json({ message: 'The returned item must be physically received and marked Inspected before refund' });
        }
        if (returnReq.refundStatus === 'Processed') {
            return res.status(409).json({ message: 'This return has already been refunded' });
        }
        const order = await Order.findById(returnReq.order);
        if (!order) return res.status(404).json({ message: 'Associated order not found' });
        if (order.paymentMethod !== 'Online' || order.paymentStatus !== 'Paid' || !order.razorpayPaymentId) {
            return res.status(409).json({ message: 'A captured online payment is required for refund' });
        }
        const amountPaise = Math.round(Number(returnReq.refundAmount) * 100);
        if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
            return res.status(400).json({ message: 'Refund amount is invalid' });
        }
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) return res.status(503).json({ message: 'Payment refund is not configured' });
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const payment = await razorpay.payments.fetch(order.razorpayPaymentId);
        if (payment.status !== 'captured' || payment.currency !== 'INR' || !Number.isSafeInteger(payment.amount)) {
            return res.status(409).json({ message: 'Razorpay does not confirm a captured INR payment' });
        }
        // Reserve refund capacity on the order with one atomic database update.
        // This closes the race where two different item returns could both read the
        // same remaining balance and independently initiate oversized refunds.
        let refund;
        if (returnReq.razorpayRefundId) {
            refund = await razorpay.payments.fetchRefund(order.razorpayPaymentId, returnReq.razorpayRefundId);
        } else {
            const reservation = await Order.findOneAndUpdate(
                {
                    _id: order._id,
                    $expr: {
                        $lte: [
                            { $add: [{ $ifNull: ['$refundReservedPaise', 0] }, amountPaise] },
                            payment.amount,
                        ],
                    },
                },
                { $inc: { refundReservedPaise: amountPaise } },
                { new: true }
            );
            if (!reservation) {
                return res.status(409).json({ message: 'Refund exceeds the remaining captured payment balance' });
            }

            // Claim this return request before calling Razorpay. If a prior attempt
            // reached the provider but lost its response, its reservation stays in
            // place and must be reconciled rather than blindly retried.
            const claimed = await ReturnRequest.findOneAndUpdate(
                {
                    _id: returnReq._id,
                    refundStatus: { $nin: ['Pending', 'Processed'] },
                    razorpayRefundId: { $in: ['', null] },
                },
                { $set: { refundStatus: 'Pending', refundInitiatedAt: new Date() } },
                { new: true }
            );
            if (!claimed) {
                await Order.updateOne({ _id: order._id }, { $inc: { refundReservedPaise: -amountPaise } });
                return res.status(409).json({
                    message: 'A refund is already pending or being reconciled. Do not retry until its Razorpay status is confirmed.',
                });
            }

            refund = await razorpay.payments.refund(order.razorpayPaymentId, {
                amount: amountPaise,
                notes: { returnRequestId: String(returnReq._id), orderId: String(order._id) },
            });
            returnReq.razorpayRefundId = refund.id;
            returnReq.refundStatus = 'Pending';
            returnReq.refundInitiatedAt = claimed.refundInitiatedAt;
            await returnReq.save();
        }

        if (refund.status === 'processed') {
            returnReq.refundStatus = 'Processed';
            returnReq.refundedAt = new Date();
            await returnReq.save();
            const totalRefunded = await ReturnRequest.aggregate([
                { $match: { order: order._id, refundStatus: 'Processed' } },
                { $group: { _id: null, amount: { $sum: '$refundAmount' } } },
            ]);
            if ((totalRefunded[0]?.amount || 0) >= Number(order.totalPrice)) {
                order.paymentStatus = 'Refunded';
                order.returnDetails.status = 'Refunded';
                await order.save();
            }
        }
        return res.json({ message: 'Refund status checked with Razorpay', refundStatus: returnReq.refundStatus, refundId: returnReq.razorpayRefundId });
    } catch (error) {
        console.error('Return refund failed:', error);
        return res.status(502).json({ message: 'Unable to process or verify refund with Razorpay' });
    }
};
