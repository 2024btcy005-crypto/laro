const express = require('express');
const router = express.Router();
const { getReferralStats } = require('../controllers/referralController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect, getReferralStats);

module.exports = router;
