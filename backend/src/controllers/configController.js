const { Config, Advertisement } = require('../models');

// Helper to ensure a config row exists
const getOrCreateConfig = async () => {
    let config = await Config.findOne();
    if (!config) {
        config = await Config.create({
            taxRate: 5.0,
            handlingCharge: 2.00,
            defaultDeliveryFee: 0.00
        });
    }
    return config;
};

// @desc    Get global app configurations
// @route   GET /api/config
// @access  Public (App needs to fetch variables for checkout)
const getConfig = async (req, res) => {
    try {
        const config = await getOrCreateConfig();
        res.json(config);
    } catch (error) {
        console.error('[CONFIG GET ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch configurations' });
    }
};

// @desc    Update global app configurations
// @route   PUT /api/config
// @access  Private/Admin
const updateConfig = async (req, res) => {
    try {
        const { taxRate, handlingCharge, defaultDeliveryFee } = req.body;

        let config = await getOrCreateConfig();

        // Update fields if provided
        if (taxRate !== undefined) config.taxRate = taxRate;
        if (handlingCharge !== undefined) config.handlingCharge = handlingCharge;
        if (defaultDeliveryFee !== undefined) config.defaultDeliveryFee = defaultDeliveryFee;

        await config.save();

        res.json({ message: 'Configurations updated successfully', config });
    } catch (error) {
        console.error('[CONFIG UPDATE ERROR]', error);
        res.status(500).json({ error: 'Failed to update configurations' });
    }
};

const getActiveAd = async (req, res) => {
    try {
        const ad = await Advertisement.findOne({ where: { isActive: true } });
        res.json(ad || null);
    } catch (error) {
        console.error('[CONFIG GET AD ERROR]', error);
        res.status(500).json({ error: 'Failed to fetch active advertisement' });
    }
};

module.exports = {
    getConfig,
    updateConfig,
    getActiveAd
};
