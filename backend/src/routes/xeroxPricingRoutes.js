const express = require('express');
const router = express.Router();
const { getPricingByShop, updatePricing } = require('../controllers/xeroxPricingController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public access to view pricing
router.get('/shop/:shopId', getPricingByShop);

// Private/Admin access to manage pricing
router.patch('/shop/:shopId', protect, admin, updatePricing);
router.post('/shop/:shopId', protect, admin, updatePricing);

module.exports = router;
