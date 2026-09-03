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
        const returnReq = await ReturnRequest.findById(req.params.id);
        if (!returnReq) return res.status(404).json({ message: 'Return request not found' });

        returnReq.status = status || returnReq.status;
        if (adminNotes !== undefined) returnReq.adminNotes = adminNotes;
        await returnReq.save();

        // Also sync back to order if relevant
        if (status === 'Completed' || status === 'Rejected' || status === 'Approved') {
            const order = await Order.findById(returnReq.order);
            if (order) {
                if (returnReq.type === 'exchange') {
                    order.exchangeDetails.status = status;
                    if (status === 'Completed') order.status = 'Exchanged';
                } else {
                    order.returnDetails.status = status;
                    if (status === 'Completed') order.status = 'Returned';
                }
                await order.save();
            }
        }

        res.json({ message: 'Return request updated', returnRequest: returnReq });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
