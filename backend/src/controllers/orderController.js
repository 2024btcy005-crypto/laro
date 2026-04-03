const { Order, OrderItem, Product, Shop, User, Delivery, Review, WalletTransaction, Coupon, XeroxPricing } = require('../models');
const { sequelize } = require('../config/db');
const { Sequelize } = require('sequelize');
const { notifyDeliveryPartnersNewOrder } = require('../services/socketService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    let t;
    try {
        console.log('[DEBUG] createOrder started for user:', req.user?.id);
        console.log('[DEBUG] Body:', JSON.stringify(req.body));

        const { shopId, orderItems, deliveryAddress, paymentMethod, couponCode, universityId } = req.body;

        if (!req.user) {
            console.error('[DEBUG] req.user is missing in createOrder!');
            return res.status(401).json({ message: 'Authentication context lost. Please login again.' });
        }

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items provided' });
        }

        // Minimum order value check
        const MIN_ORDER = 50;

        t = await sequelize.transaction();
        console.log('[DEBUG] Transaction started');

        // Calculate total amount & verify products
        let itemsTotal = 0;
        const itemsToCreate = [];
        const fetchedProducts = [];

        // OPTIMIZATION: Fetch all regular products and Xerox pricing in bulk
        const regularProductIds = orderItems
            .filter(item => {
                const pid = item.productId;
                return typeof pid === 'number' || (typeof pid === 'string' && !pid.startsWith('xerox_'));
            })
            .map(item => item.productId);

        const [dbProducts, xeroxPricing] = await Promise.all([
            regularProductIds.length > 0
                ? Product.findAll({ where: { id: regularProductIds }, transaction: t })
                : Promise.resolve([]),
            orderItems.some(item => typeof item.productId === 'string' && item.productId.startsWith('xerox_'))
                ? XeroxPricing.findOne({ where: { shopId }, transaction: t })
                : Promise.resolve(null)
        ]);

        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        for (const item of orderItems) {
            console.log('[DEBUG] Processing item:', item.productId);

            let priceAtTime;
            let finalProductId = null;
            let currentProduct = null;

            if (typeof item.productId === 'string' && item.productId.startsWith('xerox_')) {
                // Dynamic Xerox Job
                if (!xeroxPricing) {
                    // Default fallback if pricing not set
                    priceAtTime = item.metadata?.pricePerPage || 1;
                } else {
                    const opts = item.metadata?.options || {};
                    let rate = 1;
                    if (opts.colorMode === 'Color') {
                        rate = opts.sides === 'Single' ? xeroxPricing.colorSingle : xeroxPricing.colorDouble;
                    } else {
                        rate = opts.sides === 'Single' ? xeroxPricing.bwSingle : xeroxPricing.bwDouble;
                    }
                    priceAtTime = parseFloat(rate);
                }
                console.log('[DEBUG] Xerox item detected, server-calculated rate:', priceAtTime);
            } else {
                // Regular Product
                const product = productMap.get(item.productId);

                if (!product || !product.isAvailable) {
                    console.error('[DEBUG] Product not available or not found:', item.productId);
                    throw new Error(`Product ${item.productId} is not available`);
                }

                if (product.shopId !== shopId) {
                    console.error('[DEBUG] Shop mismatch for product:', item.productId);
                    throw new Error(`Product ${item.productId} doesn't belong to shop ${shopId}`);
                }

                priceAtTime = parseFloat(product.price);
                finalProductId = product.id;
                currentProduct = product;
            }

            // For Xerox jobs, the quantity is usually 1, and total is priceAtTime * pageCount
            const jobPages = item.metadata?.pageCount || 1;
            const lineTotal = priceAtTime * jobPages * item.quantity;
            itemsTotal += lineTotal;

            itemsToCreate.push({
                productId: finalProductId,
                quantity: item.quantity,
                priceAtTime: priceAtTime * jobPages,
                metadata: item.metadata
            });
            fetchedProducts.push(currentProduct);
        }

        // Apply same logic as frontend: ₹2 handling + 5% tax
        const handlingCharge = 2;
        const taxes = Math.round(itemsTotal * 0.05);

        // ── Minimum order check ──────────────────────────────
        if (itemsTotal < MIN_ORDER) {
            await t.rollback();
            return res.status(400).json({
                message: `Minimum order value is ₹${MIN_ORDER}. Your cart total is ₹${itemsTotal.toFixed(2)}.`
            });
        }


        // Legend Perk: 5% discount on Medicines
        let legendDiscount = 0;
        const user = await User.findByPk(req.user.id, { transaction: t });

        if (user && user.loyaltyLevel === 'Legend') {
            itemsToCreate.forEach((item, index) => {
                const product = fetchedProducts[index];
                if (product && product.category === 'Medicines') {
                    legendDiscount += (item.priceAtTime * item.quantity) * 0.05;
                }
            });
            console.log('[DEBUG] Legend user detected, discount calculated:', legendDiscount);
        }

        let couponDiscount = 0;
        let validatedCoupon = null;

        if (couponCode) {
            console.log('[DEBUG] Validating coupon:', couponCode);
            validatedCoupon = await Coupon.findOne({
                where: {
                    code: { [Sequelize.Op.iLike]: couponCode },
                    isActive: true,
                    expiryDate: { [Sequelize.Op.gt]: new Date() }
                },
                transaction: t
            });

            if (validatedCoupon) {
                const { Op } = Sequelize;
                // Check if user has already used this coupon (One time per user)
                const previousUsage = await Order.findOne({
                    where: {
                        customerId: req.user.id,
                        couponCode: { [Op.iLike]: couponCode.trim() },
                        status: { [Op.ne]: 'cancelled' }
                    },
                    transaction: t
                });

                if (previousUsage) {
                    console.log('[DEBUG] Coupon already used by this user');
                    validatedCoupon = null; // Invalidate for this session
                }
            }

            if (validatedCoupon) {
                // Check usage limit
                if (validatedCoupon.usageLimit === null || validatedCoupon.usedCount < validatedCoupon.usageLimit) {
                    // Check min order
                    if (itemsTotal >= validatedCoupon.minOrderAmount) {
                        if (validatedCoupon.discountType === 'percentage') {
                            couponDiscount = (itemsTotal * validatedCoupon.discountValue) / 100;
                            if (validatedCoupon.maxDiscountAmount && couponDiscount > validatedCoupon.maxDiscountAmount) {
                                couponDiscount = validatedCoupon.maxDiscountAmount;
                            }
                        } else {
                            couponDiscount = validatedCoupon.discountValue;
                        }
                        couponDiscount = Math.min(couponDiscount, itemsTotal);
                        console.log('[DEBUG] Coupon applied. Discount:', couponDiscount);
                    } else {
                        console.log('[DEBUG] Coupon min order not met');
                    }
                } else {
                    console.log('[DEBUG] Coupon usage limit reached');
                }
            } else {
                console.log('[DEBUG] Invalid or expired coupon');
            }
        }

        const totalAmount = Math.max(0, itemsTotal + handlingCharge + taxes - Math.round(legendDiscount) - Math.round(couponDiscount));
        console.log('[DEBUG] Fees calculated:', { itemsTotal, handlingCharge, taxes, legendDiscount, couponDiscount, totalAmount });

        // Generate random 4-digit OTP
        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

        // Create the Order
        console.log('[DEBUG] Creating order record...');
        const order = await Order.create({
            customerId: req.user.id,
            shopId,
            totalAmount,
            deliveryAddress,
            couponCode: validatedCoupon ? validatedCoupon.code : null,
            discountAmount: couponDiscount,
            paymentMethod,
            paymentStatus: paymentMethod === 'laro_coins' ? 'completed' : 'pending',
            deliveryOtp,
            status: 'placed',
            universityId: universityId || user.universityId // Use provided or user's default
        }, { transaction: t });
        console.log('[DEBUG] Order record created:', order.id);

        // Handle Laro Coins Payment Deduction
        if (paymentMethod === 'laro_coins') {
            if (user.laroCurrency < totalAmount) {
                throw new Error('Insufficient Laro Coins balance');
            }

            const oldBalance = user.laroCurrency;
            user.laroCurrency -= totalAmount;
            await user.save({ transaction: t });

            // Log Wallet Transaction
            await WalletTransaction.create({
                userId: req.user.id,
                orderId: order.id,
                amount: totalAmount,
                type: 'debit',
                description: `Payment for order #${order.id.substring(0, 8)}`,
                balanceAfter: user.laroCurrency
            }, { transaction: t });

            console.log('[DEBUG] Laro Coins deducted. Old:', oldBalance, 'New:', user.laroCurrency);
        }

        // Create Order Items
        console.log('[DEBUG] Creating order items...');
        for (const item of itemsToCreate) {
            await OrderItem.create({
                orderId: order.id,
                ...item
            }, { transaction: t });
        }
        console.log('[DEBUG] Order items created');

        // Increment coupon usage
        if (validatedCoupon && couponDiscount > 0) {
            validatedCoupon.usedCount += 1;
            await validatedCoupon.save({ transaction: t });
            console.log('[DEBUG] Coupon usage incremented');
        }

        await t.commit();
        console.log('[DEBUG] Transaction committed');

        // Real-time notify delivery partners
        try {
            notifyDeliveryPartnersNewOrder({
                id: order.id,
                shopId: order.shopId,
                totalAmount: order.totalAmount,
                deliveryAddress: order.deliveryAddress,
                status: order.status,
                deliveryOtp: order.deliveryOtp
            });
        } catch (socketErr) {
            console.error('[DEBUG] Socket notification failed but order is placed:', socketErr.message);
        }

        return res.status(201).json(order);
    } catch (error) {
        if (t) await t.rollback();
        console.error('CRITICAL Order Creation Failed:', error); // Log full error object
        console.error('Order Creation Failed Details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            body: req.body,
            userId: req.user?.id
        });
        return res.status(error.message.includes('Insufficient') ? 400 : 500).json({
            message: error.message || 'Failed to place order. Internal Server Error.',
            error: error.message
        });
    }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { customerId: req.user.id },
            include: [
                { model: Shop, as: 'shop' },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product' }]
                },
                {
                    model: Delivery,
                    as: 'delivery',
                    include: [{ model: User, as: 'partner', attributes: ['name', 'phoneNumber'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: Shop, as: 'shop' },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product' }]
                },
                { model: User, as: 'customer' },
                {
                    model: Delivery,
                    as: 'delivery',
                    include: [{ model: User, as: 'partner', attributes: ['name', 'phoneNumber'] }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is authorized to view this order (Customer, Admin, Delivery Partner)
        if (order.customerId !== req.user.id && req.user.role === 'customer') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.customerId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        if (order.status !== 'placed') {
            return res.status(400).json({ message: 'Order cannot be cancelled in current status' });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user summary (stats)
// @route   GET /api/orders/summary
// @access  Private
const getUserSummary = async (req, res) => {
    try {
        const orderCount = await Order.count({
            where: {
                customerId: req.user.id,
                status: 'delivered'
            }
        });

        const totalSpent = await Order.sum('totalAmount', {
            where: {
                customerId: req.user.id,
                status: 'delivered'
            }
        });

        const averageRating = await Review.findAll({
            where: { customerId: req.user.id },
            attributes: [
                [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
            ],
            raw: true
        });

        // Refetch user to get latest loyalty data
        const user = await User.findByPk(req.user.id);

        res.json({
            user: {
                id: user?.id,
                name: user?.name,
                email: user?.email,
                phoneNumber: user?.phoneNumber,
                role: user?.role,
                address: user?.address,
            },
            orderCount: orderCount || 0,
            totalSpent: parseFloat(totalSpent || 0).toFixed(2),
            rating: parseFloat((averageRating && averageRating[0] && averageRating[0].avgRating) || 0).toFixed(1),
            loyaltyPoints: user?.loyaltyPoints || 0,
            laroCurrency: user?.laroCurrency || 0,
            loyaltyLevel: user?.loyaltyLevel || 'Learner'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
    try {
        console.log(`[DELETE ORDER] Attempting to delete order ID: ${req.params.id} for user: ${req.user.id}`);
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            console.log(`[DELETE ORDER] Order ${req.params.id} not found in database.`);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check ownership
        if (order.customerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to delete this order' });
        }

        // Optional: Only allow deletion if cancelled or delivered?
        // For now, let's allow it as requested.

        await order.destroy();

        res.json({ message: 'Order removed' });
    } catch (error) {
        console.error('Order Deletion Failed:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getWalletHistory = async (req, res) => {
    try {
        console.log('[DEBUG] Fetching wallet history for user:', req.user?.id);
        const history = await WalletTransaction.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: [{ model: Shop, as: 'shop', attributes: ['name', 'imageUrl'] }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        console.log('[DEBUG] History found count:', history.length);
        res.status(200).json(history);
    } catch (err) {
        console.error('[WALLET] Error fetching history:', err);
        res.status(500).json({ message: 'Error fetching history', error: err.message });
    }
};


// @desc    Find user by phone (for coin transfer lookup)
// @route   GET /api/orders/find-user?phone=...
// @access  Private
const findUserByPhone = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ message: 'Phone number is required' });

        const recipient = await User.findOne({
            where: {
                phoneNumber: phone,
                role: ['customer', 'delivery']
            },
            attributes: ['id', 'name']
        });

        if (!recipient) return res.status(404).json({ message: 'User not found' });
        if (recipient.id === req.user.id) return res.status(400).json({ message: 'You cannot send coins to yourself' });

        res.json({ id: recipient.id, name: recipient.name });
    } catch (err) {
        console.error('[TRANSFER] Find user error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Transfer Laro Coins to another user
// @route   POST /api/orders/transfer
// @access  Private
const transferCoins = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { recipientPhone, amount } = req.body;
        const transferAmount = parseInt(amount);

        if (!recipientPhone || !transferAmount || transferAmount < 1) {
            await t.rollback();
            return res.status(400).json({ message: 'Invalid transfer details' });
        }

        // Fetch sender with lock
        const sender = await User.findByPk(req.user.id, { transaction: t, lock: true });
        if (!sender) { await t.rollback(); return res.status(404).json({ message: 'Sender not found' }); }
        if (sender.phoneNumber === recipientPhone) { await t.rollback(); return res.status(400).json({ message: 'You cannot send coins to yourself' }); }
        if (sender.laroCurrency < transferAmount) { await t.rollback(); return res.status(400).json({ message: 'Insufficient Laro Coin balance' }); }

        // Fetch recipient with lock
        const recipient = await User.findOne({
            where: {
                phoneNumber: recipientPhone,
                role: ['customer', 'delivery']
            },
            transaction: t,
            lock: true
        });
        if (!recipient) { await t.rollback(); return res.status(404).json({ message: 'Recipient not found' }); }

        // Deduct from sender
        const senderNewBalance = sender.laroCurrency - transferAmount;
        await sender.update({ laroCurrency: senderNewBalance }, { transaction: t });

        // Credit to recipient
        const recipientNewBalance = recipient.laroCurrency + transferAmount;
        await recipient.update({ laroCurrency: recipientNewBalance }, { transaction: t });

        // Log debit for sender
        await WalletTransaction.create({
            userId: sender.id,
            peerId: recipient.id,
            amount: transferAmount,
            type: 'debit',
            description: `Sent ${transferAmount} Ł to ${recipient.name}`,
            balanceAfter: senderNewBalance,
        }, { transaction: t });

        // Log credit for recipient
        await WalletTransaction.create({
            userId: recipient.id,
            peerId: sender.id,
            amount: transferAmount,
            type: 'credit',
            description: `Received ${transferAmount} Ł from ${sender.name}`,
            balanceAfter: recipientNewBalance,
        }, { transaction: t });

        await t.commit();

        res.json({
            message: `Successfully sent ${transferAmount} Ł to ${recipient.name}`,
            newBalance: senderNewBalance,
        });
    } catch (err) {
        await t.rollback();
        console.error('[TRANSFER] Error:', err);
        res.status(500).json({ message: err.message });
    }
};


// @desc    Get recent recipients
// @route   GET /api/orders/recent-recipients
// @access  Private
const getRecentRecipients = async (req, res) => {
    try {
        console.log('[RECENT] Fetching for user:', req.user?.id);
        const userId = req.user.id;

        console.log('[RECENT] Querying WalletTransaction...');
        const transactions = await WalletTransaction.findAll({
            where: {
                userId,
                peerId: { [Sequelize.Op.ne]: null },
                type: 'debit'
            },
            include: [{
                model: User,
                as: 'peerUser',
                attributes: ['id', 'name', 'phoneNumber']
            }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        console.log(`[RECENT] Found ${transactions.length} rows.`);
        const uniqueRecipients = [];
        const seenIds = new Set();

        for (const tx of transactions) {
            if (tx.peerUser && !seenIds.has(tx.peerUser.id)) {
                uniqueRecipients.push(tx.peerUser);
                seenIds.add(tx.peerUser.id);
                if (uniqueRecipients.length >= 10) break;
            }
        }

        res.json(uniqueRecipients);
    } catch (err) {
        console.error('[RECENT] Error fetching recent recipients:', err);
        res.status(500).json({ message: 'Error fetching recent recipients', error: err.message, stack: err.stack });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getUserSummary,
    deleteOrder,
    getWalletHistory,
    findUserByPhone,
    transferCoins,
    getRecentRecipients,
};
