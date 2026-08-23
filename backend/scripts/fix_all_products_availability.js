const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Product } = require('../src/models');

async function fixAllProductsAvailability() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Updating all products to isAvailable = true and stockQuantity = 100...');

        const [updatedRows] = await Product.update(
            {
                isAvailable: true,
                stockQuantity: 100
            },
            { where: {} }
        );

        console.log(`✅ Successfully updated ${updatedRows} product(s) to isAvailable = true and stockQuantity = 100!`);
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed to update products:', e);
        process.exit(1);
    }
}

fixAllProductsAvailability();
