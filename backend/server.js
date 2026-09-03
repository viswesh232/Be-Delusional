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

// 2. Connect to Database
connectDB();

const app = express();
const path = require('path');

// 3. MIDDLEWARE (The Filters - Must come FIRST)
app.use(cors()); // Allow cross-origin requests
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json()); // Essential: Translates JSON bodies
app.use(express.urlencoded({ extended: false })); // Translates URL-encoded bodies

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
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ success: false, message: err.message || 'Server Error' });
});

// 6. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
