const express = require('express');
const router = express.Router();
const { getConfig, updateConfig, getActiveAd } = require('../controllers/configController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Get global configs
router.route('/')
    .get(getConfig)
    .put(protect, admin, updateConfig);

router.get('/active-ad', getActiveAd);

module.exports = router;
