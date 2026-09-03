const Wishlist = require('../models/Wishlist');

// @desc  Get user's wishlist
// @route GET /api/wishlist
exports.getWishlist = async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate('products', 'name price discountPrice images category gender brand isAvailable');
        
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, products: [] });
        }
        res.json(wishlist.products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc  Toggle product in wishlist (Add/Remove)
// @route POST /api/wishlist/toggle
exports.toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ message: 'Product ID is required' });

        let wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = new Wishlist({ user: req.user._id, products: [] });
        }

        const index = wishlist.products.findIndex(id => id.toString() === productId.toString());
        let action = '';

        if (index > -1) {
            wishlist.products.splice(index, 1);
            action = 'removed';
        } else {
            wishlist.products.push(productId);
            action = 'added';
        }

        await wishlist.save();
        await wishlist.populate('products', 'name price discountPrice images category gender brand isAvailable');

        res.json({ action, products: wishlist.products });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
