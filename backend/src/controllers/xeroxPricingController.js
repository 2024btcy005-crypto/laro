const { XeroxPricing, Shop } = require('../models');

// @desc    Get Xerox pricing for a specific shop
// @route   GET /api/xerox-pricing/shop/:shopId
// @access  Public
exports.getPricingByShop = async (req, res) => {
    try {
        const pricing = await XeroxPricing.findOne({
            where: { shopId: req.params.shopId }
        });

        if (!pricing) {
            // Return default pricing if none exists yet
            return res.json({
                bwSingle: 1.0,
                bwDouble: 1.5,
                colorSingle: 5.0,
                colorDouble: 8.0,
                isDefault: true
            });
        }

        res.json(pricing);
    } catch (error) {
        console.error('Error fetching xerox pricing:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update Xerox pricing for a shop
// @route   POST /api/xerox-pricing/shop/:shopId
// @access  Private/Admin
exports.updatePricing = async (req, res) => {
    try {
        const { bwSingle, bwDouble, colorSingle, colorDouble } = req.body;
        const shopId = req.params.shopId;

        // Verify shop exists
        const shop = await Shop.findByPk(shopId);
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        let pricing = await XeroxPricing.findOne({ where: { shopId } });

        if (pricing) {
            // Update existing
            pricing.bwSingle = bwSingle ?? pricing.bwSingle;
            pricing.bwDouble = bwDouble ?? pricing.bwDouble;
            pricing.colorSingle = colorSingle ?? pricing.colorSingle;
            pricing.colorDouble = colorDouble ?? pricing.colorDouble;
            await pricing.save();
        } else {
            // Create new
            pricing = await XeroxPricing.create({
                shopId,
                bwSingle: bwSingle || 1.0,
                bwDouble: bwDouble || 1.5,
                colorSingle: colorSingle || 5.0,
                colorDouble: colorDouble || 8.0
            });
        }

        res.json({ message: 'Pricing updated successfully', pricing });
    } catch (error) {
        console.error('Error updating xerox pricing:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
