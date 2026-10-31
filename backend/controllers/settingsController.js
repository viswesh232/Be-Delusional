const Settings = require('../models/Settings');
const {
    sendCouponEmail,
    sendAdminMessageEmail,
} = require('../utils/sendEmail');
const User = require('../models/User');
const Order = require('../models/Order');

const getOrCreate = async () => {
    let settings = await Settings.findById('global');
    if (!settings) settings = await Settings.create({ _id: 'global' });
    return settings;
};

const getEligibleUserDiscount = async (userId) => {
    const settings = await getOrCreate();
    if (!settings.newUserDiscountEnabled || !settings.newUserDiscount) {
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

exports.getSettings = async (req, res) => {
    try {
        const settings = await getOrCreate();
        // Never expose private coupons or restricted-customer records to storefront visitors.
        if (req.user?.role === 'admin') return res.json(settings);
        return res.json({
            deliveryFee: settings.deliveryFee,
            minOrderValue: settings.minOrderValue,
            platformFee: settings.platformFee,
            gstPercent: settings.gstPercent,
            gstEnabled: settings.gstEnabled,
            freeDeliveryAbove: settings.freeDeliveryAbove,
            freeDeliveryEnabled: settings.freeDeliveryEnabled,
            orderingEnabled: settings.orderingEnabled,
            codEnabled: settings.codEnabled,
            newUserDiscountEnabled: settings.newUserDiscountEnabled,
            newUserDiscount: settings.newUserDiscount,
            coupons: settings.coupons,
            announcements: settings.announcements,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAdminSettings = async (req, res) => {
    try {
        res.json(await getOrCreate());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = await getOrCreate();
        const fields = [
            'deliveryFee', 'minOrderValue', 'platformFee', 'gstPercent', 'gstEnabled',
            'freeDeliveryAbove', 'freeDeliveryEnabled', 'orderingEnabled', 'codEnabled',
            'newUserDiscountEnabled', 'newUserDiscount',
            'coupons', 'hiddenCoupons', 'restrictedUsers', 'announcements',
        ];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) settings[field] = req.body[field];
        });
        res.json(await settings.save());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.validateCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) return res.status(400).json({ message: 'No code provided' });

        const settings = await getOrCreate();
        const coupon = (settings.coupons || []).find((entry) => entry.code === code.toUpperCase().trim());

        if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });

        if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
            return res.status(400).json({
                message: `This coupon requires a minimum order of Rs. ${coupon.minOrder}`,
                minOrder: coupon.minOrder,
            });
        }

        let discount = coupon.type === 'percent'
            ? Math.round((subtotal * coupon.value) / 100)
            : coupon.value;
        discount = Math.min(discount, subtotal);

        res.json({ valid: true, coupon, discount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPublicCoupons = async (req, res) => {
    try {
        const settings = await getOrCreate();
        res.json(settings.coupons || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserDiscount = async (req, res) => {
    try {
        const { userId } = req.params;
        const isSelf = String(req.user._id) === String(userId);
        if (!isSelf && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const discount = await getEligibleUserDiscount(userId);
        res.json(discount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendCouponToUser = async (req, res) => {
    try {
        const { userId, couponCode, message } = req.body;
        if (!userId || !couponCode) return res.status(400).json({ message: 'userId and couponCode required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const settings = await getOrCreate();
        const allCoupons = [...(settings.coupons || []), ...(settings.hiddenCoupons || [])];
        const coupon = allCoupons.find((entry) => entry.code === couponCode.toUpperCase());
        if (!coupon) return res.status(404).json({ message: 'Coupon not found in settings' });

        const discountText = coupon.type === 'percent'
            ? `${coupon.value}% off your order${coupon.minOrder ? ` (min. Rs. ${coupon.minOrder})` : ''}`
            : `Rs. ${coupon.value} off your order${coupon.minOrder ? ` (min. Rs. ${coupon.minOrder})` : ''}`;

        await sendCouponEmail(user.email, {
            customerName: user.firstName,
            couponCode: coupon.code,
            discountText,
            message: message || coupon.desc,
        });

        res.json({ message: `Coupon sent to ${user.email}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendMailToUser = async (req, res) => {
    try {
        const { userId, subject, message } = req.body;
        if (!userId || !message) {
            return res.status(400).json({ message: 'userId and message are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await sendAdminMessageEmail(user.email, {
            customerName: user.firstName,
            subject,
            message,
        });

        res.json({ message: `Email sent to ${user.email}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
