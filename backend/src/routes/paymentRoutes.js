const express = require('express');
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/create', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
