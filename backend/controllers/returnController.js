const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');

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
        if (['Completed', 'Rejected'].includes(returnReq.status) && returnReq.status !== status) {
            return res.status(409).json({ message: 'This request is already closed' });
        }

        const order = await Order.findById(returnReq.order);
        if (!order) return res.status(404).json({ message: 'Associated order not found' });
        if (status === 'Completed' && returnReq.type === 'return' && order.paymentMethod === 'Online' && order.paymentStatus !== 'Refunded') {
            return res.status(409).json({ message: 'Complete the verified refund before closing this return' });
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
