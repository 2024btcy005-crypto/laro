const { Order, User, Shop, Product, Payment, Delivery, OrderItem, Advertisement, University } = require('../models');
const { Op } = require('sequelize');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'super_admin';
        const uniFilter = isSuperAdmin ? {} : {
            [Op.or]: [
                { universityId: req.user.universityId },
                { universityId: null }
            ]
        };

        const totalOrders = await Order.count({ where: uniFilter });
        const totalShops = await Shop.count({ where: uniFilter });
        const totalUsers = await User.count({ where: isSuperAdmin ? {} : { universityId: req.user.universityId } });

        const payments = await Payment.findAll({
            where: { status: 'completed' },
            include: [{
                model: Order,
                as: 'order',
                where: uniFilter,
                required: true
            }]
        });

        const totalRevenue = payments.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

        res.json({
            stats: [
                { title: 'Total Orders', value: totalOrders.toLocaleString(), type: 'orders' },
                { title: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}`, type: 'revenue' },
                { title: 'Active Shops', value: totalShops.toLocaleString(), type: 'shops' },
                { title: 'Active Users', value: totalUsers.toLocaleString(), type: 'users' },
            ]
        });
    } catch (error) {
        console.error('[ADMIN STATS ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

// @desc    Get all orders with optional filtering
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const { status, shopId } = req.query;
        const isSuperAdmin = req.user.role === 'super_admin';
        const whereClause = isSuperAdmin ? {} : {
            [Op.or]: [
                { universityId: req.user.universityId },
                { universityId: null }
            ]
        };

        if (status) whereClause.status = status;
        if (shopId) whereClause.shopId = shopId;

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'customer', attributes: ['name', 'email'] },
                { model: Shop, as: 'shop', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(orders);
    } catch (error) {
        console.error('[ADMIN ORDERS ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'super_admin';
        const uniFilter = isSuperAdmin ? {} : { universityId: req.user.universityId };

        const users = await User.findAll({
            where: uniFilter,
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: require('../models').University,
                    as: 'university',
                    attributes: ['id', 'name']
                },
                {
                    model: require('../models').Shop,
                    as: 'assignedShop',
                    attributes: ['id', 'name', 'category', 'shopType']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error('[ADMIN USERS ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// @desc    Get revenue data for charts
// @route   GET /api/admin/revenue-chart
// @access  Private/Admin
const getRevenueData = async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'super_admin';
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const whereClause = {
            status: 'completed',
            createdAt: { [Op.gte]: sevenDaysAgo }
        };

        const payments = await Payment.findAll({
            where: whereClause,
            include: [{
                model: Order,
                as: 'order',
                where: isSuperAdmin ? {} : {
                    [Op.or]: [
                        { universityId: req.user.universityId },
                        { universityId: null }
                    ]
                },
                required: true
            }],
            attributes: [
                [Order.sequelize.fn('date', Order.sequelize.col('createdAt')), 'day'],
                [Order.sequelize.fn('sum', Order.sequelize.col('amount')), 'total']
            ],
            group: [Order.sequelize.fn('date', Order.sequelize.col('createdAt'))],
            order: [[Order.sequelize.fn('date', Order.sequelize.col('createdAt')), 'ASC']]
        });

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Formulate a 7-day range to ensure no missing days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = days[d.getDay()];

            const dayData = payments.find(p => p.get('day') === dateStr);
            last7Days.push({
                name: dayName,
                revenue: dayData ? parseFloat(dayData.get('total')) : 0
            });
        }

        res.json(last7Days);
    } catch (error) {
        console.error('[ADMIN REVENUE ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deactivating themselves
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'Cannot change your own status' });
        }

        // Campus Admin Isolation Check
        if (req.user.role === 'campus_admin' && user.universityId !== req.user.universityId) {
            return res.status(403).json({ message: 'Not authorized to modify users in other universities' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({ message: `User status updated to ${user.isActive ? 'Active' : 'Inactive'}`, user });
    } catch (error) {
        console.error('[ADMIN TOGGLE USER ERROR]', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllProducts = async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'super_admin';
        const uniFilter = isSuperAdmin ? {} : { universityId: req.user.universityId };

        const products = await Product.findAll({
            where: uniFilter,
            include: [
                {
                    model: Shop,
                    as: 'shop',
                    attributes: ['name', 'universityId'],
                    required: true
                },
                {
                    model: University,
                    as: 'university',
                    attributes: ['id', 'name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(products);
    } catch (error) {
        console.error('[ADMIN PRODUCTS ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// @desc    Get all shops for dropdowns
// @route   GET /api/admin/shops
// @access  Private/Admin
const getAllShops = async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'super_admin';
        const whereClause = isSuperAdmin ? {} : {
            [Op.or]: [
                { universityId: req.user.universityId },
                { universityId: null }
            ]
        };

        const shops = await Shop.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'universityId'],
            include: [{
                model: University,
                as: 'university',
                attributes: ['name']
            }],
            order: [['name', 'ASC']]
        });
        res.json(shops);
    } catch (error) {
        console.error('[ADMIN SHOPS ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
};

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const { shopId, name, description, price, originalPrice, category, imageUrl, isVeg, isAvailable, variantOf, variantName } = req.body;

        // Campus Admin Isolation Check
        if (req.user.role === 'campus_admin') {
            const shop = await Shop.findByPk(shopId);
            // Allow adding products to global shops OR their own university's shops
            if (!shop || (shop.universityId !== req.user.universityId && shop.universityId !== null)) {
                return res.status(403).json({ message: 'Cannot add product to this shop' });
            }
        }

        const product = await Product.create({
            shopId,
            universityId: req.user.role === 'campus_admin' ? req.user.universityId : (req.body.universityId || null),
            name,
            description,
            price,
            originalPrice,
            category,
            imageUrl,
            isVeg: isVeg !== undefined ? isVeg : true,
            isAvailable: isAvailable !== undefined ? isAvailable : true,
            variantOf,
            variantName
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('[ADMIN CREATE PRODUCT ERROR]', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { name, description, price, originalPrice, category, imageUrl, isVeg, isAvailable, shopId, variantOf, variantName } = req.body;
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Campus Admin Isolation Check
        if (req.user.role === 'campus_admin' && product.universityId !== req.user.universityId) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        await product.update({
            name,
            description,
            price,
            originalPrice,
            category,
            imageUrl,
            isVeg,
            isAvailable,
            shopId,
            variantOf,
            variantName
        });

        res.json(product);
    } catch (error) {
        console.error('[ADMIN UPDATE PRODUCT ERROR]', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Campus Admin Isolation Check
        if (req.user.role === 'campus_admin') {
            const shop = await Shop.findByPk(product.shopId);
            if (!shop || shop.universityId !== req.user.universityId) {
                return res.status(403).json({ message: 'Not authorized to delete products in other universities' });
            }
        }

        await product.destroy();
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('[ADMIN DELETE PRODUCT ERROR]', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

// @desc    Get top 5 products by sales quantity
// @route   GET /api/admin/top-products
// @access  Private/Admin
const getTopProducts = async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'super_admin';
        const uniFilter = isSuperAdmin ? {} : { universityId: req.user.universityId };

        const topProducts = await OrderItem.findAll({
            attributes: [
                'productId',
                [Order.sequelize.fn('SUM', Order.sequelize.col('quantity')), 'totalQuantity'],
                [Order.sequelize.fn('SUM', Order.sequelize.literal('quantity * "priceAtTime"')), 'totalRevenue']
            ],
            include: [
                {
                    model: Product,
                    as: 'product',
                    attributes: ['name', 'imageUrl', 'category'],
                    include: [{
                        model: Shop,
                        as: 'shop',
                        where: uniFilter,
                        required: true,
                        attributes: []
                    }]
                }
            ],
            group: ['productId', 'product.id'],
            order: [[Order.sequelize.literal('"totalQuantity"'), 'DESC']],
            limit: 5
        });

        res.json(topProducts);
    } catch (error) {
        console.error('[ADMIN TOP PRODUCTS ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch top products' });
    }
};

// @desc    Get all items sales performance
// @route   GET /api/admin/item-sales
// @access  Private/Admin
const getAllItemSales = async (req, res) => {
    try {
        const isSuperAdmin = req.user.role === 'super_admin';
        const uniFilter = isSuperAdmin ? {} : { universityId: req.user.universityId };

        const itemSales = await OrderItem.findAll({
            attributes: [
                'productId',
                [Order.sequelize.fn('SUM', Order.sequelize.col('quantity')), 'totalQuantity'],
                [Order.sequelize.fn('SUM', Order.sequelize.literal('quantity * "priceAtTime"')), 'totalRevenue']
            ],
            include: [{
                model: Product,
                as: 'product',
                attributes: ['name', 'imageUrl', 'category', 'price'],
                include: [{
                    model: Shop,
                    as: 'shop',
                    where: uniFilter,
                    required: true,
                    attributes: []
                }]
            }],
            group: ['productId', 'product.id'],
            order: [[Order.sequelize.literal('"totalQuantity"'), 'DESC']]
        });

        res.json(itemSales);
    } catch (error) {
        console.error('[ADMIN ITEM SALES ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch item sales' });
    }
};

// @desc    Get current advertisement settings
// @route   GET /api/admin/advertisement
// @access  Private/Admin
const getAdvertisement = async (req, res) => {
    try {
        let ad = await Advertisement.findOne();
        if (!ad) {
            ad = await Advertisement.create({
                title: 'Welcome to Zippit!',
                imageUrl: '',
                isActive: false
            });
        }
        res.json(ad);
    } catch (error) {
        console.error('[ADMIN GET AD ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch advertisement' });
    }
};

// @desc    Update advertisement settings
// @route   PUT /api/admin/advertisement
// @access  Private/Admin
const updateAdvertisement = async (req, res) => {
    try {
        const { title, imageUrl, linkUrl, isActive } = req.body;
        let ad = await Advertisement.findOne();
        if (!ad) {
            ad = await Advertisement.create({ title, imageUrl, linkUrl, isActive });
        } else {
            await ad.update({ title, imageUrl, linkUrl, isActive });
        }
        res.json({ message: 'Advertisement updated successfully', ad });
    } catch (error) {
        console.error('[ADMIN UPDATE AD ERROR]', error);
        res.status(500).json({ error: 'Failed to update advertisement' });
    }
};

// @desc    Update user role and university
// @route   PUT /api/admin/users/:id/role
// @access  Private/SuperAdmin
const updateUserRole = async (req, res) => {
    try {
        // Only super_admin can change roles
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only super administrators can change user roles' });
        }

        const { role, universityId } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent de-ranking the last super_admin (logic check)
        if (user.role === 'super_admin' && role !== 'super_admin') {
            const superAdminCount = await User.count({ where: { role: 'super_admin' } });
            if (superAdminCount <= 1) {
                return res.status(400).json({ message: 'Cannot demote the only super administrator' });
            }
        }

        await user.update({ role, universityId });
        res.json({ message: 'User role updated successfully', user });
    } catch (error) {
        console.error('[ADMIN UPDATE ROLE ERROR]', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

// @desc    Assign delivery partner to a specific shop/restaurant
// @route   PUT /api/admin/users/:id/assign-shop
// @access  Private/Admin
const assignShopToDeliveryPartner = async (req, res) => {
    try {
        const { assignedShopId } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let shopIdToSave = null;
        let scopeToSave = 'ALL';

        if (assignedShopId === 'ALL_RESTAURANTS') {
            scopeToSave = 'RESTAURANTS_ONLY';
        } else if (assignedShopId === 'ALL_GROCERIES' || assignedShopId === 'ALL_SHOPS') {
            scopeToSave = 'GROCERIES_ONLY';
        } else if (assignedShopId && assignedShopId !== 'null' && assignedShopId !== '') {
            const shop = await Shop.findByPk(assignedShopId);
            if (!shop) {
                return res.status(404).json({ message: 'Specified shop not found' });
            }
            shopIdToSave = assignedShopId;
            scopeToSave = 'SPECIFIC_SHOP';
        }

        await user.update({ assignedShopId: shopIdToSave, deliveryScope: scopeToSave });

        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['password'] },
            include: [
                { model: Shop, as: 'assignedShop', attributes: ['id', 'name', 'category', 'shopType'] },
                { model: University, as: 'university', attributes: ['id', 'name'] }
            ]
        });

        res.json({ message: 'Delivery partner shop assignment updated successfully', user: updatedUser });
    } catch (error) {
        console.error('[ADMIN ASSIGN SHOP ERROR]', error);
        res.status(500).json({ error: 'Failed to assign shop to delivery partner' });
    }
};

// @desc    Send broadcast push notification
// @route   POST /api/admin/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = async (req, res) => {
    try {
        const { title, body, universityId, data } = req.body;
        if (!title || !body) {
            return res.status(400).json({ message: 'Title and body are required' });
        }

        const { sendPushNotification } = require('../services/notificationService');

        const whereClause = { isActive: true };
        if (universityId && universityId !== 'all') {
            whereClause.universityId = universityId;
        }

        const users = await User.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'fcmToken']
        });

        let sentCount = 0;
        let failCount = 0;

        for (const user of users) {
            const token = user.fcmToken || 'ExponentPushToken[dev_test_token]';
            try {
                await sendPushNotification(token, title, body, data || {});
                sentCount++;
            } catch (err) {
                console.error(`[BROADCAST ERR] Failed for user ${user.id}:`, err);
                failCount++;
            }
        }

        res.json({
            message: `Notification broadcast completed. Target users: ${users.length}, Sent: ${sentCount}, Failed: ${failCount}`,
            targetUserCount: users.length,
            sentCount
        });

    } catch (error) {
        console.error('[ADMIN BROADCAST NOTIFICATION ERROR]', error);
        res.status(500).json({ error: 'Failed to broadcast notification' });
    }
};

// @desc    Get detailed financial analytics
// @route   GET /api/admin/analytics/financial
// @access  Private/Admin
const getFinancialAnalytics = async (req, res) => {
    try {
        const { days = 30, universityId, shopId } = req.query;
        const isSuperAdmin = req.user.role === 'super_admin';

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const whereClause = {
            createdAt: { [Op.gte]: startDate }
        };

        if (status = 'delivered') whereClause.status = 'delivered';
        if (shopId) whereClause.shopId = shopId;
        if (!isSuperAdmin) {
            whereClause.universityId = req.user.universityId;
        } else if (universityId && universityId !== 'all') {
            whereClause.universityId = universityId;
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: Shop, as: 'shop', attributes: ['id', 'name', 'category'] },
                { model: User, as: 'customer', attributes: ['name', 'email'] },
                { model: OrderItem, as: 'items' }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Metrics calculation
        const gmv = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
        const platformCommissionRate = 0.10; // 10% platform commission
        const platformCommission = gmv * platformCommissionRate;
        const deliveryFeesCollected = orders.length * 20; // Avg estimated delivery fee pool
        const netVendorPayout = Math.max(0, gmv - platformCommission);

        // Payment Method breakdown
        const paymentMethods = { laro_coins: 0, cod: 0, online: 0 };
        orders.forEach(o => {
            const method = (o.paymentMethod || 'cod').toLowerCase();
            if (method.includes('coin') || method.includes('wallet')) {
                paymentMethods.laro_coins += parseFloat(o.totalAmount || 0);
            } else if (method.includes('online') || method.includes('razor')) {
                paymentMethods.online += parseFloat(o.totalAmount || 0);
            } else {
                paymentMethods.cod += parseFloat(o.totalAmount || 0);
            }
        });

        // Top Shops by Sales Volume
        const shopMap = {};
        orders.forEach(o => {
            const shopName = o.shop?.name || 'General Campus Store';
            if (!shopMap[shopName]) shopMap[shopName] = { name: shopName, count: 0, revenue: 0 };
            shopMap[shopName].count += 1;
            shopMap[shopName].revenue += parseFloat(o.totalAmount || 0);
        });

        const topShops = Object.values(shopMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Daily trend data
        const dailyMap = {};
        orders.forEach(o => {
            const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
            if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
            dailyMap[dateStr].revenue += parseFloat(o.totalAmount || 0);
            dailyMap[dateStr].orders += 1;
        });

        const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            periodDays: parseInt(days),
            totalOrdersCount: orders.length,
            gmv: parseFloat(gmv.toFixed(2)),
            platformCommission: parseFloat(platformCommission.toFixed(2)),
            deliveryFeesCollected: parseFloat(deliveryFeesCollected.toFixed(2)),
            netVendorPayout: parseFloat(netVendorPayout.toFixed(2)),
            paymentMethods,
            topShops,
            dailyTrends
        });
    } catch (error) {
        console.error('[ADMIN FINANCIAL ANALYTICS ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch financial analytics' });
    }
};

// @desc    Export financial CSV report
// @route   GET /api/admin/analytics/export-csv
// @access  Private/Admin
const exportFinancialCSVReport = async (req, res) => {
    try {
        const { days = 30, universityId, shopId } = req.query;
        const isSuperAdmin = req.user.role === 'super_admin';

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const whereClause = {
            createdAt: { [Op.gte]: startDate }
        };

        if (shopId) whereClause.shopId = shopId;
        if (!isSuperAdmin) {
            whereClause.universityId = req.user.universityId;
        } else if (universityId && universityId !== 'all') {
            whereClause.universityId = universityId;
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: Shop, as: 'shop', attributes: ['name'] },
                { model: User, as: 'customer', attributes: ['name', 'email'] },
                { model: OrderItem, as: 'items' }
            ],
            order: [['createdAt', 'DESC']]
        });

        let csvContent = 'Order ID,Date,Time,Shop Name,Customer Name,Status,Payment Method,Items Count,Total Amount (INR),Platform Fee 10% (INR),Net Merchant Payout (INR)\n';

        orders.forEach(o => {
            const date = new Date(o.createdAt);
            const dateStr = date.toLocaleDateString();
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const total = parseFloat(o.totalAmount || 0);
            const platformFee = (total * 0.10).toFixed(2);
            const merchantPayout = (total * 0.90).toFixed(2);
            const itemsCount = o.items ? o.items.length : 0;
            const shopName = `"${(o.shop?.name || 'Campus Store').replace(/"/g, '""')}"`;
            const customerName = `"${(o.customer?.name || 'Student Customer').replace(/"/g, '""')}"`;

            csvContent += `${o.id},${dateStr},${timeStr},${shopName},${customerName},${o.status},${o.paymentMethod || 'COD'},${itemsCount},${total.toFixed(2)},${platformFee},${merchantPayout}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=zippit_financial_report_${Date.now()}.csv`);
        res.status(200).send(csvContent);
    } catch (error) {
        console.error('[ADMIN CSV EXPORT ERROR]', error);
        res.status(500).json({ error: 'Failed to generate financial CSV report' });
    }
};

module.exports = {
    getDashboardStats,
    getAllOrders,
    getAllUsers,
    getRevenueData,
    toggleUserStatus,
    getAllProducts,
    getAllShops,
    createProduct,
    updateProduct,
    deleteProduct,
    getTopProducts,
    getAllItemSales,
    getAdvertisement,
    updateAdvertisement,
    updateUserRole,
    assignShopToDeliveryPartner,
    broadcastNotification,
    getFinancialAnalytics,
    exportFinancialCSVReport
};


