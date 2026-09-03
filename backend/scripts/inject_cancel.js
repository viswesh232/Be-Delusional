const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers', 'orderController.js');
let content = fs.readFileSync(filePath, 'utf8');

const newFunction = `
// ── USER CANCEL ORDER ────────────────────────────────────────────────
// @route PUT /api/orders/:id/cancel
exports.userCancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        if (['Delivered', 'Shipped', 'Cancelled'].includes(order.status)) {
            return res.status(400).json({ message: 'Cannot cancel an order at this stage' });
        }

        order.status = 'Cancelled';
        const updated = await order.save();
        res.json(updated);
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: error.message });
    }
};
`;

if (!content.includes('userCancelOrder')) {
    content = content.trimEnd() + '\n' + newFunction + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: userCancelOrder added');
} else {
    console.log('SKIP: userCancelOrder exists');
}
