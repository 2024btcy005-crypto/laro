const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', universityController.getAllUniversities);
router.get('/:id', universityController.getUniversityById);

// Admin only routes
router.post('/', protect, admin, universityController.createUniversity);
router.put('/:id', protect, admin, universityController.updateUniversity);
router.delete('/:id', protect, admin, universityController.deleteUniversity);

module.exports = router;
