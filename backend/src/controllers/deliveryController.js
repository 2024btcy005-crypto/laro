const { Order, Delivery, User, Shop, OrderItem, Product, WalletTransaction, University } = require('../models');
const { notifyCustomerOrderStatus } = require('../services/socketService');

// @desc    Assign/Accept an order delivery
// @route   POST /api/delivery/orders/:id/accept
// @access  Private/DeliveryPartner
const acceptDelivery = async (req, res) => {
    try {
        const orderId = req.params.id;
        const partnerId = req.user.id;

        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'placed' && order.status !== 'accepted') { // Assuming 'accepted' means accepted by shop
            return res.status(400).json({ message: 'Order is not available for delivery' });
        }

        // Check if already assigned
        const existingDelivery = await Delivery.findOne({ where: { orderId } });
        if (existingDelivery) {
            return res.status(400).json({ message: 'Order already accepted by another partner' });
        }

        const delivery = await Delivery.create({
            orderId: order.id,
            partnerId: partnerId,
            status: 'assigned',
            assignedAt: new Date()
        });

        res.status(200).json(delivery);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update delivery status (picked, delivered)
// @route   PUT /api/delivery/orders/:id/status
// @access  Private/DeliveryPartner
const updateDeliveryStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status, otp } = req.body; // 'picked', 'delivered', plus optional otp

        const delivery = await Delivery.findOne({
            where: { orderId, partnerId: req.user.id },
            include: [{ model: Order, as: 'order' }]
        });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery assignment not found for this user' });
        }

        const updateData = { status };

        if (status === 'picked') {
            updateData.pickedAt = new Date();
        } else if (status === 'delivered') {
            // Require and validate OTP for delivery completion
            if (!otp) {
                return res.status(400).json({ message: 'Delivery OTP code is required to mark as delivered.' });
            }
            if (delivery.order.deliveryOtp && delivery.order.deliveryOtp !== otp) {
                return res.status(400).json({ message: 'Invalid delivery OTP code.' });
            }
            updateData.deliveredAt = new Date();
        }

        await delivery.update(updateData);

        // Update the main Order status
        const orderStatusMap = {
            'picked': 'out_for_delivery',
            'delivered': 'delivered'
        };

        if (orderStatusMap[status]) {
            await Order.update({ status: orderStatusMap[status] }, { where: { id: orderId } });

            // Loyalty Logic: Reward points and update level upon delivery
            if (status === 'delivered') {
                const order = delivery.order;
                const customer = await User.findByPk(order.customerId);
                if (customer) {
                    const pointsEarned = Math.floor(parseFloat(order.totalAmount || 0) / 10);
                    const currencyEarned = Math.floor(parseFloat(order.totalAmount || 0) / 20);

                    const newPoints = (customer.loyaltyPoints || 0) + pointsEarned;
                    const newCurrency = (customer.laroCurrency || 0) + currencyEarned;

                    let newLevel = 'Learner';
                    if (newPoints >= 1000) newLevel = 'Legend';
                    else if (newPoints >= 300) newLevel = 'Pro';
                    else if (newPoints >= 100) newLevel = 'Explorer';

                    await customer.update({
                        loyaltyPoints: newPoints,
                        laroCurrency: newCurrency,
                        loyaltyLevel: newLevel
                    });

                    // Log Wallet Transaction
                    if (currencyEarned > 0) {
                        await WalletTransaction.create({
                            userId: customer.id,
                            orderId: order.id,
                            amount: currencyEarned,
                            type: 'credit',
                            description: `Cashback earned from order #${order.id.substring(0, 8)}`,
                            balanceAfter: newCurrency
                        });
                    }

                    console.log(`[LOYALTY] User ${customer.id} earned ${pointsEarned} pts and ${currencyEarned} Ł. New total: ${newPoints} pts, ${newCurrency} Ł. Level: ${newLevel}`);
                }
            }

            // Real-time notify customer
            const order = await Order.findByPk(orderId);
            notifyCustomerOrderStatus(order.customerId, { orderId: order.id, status: orderStatusMap[status] });
        }

        res.status(200).json(delivery);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all available orders for delivery (Not yet assigned)
