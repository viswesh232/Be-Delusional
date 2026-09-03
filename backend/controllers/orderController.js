const Order = require('../models/Order');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const User = require('../models/User');
const ReturnRequest = require('../models/ReturnRequest');
const { sendOrderUpdateEmail } = require('../utils/sendEmail');
const crypto = require('crypto');
const Settings = require('../models/Settings');

// ── Helper: generate TRU-101 style orderId ───────────────────────────────────
const getAlphaSeries = (index) => {
    let current = index;
    let output = '';
    while (current >= 0) {
        output = String.fromCharCode(65 + (current % 26)) + output;
        current = Math.floor(current / 26) - 1;
    }
    return output;
};

const generateOrderId = async () => {
    const counter = await Counter.findByIdAndUpdate(
        'orders',
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const index = counter.seq - 1;
    const numberPerSeries = 899; // 101-999
    const seriesIndex = Math.floor(index / numberPerSeries);
    const orderNumber = 101 + (index % numberPerSeries);

    return `#TRU${getAlphaSeries(seriesIndex)}${orderNumber}`;
};

const getEligibleUserDiscount = async (userId, settings) => {
    if (!settings?.newUserDiscountEnabled || !settings?.newUserDiscount) {
        return null;
    }

    const existingOrder = await Order.exists({
        user: userId,
        status: { $ne: 'Cancelled' },
    });

    if (existingOrder) {
        return null;
    }

    return {
        type: 'percent',
        value: settings.newUserDiscount,
        label: 'First order discount',
    };
};

const calculateOrderPricing = async ({ orderItems, couponCode, userId }) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return { error: 'No order items' };
    }

    const settings = await Settings.findById('global').select([
        'deliveryFee',
        'minOrderValue',
        'platformFee',
        'gstPercent',
        'gstEnabled',
        'freeDeliveryAbove',
        'freeDeliveryEnabled',
        'newUserDiscountEnabled',
        'newUserDiscount',
        'coupons',
        'hiddenCoupons',
    ].join(' '));

    const requestedItems = orderItems
        .map((item) => ({
            productId: String(item.product || item._id || ''),
            qty: Number(item.qty),
            size: item.size || item.selectedSize || 'Standard',
            color: item.color || item.selectedColor || 'Standard',
            sku: item.sku || '',
        }))
        .filter((item) => item.productId);

    if (requestedItems.length === 0 || requestedItems.some((item) => !Number.isInteger(item.qty) || item.qty <= 0)) {
        return { error: 'Invalid order items' };
    }

    const uniqueProductIds = [...new Set(requestedItems.map((item) => item.productId))];
    const products = await Product.find({
        _id: { $in: uniqueProductIds },
        isAvailable: true,
    }).select('name price discountPrice images variants sizes colors');

    if (products.length !== uniqueProductIds.length) {
        return { error: 'One or more selected products are unavailable' };
    }

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    
    // Check inventory stock per size
    for (const item of requestedItems) {
        const product = productMap.get(item.productId);
        if (product && Array.isArray(product.variants) && product.variants.length > 0) {
            const variant = product.variants.find(v => v.size === item.size);
            if (variant && variant.stock < item.qty) {
                return { error: `Selected size (${item.size}) for "${product.name}" has only ${variant.stock} left in stock.` };
            }
        }
    }

    const normalizedItems = requestedItems.map((item) => {
        const product = productMap.get(item.productId);
        let finalPrice = product.price;
        if (product.discountPrice && product.discountPrice > 0) {
            finalPrice = product.discountPrice;
        }

        // If variant has specific price override
        if (Array.isArray(product.variants)) {
            const variant = product.variants.find(v => v.size === item.size);
            if (variant && variant.price && variant.price > 0) {
                finalPrice = variant.price;
            }
        }

        return {
            name: product.name,
            qty: item.qty,
            image: product.images?.[0] || '',
            price: finalPrice,
            product: product._id,
            size: item.size,
            color: item.color,
            sku: item.sku,
        };
    });

    const subtotal = normalizedItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    const minOrderValue = settings?.minOrderValue ?? 0;
    if (minOrderValue > 0 && subtotal < minOrderValue) {
        return { error: `Minimum order value is Rs. ${minOrderValue}` };
    }

    const rawDelivery = settings?.deliveryFee ?? 0;
    const freeThreshold = settings?.freeDeliveryEnabled ? (settings?.freeDeliveryAbove ?? 999) : Infinity;
    const deliveryFee = subtotal >= freeThreshold ? 0 : rawDelivery;
    const platformFee = settings?.platformFee ?? 0;
    const gstRate = settings?.gstEnabled && settings?.gstPercent ? settings.gstPercent : 0;
    const gstAmount = Math.round((subtotal * gstRate) / 100);

    let appliedCouponCode = '';
    let couponDiscount = 0;
    const trimmedCouponCode = couponCode?.toUpperCase().trim();

    if (trimmedCouponCode) {
        const allCoupons = [...(settings?.coupons || []), ...(settings?.hiddenCoupons || [])];
        const coupon = allCoupons.find((entry) => entry.code === trimmedCouponCode);

        if (!coupon) {
            return { error: 'Invalid coupon code' };
        }

        if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
            return { error: `This coupon requires a minimum order of Rs. ${coupon.minOrder}` };
        }

        couponDiscount = coupon.type === 'percent'
            ? Math.round((subtotal * coupon.value) / 100)
            : coupon.value;
        couponDiscount = Math.min(couponDiscount, subtotal);
        appliedCouponCode = coupon.code;
    }

    const userDiscount = await getEligibleUserDiscount(userId, settings);
    const userDiscountAmount = userDiscount
        ? (userDiscount.type === 'percent'
            ? Math.round((subtotal * userDiscount.value) / 100)
            : userDiscount.value)
        : 0;

    const totalPrice = Math.max(0, subtotal + deliveryFee + platformFee + gstAmount - couponDiscount - userDiscountAmount);

    return {
        normalizedItems,
        couponCode: appliedCouponCode,
        couponDiscount,
        userDiscountAmount,
        totalPrice,
    };
};

