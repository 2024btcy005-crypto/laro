const { Shop, Product, University } = require('../models');
const { Op } = require('sequelize');

// Helper to calculate distance between two coordinates in km
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
const getShops = async (req, res) => {
    try {
        const { lat, lng, universityId, all } = req.query;

        // If 'all=true' is passed, we might be in admin mode
        let whereClause = {};

        // Non-admin callers only see active shops by default
        if (all !== 'true') {
            whereClause.isActive = true;
        }

        if (universityId && universityId !== 'null' && universityId !== '') {
            whereClause[Op.or] = [
                { universityId: universityId },
                { universityId: { [Op.is]: null } } // Include global shops
            ];
        }

        let shops = await Shop.findAll({
            where: whereClause,
            include: [
                {
                    model: University,
                    as: 'university',
                    attributes: ['id', 'name']
                },
                {
                    model: Product,
                    as: 'products',
                    where: {
                        isAvailable: true,
                        variantOf: null,
                        // If universityId provided, show its products + global products
                        // If NO universityId, only show global products
                        [Op.or]: [
                            { universityId: (universityId && universityId !== 'null' && universityId !== '') ? universityId : null },
                            { universityId: { [Op.is]: null } },
                            // If no university selected, allow showing university products for now (in dev) 
                            // or if the shop is a warehouse.
                            { id: { [Op.ne]: null } } // This effectively disables the product-level university filter
                        ]
                    },
                    include: [{
                        model: Product,
                        as: 'variants',
                        where: {
                            isAvailable: true,
                            [Op.or]: [
                                { universityId: (universityId && universityId !== 'null' && universityId !== '') ? universityId : null },
                                { universityId: { [Op.is]: null } }
                            ]
                        },
                        required: false
                    }],
                    required: false
                }
            ],
            order: [['promoted', 'DESC'], ['createdAt', 'DESC']]
        });

        // Filter by distance if coordinates provided
        if (lat && lng) {
            const userLat = parseFloat(lat);
            const userLng = parseFloat(lng);

            shops = shops.filter(shop => {
                // If shop has no location or is at 0,0, treat as "Global/Warehouse" and always show
                if (!shop.latitude || !shop.longitude || (parseFloat(shop.latitude) === 0 && parseFloat(shop.longitude) === 0)) {
                    shop.setDataValue('distance', 'Global');
                    return true;
                }

                const distance = getDistance(userLat, userLng, parseFloat(shop.latitude), parseFloat(shop.longitude));

                // Attach distance for UI use
                shop.setDataValue('distance', distance.toFixed(1));

                // Return shops within their service radius OR if they are explicitly marked as warehouses
                return (distance <= (shop.serviceRadius || 5)) || shop.isWarehouse;
            });

            // Sort by nearest, but keep "Global" warehouses manageable (maybe sort them after nearby shops or by promotion)
            shops.sort((a, b) => {
                const distA = a.getDataValue('distance');
                const distB = b.getDataValue('distance');

                if (distA === 'Global') return 1;
                if (distB === 'Global') return -1;
                return parseFloat(distA) - parseFloat(distB);
            });
        }

        console.log(`[ShopController] Found ${shops.length} shops.`);
        res.json(shops);
    } catch (error) {
        console.error('[ShopController ERROR]', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single shop by ID
// @route   GET /api/shops/:id
// @access  Public
const getShopById = async (req, res) => {
    try {
        const { universityId } = req.query;
        let productWhere = {
            isAvailable: true,
            variantOf: null
        };

        if (universityId) {
            productWhere.universityId = universityId;
        }

        const shop = await Shop.findByPk(req.params.id, {
            include: [{
                model: Product,
                as: 'products',
                where: productWhere,
                include: [{
                    model: Product,
                    as: 'variants',
                    where: { isAvailable: true },
                    required: false
                }],
                required: false // Return shop even if no products
            }]
        });

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        res.json(shop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new shop
// @route   POST /api/shops
// @access  Private/Admin
const createShop = async (req, res) => {
    try {
        const {
            name, description, category, imageUrl,
            openingTime, closingTime, latitude, longitude,
            serviceRadius, isWarehouse
        } = req.body;

        let finalUniversityId = null;

        // Only Campus Admins can specify a university (though routes might restrict this)
        if (req.user && req.user.role === 'campus_admin') {
            finalUniversityId = req.user.universityId;
        } else if (req.user && req.user.role === 'super_admin') {
            // Super admins always create global shops unless they explicitly override 
            // (but we've hidden that in the UI, so let's default to null)
            finalUniversityId = null;
        }

        const shop = await Shop.create({
            name,
            description,
            category,
            imageUrl,
            openingTime,
            closingTime,
            latitude,
            longitude,
            serviceRadius,
            isWarehouse,
            universityId: finalUniversityId
        });

        res.status(201).json(shop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a shop
// @route   PUT /api/shops/:id
// @access  Private/Admin
const updateShop = async (req, res) => {
    try {
        const {
            name, description, category, imageUrl,
            openingTime, closingTime, isOpen, deliveryTime,
            costForTwo, promoted, discount,
            latitude, longitude, serviceRadius, isWarehouse, universityId,
            minOrderValue, deliveryFee, estimatedDeliveryTime, isActive
        } = req.body;
        const shop = await Shop.findByPk(req.params.id);

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Campus Admin Isolation Check: Removed as per new global policy
        // If a shop is global (universityId: null), any admin can manage it.
        // If tied to a university, we'll allow all admins to see/edit for now 
        // until the user specifies more granular permissions.

        // If super_admin is editing, ensure shop remains global unless they have a reason 
        // (but since we hidden the UI, we force null to be safe or keep the body value 
        // if we decide to re-enable it. For now, forcing null for cleanliness).
        const finalUniversityId = req.user.role === 'super_admin' ? null : (universityId || shop.universityId);

        await shop.update({
            name,
            description,
            category,
            imageUrl,
            openingTime,
            closingTime,
            isOpen,
            deliveryTime,
            costForTwo,
            promoted,
            discount,
            latitude,
            longitude,
            serviceRadius,
            isWarehouse,
            universityId: finalUniversityId,
            minOrderValue,
            deliveryFee,
            estimatedDeliveryTime,
            isActive
        });

        res.json(shop);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a shop
// @route   DELETE /api/shops/:id
// @access  Private/Admin
const deleteShop = async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id);

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Campus Admin Isolation Check: Can only delete shops in their own university
        if (req.user && req.user.role === 'campus_admin' && shop.universityId !== req.user.universityId) {
            return res.status(403).json({ message: 'Not authorized to delete shops in other universities' });
        }

        await shop.destroy();
        res.json({ message: 'Shop deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getShops,
    getShopById,
    createShop,
    updateShop,
    deleteShop
};
