const express = require('express');
const { getActiveQuestsForUser, getQuestLeaderboard } = require('../controllers/questController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get active quests for a university
router.get('/active', protect, getActiveQuestsForUser);

// Get leaderboard for a specific quest
router.get('/:id/leaderboard', protect, getQuestLeaderboard);

module.exports = router;