// ── 1. CREATE RAZORPAY ORDER ─────────────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
    try {
        const Razorpay = require('razorpay');
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            return res.status(500).json({ message: 'Razorpay keys are not configured' });
        }

        const razorpay = new Razorpay({
            key_id: razorpayKeyId,
            key_secret: razorpayKeySecret,
        });

        const pricing = await calculateOrderPricing({
            orderItems: req.body.orderItems,
            couponCode: req.body.couponCode,
            userId: req.user._id,
        });

        if (pricing.error) {
            return res.status(400).json({ message: pricing.error });
        }

        const options = {
            amount: Math.round(pricing.totalPrice * 100), // Razorpay in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);
        res.json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key_id: razorpayKeyId,
            totalPrice: pricing.totalPrice,
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({ message: 'Payment initiation failed', error: error.message });
    }
};

// ── 2. PLACE ORDER ───────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
    try {
        const {
            orderItems, shippingAddress,
            couponCode, customNote,
            razorpayOrderId, razorpayPaymentId, razorpaySignature,
            paymentMethod, addressInfo
        } = req.body;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: 'Shipping address is required' });
        }

        const settings = await Settings.findById('global').select('restrictedUsers orderingEnabled codEnabled');
        if (settings?.orderingEnabled === false) {
            return res.status(403).json({ message: 'Ordering is currently disabled' });
        }

        if (paymentMethod === 'COD' && settings?.codEnabled === false) {
            return res.status(403).json({ message: 'Cash on Delivery is currently unavailable' });
        }

        const isRestricted = settings?.restrictedUsers?.some(
            (entry) => entry.userId === String(req.user._id)
        );
        if (isRestricted) {
            return res.status(403).json({ message: 'Your account is restricted from placing orders' });
        }

        const pricing = await calculateOrderPricing({
            orderItems,
            couponCode,
            userId: req.user._id,
        });
        if (pricing.error) {
            return res.status(400).json({ message: pricing.error });
        }

        // Verify Razorpay signature if payment was online
        let paymentStatus = 'Pending';
        let paidAt = null;

        if (paymentMethod !== 'COD' && (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature)) {
            return res.status(400).json({ message: 'Verified online payment is required before placing this order' });
        }

        if (paymentMethod !== 'COD' && razorpayPaymentId && razorpaySignature) {
            const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;
            if (!razorpaySecret) {
                return res.status(500).json({ message: 'Razorpay verification secret is not configured' });
            }

            const body = razorpayOrderId + '|' + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac('sha256', razorpaySecret)
                .update(body)
                .digest('hex');

            if (expectedSignature === razorpaySignature) {
                paymentStatus = 'Paid';
                paidAt = new Date();
            } else {
                return res.status(400).json({ message: 'Payment verification failed. Order not placed.' });
            }
        }

        const orderId = await generateOrderId();

        const order = new Order({
            user: req.user._id,
            orderId,
            orderItems: pricing.normalizedItems,
            shippingAddress,
            totalPrice: pricing.totalPrice,
            couponCode: pricing.couponCode || '',
            couponDiscount: pricing.couponDiscount || 0,
            userDiscount: pricing.userDiscountAmount || 0,
            customNote: customNote || '',
            status: paymentStatus === 'Paid' ? 'Placed' : (paymentMethod === 'COD' ? 'Placed' : 'Pending Payment'),
            paymentMethod: paymentMethod || 'Online',
            paymentStatus,
            razorpayOrderId: razorpayOrderId || '',
            razorpayPaymentId: razorpayPaymentId || '',
            razorpaySignature: razorpaySignature || '',
            paidAt,
        });

        const createdOrder = await order.save();

        // Atomically decrement stock for apparel variants
        for (const item of pricing.normalizedItems) {
            if (item.size && item.size !== 'Standard') {
                await Product.updateOne(
                    { _id: item.product, 'variants.size': item.size },
                    { $inc: { 'variants.$.stock': -item.qty } }
                );
            }
        }

        const normalizedAddress = addressInfo || {
            firstName: req.user?.firstName || '',
            lastName: req.user?.lastName || '',
            doorNo: '',
            colony: '',
            city: '',
            state: '',
            pincode: '',
            phone: req.user?.phoneNumber || '',
        };

        if (normalizedAddress && (normalizedAddress.doorNo || normalizedAddress.colony || normalizedAddress.city || normalizedAddress.pincode || normalizedAddress.state || normalizedAddress.phone)) {
            await User.findByIdAndUpdate(req.user._id, {
                $set: {
                    firstName: normalizedAddress.firstName || req.user?.firstName || '',
                    lastName: normalizedAddress.lastName || req.user?.lastName || '',
                    phoneNumber: normalizedAddress.phone || req.user?.phoneNumber || '',
                    address: {
                        doorNo: normalizedAddress.doorNo || '',
                        colony: normalizedAddress.colony || '',
                        city: normalizedAddress.city || '',
                        state: normalizedAddress.state || '',
                        pincode: normalizedAddress.pincode || '',
                        country: 'India',
                    },
                }
            });
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── 3. GET SINGLE ORDER ──────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        let order = null;

        if (id.startsWith('TRU-') || id.startsWith('#TRU')) {
            order = await Order.findOne({ orderId: id })
                .populate('user', 'firstName lastName email phoneNumber address');
        }

        if (!order) {
            order = await Order.findById(id)
                .populate('user', 'firstName lastName email phoneNumber address');
        }

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(500).json({ message: error.message });
    }
};

