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
        // In a real app, we'd check if the user is authenticated as an admin here
        let whereClause = {};

        // Non-admin callers only see open shops by default
        if (all !== 'true') {
            whereClause.isOpen = true;
        }

        if (universityId) {
            whereClause[Op.or] = [
                { universityId: universityId },
                { universityId: null }
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
                        universityId: universityId || null // Ensure we match the university context
                    },
                    include: [{
                        model: Product,
                        as: 'variants',
                        where: {
                            isAvailable: true,
                            universityId: universityId || null
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
                // If shop has no location, we show it (fall back to global accessibility)
                if (!shop.latitude || !shop.longitude) return true;

                const distance = getDistance(userLat, userLng, parseFloat(shop.latitude), parseFloat(shop.longitude));

                // Attach distance for UI use
                shop.setDataValue('distance', distance.toFixed(1));

                // Only return shops within their service radius
                return distance <= (shop.serviceRadius || 5);
            });

            // Sort by nearest
            shops.sort((a, b) => parseFloat(a.getDataValue('distance')) - parseFloat(b.getDataValue('distance')));
        }

        console.log(`[ShopController] Found ${shops.length} shops within range.`);
        res.json(shops);
    } catch (error) {
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
