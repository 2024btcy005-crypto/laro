const express = require('express');
const router = express.Router();
const { validateCoupon, getCoupons, createCoupon, deleteCoupon } = require('../controllers/couponController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/validate', protect, validateCoupon);
router.get('/', protect, admin, getCoupons);
router.post('/', protect, admin, createCoupon);
router.delete('/:id', protect, admin, deleteCoupon);

module.exports = router;
