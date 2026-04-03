const express = require('express');
const { acceptDelivery, updateDeliveryStatus, getAvailableOrders, getMyActiveOrders, cancelDeliveryAssignment, getDeliveryStats, getDeliveryHistory, updateDeliveryProfile } = require('../controllers/deliveryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/stats', protect, authorize('delivery'), getDeliveryStats);
router.get('/history', protect, authorize('delivery'), getDeliveryHistory);
router.get('/available-orders', protect, authorize('delivery'), getAvailableOrders);
router.get('/active-orders', protect, authorize('delivery'), getMyActiveOrders);
router.post('/orders/:id/accept', protect, authorize('delivery'), acceptDelivery);
router.put('/orders/:id/status', protect, authorize('delivery'), updateDeliveryStatus);
router.post('/orders/:id/cancel-assignment', protect, authorize('delivery'), cancelDeliveryAssignment);
router.put('/profile', protect, authorize('delivery'), updateDeliveryProfile);

module.exports = router;
