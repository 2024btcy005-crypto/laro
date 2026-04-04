const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const configRoutes = require('./routes/configRoutes');
const couponRoutes = require('./routes/couponRoutes');
const xeroxPricingRoutes = require('./routes/xeroxPricingRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const universityRoutes = require('./routes/universityRoutes');

const app = express();

// Debug middleware
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.path}`);
    next();
});

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Hostel Delivery API is running...' });
});

// Temp Init Route (REMOVE AFTER USE)
app.get('/init-admin', async (req, res) => {
    try {
        const { User } = require('./models');
        const bcrypt = require('bcryptjs');
        const adminEmail = 'admin@zippit.com';

        const exists = await User.findOne({ where: { role: 'super_admin' } });
        if (exists) {
            return res.json({ message: 'Super Admin already exists', email: exists.email });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        const newAdmin = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            passwordHash,
            role: 'super_admin',
            isActive: true
        });

        res.json({ message: '✅ Super Admin created successfully!', email: adminEmail, password: 'admin123' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/xerox-pricing', xeroxPricingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/universities', universityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR]', err.stack);
    const message = err.message || 'Something went wrong!';
    res.status(500).json({
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = app;
