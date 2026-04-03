const express = require('express');
const { searchProducts, createProduct, getProductById } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.get('/search', searchProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorize('campus_admin', 'shop_admin'), createProduct);

module.exports = router;
