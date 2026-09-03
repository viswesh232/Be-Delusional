const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
    order:          { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    orderId:        { type: String, required: true },
    user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName:       { type: String, default: '' },
    userEmail:      { type: String, default: '' },
    product:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName:    { type: String, required: true },
    productImage:   { type: String, default: '' },
    originalSize:   { type: String, default: '' },
    originalColor:  { type: String, default: '' },

    type:           { type: String, enum: ['exchange', 'return'], required: true },
    requestedSize:  { type: String, default: '' }, // For exchanges
    reason:         { type: String, required: true },
    images:         { type: [String], default: [] }, // Customer uploaded proof / tags
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Pickup Scheduled', 'Inspected', 'Completed', 'Rejected'],
        default: 'Pending'
    },
    adminNotes:     { type: String, default: '' },
    refundAmount:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
