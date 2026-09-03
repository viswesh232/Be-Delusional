const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers', 'orderController.js');
let content = fs.readFileSync(filePath, 'utf8');

const newFunction = `
// ── 2b. RECORD FAILED PAYMENT ────────────────────────────────────────────────
// @route POST /api/orders/record-failed
// Called from frontend when Razorpay fires payment.failed
exports.recordFailedPayment = async (req, res) => {
    try {
        const { orderItems, shippingAddress, couponCode, razorpayOrderId, paymentMethod } = req.body;
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const pricing = await calculateOrderPricing({ orderItems, couponCode, userId: req.user._id });
        const items = pricing.normalizedItems || orderItems.map(i => ({
            name: i.name || 'Product',
            qty: i.qty,
            image: (i.images && i.images[0]) || i.image || '',
            price: i.price,
            product: i.product || i._id,
        }));
        const totalPrice = pricing.totalPrice || orderItems.reduce((a, i) => a + i.price * i.qty, 0);
        const orderId = await generateOrderId();

        const order = new Order({
            user:          req.user._id,
            orderId,
            orderItems:    items,
            shippingAddress: shippingAddress || 'Address not provided',
            totalPrice,
            couponCode:    pricing.couponCode || '',
            couponDiscount: pricing.couponDiscount || 0,
            userDiscount:  pricing.userDiscountAmount || 0,
            status:        'Pending Payment',
            paymentMethod: paymentMethod || 'Online',
            paymentStatus: 'Failed',
            razorpayOrderId: razorpayOrderId || '',
            razorpayPaymentId: '',
            razorpaySignature: '',
        });

        const created = await order.save();
        res.status(201).json({ message: 'Failed payment recorded', order: created });
    } catch (error) {
        console.error('Record failed payment error:', error);
        res.status(500).json({ message: error.message });
    }
};
`;

// Append before module.exports or at end
if (!content.includes('recordFailedPayment')) {
    content = content.trimEnd() + '\n' + newFunction + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS: recordFailedPayment added to orderController.js');
} else {
    console.log('SKIP: already exists');
}
