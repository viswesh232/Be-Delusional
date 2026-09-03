const Review  = require('../models/Review');
const Product = require('../models/Product');
const Order   = require('../models/Order');

// ── GET all reviews for a product ────────────────────────────────────────────
// @route GET /api/reviews/:productId
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── ADD a review ──────────────────────────────────────────────────────────────
// @route POST /api/reviews/:productId
exports.addReview = async (req, res) => {
    try {
        const { rating, title, body, fitFeedback, sizePurchased, customerHeight } = req.body;
        if (!rating || !body) {
            return res.status(400).json({ message: 'Rating and review text are required' });
        }

        // Add uploaded files
        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(f => `/uploads/${f.filename}`);
        }

        // Check if user already reviewed this product
        const existing = await Review.findOne({
            product: req.params.productId,
            user:    req.user._id,
        });
        if (existing) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Check product exists
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const review = await Review.create({
            product:        req.params.productId,
            user:           req.user._id,
            rating:         Number(rating),
            title:          title || '',
            body,
            images,
            fitFeedback:    fitFeedback || 'True to Size',
            sizePurchased:  sizePurchased || '',
            customerHeight: customerHeight || '',
            userName:       req.user.firstName + ' ' + req.user.lastName,
            userAvatar:     req.user.firstName?.[0]?.toUpperCase() || '?',
        });

        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        res.status(500).json({ message: error.message });
    }
};

// ── DELETE a review (admin only) ──────────────────────────────────────────────
// @route DELETE /api/reviews/:reviewId
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        await review.deleteOne();
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── GET all reviews (admin) ──────────────────────────────────────────────────
// @route GET /api/reviews/admin/all
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('product', 'name images')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};