const { Coupon, Order } = require('../models');
const { Op } = require('sequelize');

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
exports.validateCoupon = async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        const customerId = req.user.id;

        console.log(`[DEBUG] Validating coupon: "${code}" for user: ${customerId} cartTotal: ${cartTotal}`);
        const trimmedCode = code?.trim();

        if (!trimmedCode) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({
            where: {
                code: { [Op.iLike]: trimmedCode }, // Case-insensitive
                isActive: true,
                expiryDate: { [Op.gt]: new Date() }
            }
        });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or expired coupon code' });
        }

        // Check if user has already used this coupon (One time per user)
        const previousUsage = await Order.findOne({
            where: {
                customerId,
                couponCode: { [Op.iLike]: trimmedCode },
                status: { [Op.ne]: 'cancelled' } // Only count non-cancelled orders
            }
        });

        if (previousUsage) {
            return res.status(400).json({ message: 'You have already used this coupon' });
        }

        // Check usage limit
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Check minimum order amount
        if (cartTotal < coupon.minOrderAmount) {
            return res.status(400).json({
                message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (cartTotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            discount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed cart total
        discount = Math.min(discount, cartTotal);

        res.json({
            message: 'Coupon validated successfully',
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: discount,
            minOrderAmount: coupon.minOrderAmount
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json(coupon);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Delete a coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }
        await coupon.destroy();
        res.json({ message: 'Coupon removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
