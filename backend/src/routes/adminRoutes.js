const express = require('express');
const {
    getDashboardStats,
    getAllOrders,
    getAllUsers,
    getRevenueData,
    toggleUserStatus,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllShops,
    getTopProducts,
    getAllItemSales,
    getAdvertisement,
    updateAdvertisement,
    updateUserRole
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply middleware to all admin routes
router.use(protect, admin);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.get('/products', getAllProducts);
router.post('/products', authorize('campus_admin', 'shop_admin'), createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', authorize('campus_admin', 'shop_admin'), deleteProduct);
router.get('/shops', getAllShops);
router.get('/users', getAllUsers);
router.get('/revenue-chart', getRevenueData);
router.get('/top-products', getTopProducts);
router.get('/item-sales', protect, admin, getAllItemSales);

// Advertisement routes
router.route('/advertisement')
    .get(protect, admin, getAdvertisement)
    .put(protect, admin, updateAdvertisement);

router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
