const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const settingsRoutes = require('./routes/settingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const supportRoutes = require('./routes/supportRoutes');
const contactRoutes = require('./routes/contactRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const returnRoutes = require('./routes/returnRoutes');

// Connect to persistent storage before accepting requests.

const app = express();
const path = require('path');

// 3. MIDDLEWARE (The Filters - Must come FIRST)
// Allow only configured storefront origins. Keep CORS_ORIGINS as a comma-separated
// allowlist in production (for example, the deployed storefront URL).
const allowedOrigins = new Set([
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS || '').split(','),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
].map((value) => (value || '').trim().replace(/\/$/, '')).filter(Boolean));

app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    index: false,
    maxAge: '1d',
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// 4. ROUTES (The Doors)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/returns', returnRoutes);
// 5. BASE ROUTE
app.get('/', (req, res) => {
    res.send('True Threads Apparel API is running...');
});

// 6. NOT FOUND ROUTE
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Can't find ${req.originalUrl} on this server!` });
});

// 7. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || (err.message === 'Origin not allowed by CORS' ? 403 : 500);
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'An unexpected server error occurred' : err.message,
  });
});

// 6. START SERVER
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server startup aborted:', error.message);
        process.exit(1);
    }
};
startServer();
