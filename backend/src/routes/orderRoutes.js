const express = require('express');
const { createOrder, getMyOrders, getOrderById, cancelOrder, getUserSummary, deleteOrder, getWalletHistory, findUserByPhone, transferCoins, getRecentRecipients } = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, getMyOrders);

router.route('/summary')
    .get(protect, getUserSummary);

router.route('/history')
    .get(protect, getWalletHistory);

router.route('/find-user')
    .get(protect, findUserByPhone);

router.route('/transfer')
    .post(protect, transferCoins);

router.route('/recent-recipients')
    .get(protect, getRecentRecipients);

router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, deleteOrder);

router.route('/:id/cancel')
    .put(protect, cancelOrder);

module.exports = router;