// @route   GET /api/delivery/available-orders
// @access  Private/DeliveryPartner
const getAvailableOrders = async (req, res) => {
    try {
        console.log('[DEBUG] Fetching available orders for partner:', req.user.id);
        const partner = await User.findByPk(req.user.id);

        if (!partner || !partner.universityId) {
            console.log('[DEBUG] Partner has no university assigned. Returning empty list (strict university fetching).');
            return res.status(200).json([]);
        }

        const whereClause = { status: 'placed', universityId: partner.universityId };
        console.log(`[DEBUG] Querying available orders with whereClause:`, JSON.stringify(whereClause));

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                {
                    model: Shop,
                    as: 'shop',
                    attributes: ['name', 'address']
                },
                {
                    model: User,
                    as: 'customer',
                    attributes: ['name', 'phoneNumber']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product', attributes: ['name', 'price'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        console.log(`[DEBUG] Found ${orders.length} placed orders. Checking for delivery assignments...`);

        // Filter out orders that already have a delivery record
        const availableOrders = [];
        for (const order of orders) {
            const delivery = await Delivery.findOne({ where: { orderId: order.id } });
            if (!delivery) {
                availableOrders.push(order);
            }
        }
        console.log(`[DEBUG] Returning ${availableOrders.length} unassigned orders.`);

        res.status(200).json(availableOrders);
    } catch (error) {
        console.error('[DEBUG] getAvailableOrders Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current active orders for the partner
// @route   GET /api/delivery/active-orders
// @access  Private/DeliveryPartner
const getMyActiveOrders = async (req, res) => {
    try {
        const partnerId = req.user.id;
        const activeDeliveries = await Delivery.findAll({
            where: {
                partnerId: partnerId,
                status: ['assigned', 'picked']
            },
            include: [{
                model: Order,
                as: 'order',
                include: [
                    {
                        model: Shop,
                        as: 'shop',
                        attributes: ['name', 'address']
                    },
                    {
                        model: User,
                        as: 'customer',
                        attributes: ['name', 'phoneNumber']
                    },
                    {
                        model: OrderItem,
                        as: 'items',
                        include: [{ model: Product, as: 'product', attributes: ['name', 'price'] }]
                    }
                ]
            }]
        });

        res.status(200).json(activeDeliveries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get delivery stats for the partner
// @route   GET /api/delivery/stats
// @access  Private/DeliveryPartner
const getDeliveryStats = async (req, res) => {
    try {
        const partnerId = req.user.id;

        // Get user for universityId & name
        const user = await User.findByPk(partnerId, {
            include: [{
                model: University,
                as: 'university',
                attributes: ['name'],
                required: false
            }]
        });

        const universityId = user ? user.get('universityId') : null;
        const universityName = user && user.university ? user.university.name : null;

        console.log(`[DEBUG STATS] Sending UniID: ${universityId} (Type: ${typeof universityId})`);

        // Perform calculations in parallel for better performance
        const [completedCount, activeCount, totalAssigned] = await Promise.all([
            // Total Deliveries (Completed)
            Delivery.count({
                where: {
                    partnerId: partnerId,
                    status: 'delivered'
                }
            }),
            // Current Active Deliveries
            Delivery.count({
                where: {
                    partnerId: partnerId,
                    status: ['assigned', 'picked']
                }
            }),
            // Total Assigned (Attempted)
            Delivery.count({
                where: {
                    partnerId: partnerId
                }
            })
        ]);

        // Acceptance Rate calculation (Delivered / Total Assigned)
        let acceptanceRate = 100;
        if (totalAssigned > 0) {
            acceptanceRate = Math.round((completedCount / totalAssigned) * 100);
        }

        // Mock Rating for now (as feedback system isn't fully implemented)
        const rating = 5.0;

        res.status(200).json({
            completedCount,
            activeCount,
            rating,
            acceptanceRate,
            currency: '₹',
            universityId,
            universityName
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel delivery assignment (Unassign)
// @route   POST /api/delivery/orders/:id/cancel-assignment
// @access  Private/DeliveryPartner
const cancelDeliveryAssignment = async (req, res) => {
    try {
        const orderId = req.params.id;
        const partnerId = req.user.id;

        const delivery = await Delivery.findOne({ where: { orderId, partnerId } });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery assignment not found' });
        }

        if (delivery.status !== 'assigned') {
            return res.status(400).json({ message: 'Cannot cancel delivery after pick up' });
        }

        // Delete the delivery record
        await delivery.destroy();

        // Optional: Reset order status to 'placed' if it was changed (though it stays 'placed' until picked in this flow)
        // But for safety, we ensure it's 'placed' so another partner can pick it up
        await Order.update({ status: 'placed' }, { where: { id: orderId } });

        res.status(200).json({ message: 'Delivery assignment cancelled successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all delivered orders (history) for the partner
// @route   GET /api/delivery/history
// @access  Private/DeliveryPartner
const getDeliveryHistory = async (req, res) => {
    try {
        const partnerId = req.user.id;
        const history = await Delivery.findAll({
            where: {
                partnerId: partnerId,
                status: 'delivered'
            },
            include: [{
                model: Order,
                as: 'order',
                include: [
                    {
                        model: Shop,
                        as: 'shop',
                        attributes: ['name', 'address']
                    },
                    {
                        model: OrderItem,
                        as: 'items',
                        include: [{ model: Product, as: 'product', attributes: ['name', 'price'] }]
                    }
                ]
            }],
            order: [['deliveredAt', 'DESC']]
        });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update delivery partner profile (e.g., set university)
// @route   PUT /api/delivery/profile
// @access  Private/DeliveryPartner
const updateDeliveryProfile = async (req, res) => {
    try {
        const { universityId } = req.body;
        const partnerId = req.user.id;

        console.log(`[DEBUG UPDATE PROFILE] Partner: ${partnerId}, Received UniID: ${universityId}`);

        const partner = await User.findByPk(partnerId);
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        await partner.update({ universityId });
        console.log(`[DEBUG UPDATE PROFILE] Update Success. New UniID: ${partner.universityId}`);

        res.status(200).json({
            message: 'Profile updated successfully',
            universityId: partner.universityId
        });

    } catch (error) {
        console.error(`[DEBUG UPDATE PROFILE ERROR]`, error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    acceptDelivery,
    updateDeliveryStatus,
    getDeliveryStats,
    getDeliveryHistory,
    getAvailableOrders,
    getMyActiveOrders,
    cancelDeliveryAssignment,
    updateDeliveryProfile
};
