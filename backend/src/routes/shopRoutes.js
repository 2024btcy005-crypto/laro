const express = require('express');
const { getShops, getShopById, createShop, updateShop, deleteShop } = require('../controllers/shopController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.route('/')
    .get(getShops)
    .post(protect, authorize('super_admin'), createShop);

router.route('/:id')
    .get(getShopById)
    .put(protect, authorize('super_admin', 'campus_admin'), updateShop)
    .delete(protect, authorize('super_admin'), deleteShop);

module.exports = router;
