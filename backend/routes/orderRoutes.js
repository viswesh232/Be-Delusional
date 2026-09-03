const express = require('express');
const router = express.Router();
const {
    createOrder,
    createRazorpayOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getMyOrders,
    getRevenueStats,
    updateDeliveryInfo,
    confirmPayment,
    sendOrderUpdate,
    recordFailedPayment,
    userCancelOrder,
    requestExchangeOrReturn,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Static routes FIRST (must be before /:id)
router.get('/stats/revenue',          protect, admin, getRevenueStats);
router.get('/myorders',               protect,        getMyOrders);
router.post('/create-razorpay-order', protect,        createRazorpayOrder);
router.post('/record-failed',         protect,        recordFailedPayment);
router.post('/request-return',        protect,        requestExchangeOrReturn);

// General
router.post('/',   protect, createOrder);
router.get('/',    protect, admin, getOrders);
router.get('/:id', protect, getOrderById);

// ID-based mutations
router.put('/:id/cancel',          protect, userCancelOrder);
router.put('/:id/status',          protect, admin, updateOrderStatus);
router.put('/:id/delivery',        protect, admin, updateDeliveryInfo);
router.put('/:id/confirm-payment', protect, admin, confirmPayment);
router.post('/:id/send-update',     protect, admin, sendOrderUpdate);

module.exports = router;