// ── 4. GET ALL ORDERS (Admin) ────────────────────────────────────────────────
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 5. GET MY ORDERS (Customer) ──────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('orderItems.product', 'name image images')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 6. UPDATE ORDER STATUS (Admin) ──────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = req.body.status;

        if (req.body.status === 'Delivered') {
            order.completedAt = new Date();
        } else {
            order.completedAt = null;
        }

        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 7. UPDATE DELIVERY INFO (Admin) ─────────────────────────────────────────
exports.updateDeliveryInfo = async (req, res) => {
    try {
        const { trackingId, courierName, customNote } = req.body;
        const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.trackingId  = trackingId || order.trackingId;
        order.courierName = courierName || 'Express Courier';
        order.customNote  = customNote || '';
        order.status      = 'Shipped';
        order.shippedAt   = new Date();

        await order.save();

        const message = customNote || `Your apparel package is on its way! Tracking ID: ${order.trackingId || 'N/A'}`;
        const emailResult = await sendOrderUpdateEmail(order.user?.email, {
            customerName: order.user?.firstName || 'Customer',
            orderId: order.orderId,
            message,
            trackingId: order.trackingId,
            courierName: order.courierName,
        });

        res.json({
            message: 'Delivery info updated',
            order,
            emailSent: emailResult?.success !== false,
            emailSkipped: emailResult?.skipped === true,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 8. CONFIRM PAYMENT MANUALLY (Admin) ─────────────────────────────────────
exports.confirmPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.paymentStatus = 'Paid';
        order.paidAt = new Date();
        if (order.status === 'Pending Payment') {
            order.status = 'Placed';
        }

        await order.save();
        res.json({ message: 'Payment confirmed', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 9. SEND ORDER UPDATE EMAIL (Admin) ──────────────────────────────────────
exports.sendOrderUpdate = async (req, res) => {
    try {
        const { message, trackingId, courierName } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });

        const order = await Order.findById(req.params.id)
            .populate('user', 'firstName lastName email');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        await sendOrderUpdateEmail(order.user.email, {
            customerName: order.user.firstName,
            orderId: order.orderId,
            message,
            trackingId,
            courierName,
        });

        res.json({ message: 'Email sent to ' + order.user.email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 10. GET REVENUE STATS ────────────────────────────────────────────────────
exports.getRevenueStats = async (req, res) => {
    try {
        const { range, start, end } = req.query;
        let startDate = new Date();
        let endDate   = new Date();

        if (range === 'today') {
            startDate = new Date(new Date().setHours(0, 0, 0, 0));
            endDate   = new Date(new Date().setHours(23, 59, 59, 999));
        } else if (range === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (range === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (range === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        } else if (range === 'custom' && start && end) {
            startDate = new Date(start); startDate.setHours(0, 0, 0, 0);
            endDate   = new Date(end);   endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date(0);
        }

        const orders = await Order.find({
            paymentStatus: 'Paid',
            $or: [
                { paidAt:     { $gte: startDate, $lte: endDate } },
                { createdAt:  { $gte: startDate, $lte: endDate } },
            ],
        }).populate('user', 'firstName lastName');

        const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);
        const averageOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;

        res.json({ totalRevenue, averageOrderValue, totalOrders: orders.length, orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── 11. RECORD FAILED PAYMENT ────────────────────────────────────────────────
exports.recordFailedPayment = async (req, res) => {
    try {
        const { orderItems, shippingAddress, couponCode, customNote, razorpayOrderId, paymentMethod } = req.body;
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
            size: i.size || 'Standard',
            color: i.color || 'Standard',
            sku: i.sku || '',
        }));
        const totalPrice = pricing.totalPrice || orderItems.reduce((a, i) => a + i.price * i.qty, 0);
        const orderId = await generateOrderId();

        const order = new Order({
            user:            req.user._id,
            orderId,
            orderItems:      items,
            shippingAddress: shippingAddress || 'Address not provided',
            totalPrice,
            couponCode:      pricing.couponCode || '',
            couponDiscount:  pricing.couponDiscount || 0,
            userDiscount:    pricing.userDiscountAmount || 0,
            customNote:      customNote || '',
            status:          'Pending Payment',
            paymentMethod:   paymentMethod || 'Online',
            paymentStatus:   'Failed',
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

// ── 12. USER CANCEL ORDER ────────────────────────────────────────────────────
exports.userCancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'Not authorized' });

        if (['Delivered', 'Shipped', 'Cancelled'].includes(order.status)) {
            return res.status(400).json({ message: 'Cannot cancel an order that has already shipped or delivered' });
        }

        order.status = 'Cancelled';
        const updated = await order.save();

        // Replenish apparel variant stocks
        for (const item of order.orderItems) {
            if (item.size && item.size !== 'Standard') {
                await Product.updateOne(
                    { _id: item.product, 'variants.size': item.size },
                    { $inc: { 'variants.$.stock': item.qty } }
                );
            }
        }

        res.json(updated);
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ── 13. REQUEST SIZE EXCHANGE OR RETURN ──────────────────────────────────────
exports.requestExchangeOrReturn = async (req, res) => {
    try {
        const { orderId, productId, type, requestedSize, reason, images } = req.body;
        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: 'Exchanges or returns can only be requested after delivery' });
        }

        const orderItem = order.orderItems.find(i => i.product.toString() === productId.toString());
        if (!orderItem) {
            return res.status(404).json({ message: 'Product not found in this order' });
        }

        const returnRequest = new ReturnRequest({
            order: order._id,
            orderId: order.orderId,
            user: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userEmail: req.user.email,
            product: orderItem.product,
            productName: orderItem.name,
            productImage: orderItem.image,
            originalSize: orderItem.size,
            originalColor: orderItem.color,
            type: type === 'exchange' ? 'exchange' : 'return',
            requestedSize: requestedSize || '',
            reason,
            images: images || [],
            refundAmount: type === 'return' ? orderItem.price * orderItem.qty : 0,
        });

        await returnRequest.save();

        order.status = type === 'exchange' ? 'Exchange Requested' : 'Return Requested';
        if (type === 'exchange') {
            order.exchangeDetails = {
                requestedSize: requestedSize || '',
                reason,
                status: 'Pending',
                requestedAt: new Date()
            };
        } else {
            order.returnDetails = {
                reason,
                status: 'Pending',
                refundAmount: orderItem.price * orderItem.qty,
                requestedAt: new Date()
            };
        }
        await order.save();

        res.status(201).json({ message: `${type === 'exchange' ? 'Exchange' : 'Return'} request submitted successfully`, returnRequest });
    } catch (error) {
        console.error('Exchange/return error:', error);
        res.status(500).json({ message: error.message });
    }
};
