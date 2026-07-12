const express = require('express');
const { getActiveQuestsForUser } = require('../controllers/questController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get active quests for a university
router.get('/active', protect, getActiveQuestsForUser);

module.exports = router;
