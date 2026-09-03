const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    orderItems: [{
        name:    { type: String, required: true },
        qty:     { type: Number, required: true },
        image:   { type: String, required: true },
        price:   { type: Number, required: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        size:    { type: String, default: 'Standard' },
        color:   { type: String, default: 'Standard' },
        sku:     { type: String, default: '' },
    }],

    shippingAddress: { type: String, required: true },

    totalPrice:     { type: Number, required: true, default: 0.0 },
    couponCode:     { type: String, default: '' },
    couponDiscount: { type: Number, default: 0 },
    userDiscount:   { type: Number, default: 0 },

    orderId: { type: String, unique: true },

    status: {
        type: String,
        required: true,
        default: 'Pending Payment',
        enum: [
            'Pending Payment', 'Placed', 'Processing', 'Packed', 'Preparing', 
            'Shipped', 'Delivered', 'Exchange Requested', 'Exchanged', 
            'Return Requested', 'Returned', 'Cancelled'
        ]
    },

    // Payment
    paymentMethod:      { type: String, default: 'Online' },   // Online | COD
    paymentStatus:      { type: String, default: 'Pending', enum: ['Pending', 'Paid', 'Failed', 'Refunded'] },
    razorpayOrderId:    { type: String, default: '' },
    razorpayPaymentId:  { type: String, default: '' },
    razorpaySignature:  { type: String, default: '' },
    paidAt:             { type: Date },

    // Shipping & Tracking
    trackingId:   { type: String, default: '' },
    courierName:  { type: String, default: '' },
    customNote:   { type: String, default: '' },
    completedAt:  { type: Date },
    shippedAt:    { type: Date },

    // Fashion Exchanges & Returns
    exchangeDetails: {
        requestedSize: { type: String, default: '' },
        reason:        { type: String, default: '' },
        status:        { type: String, default: 'None', enum: ['None', 'Pending', 'Approved', 'Rejected', 'Completed'] },
        requestedAt:   { type: Date }
    },
    returnDetails: {
        reason:        { type: String, default: '' },
        status:        { type: String, default: 'None', enum: ['None', 'Pending', 'Approved', 'Rejected', 'Refunded'] },
        refundAmount:  { type: Number, default: 0 },
        requestedAt:   { type: Date }
    }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);