const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop } = require('../src/models');

async function fixWarehouseShopType() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Updating LARO WAREHOUSE shopType to GROCERY...');

        const [updatedCount] = await Shop.update(
            { shopType: 'GROCERY', isWarehouse: true, category: 'Groceries' },
            { where: { isWarehouse: true } }
        );

        console.log(`✅ Updated ${updatedCount} warehouse shop(s) to shopType: 'GROCERY'.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating warehouse shopType:', err);
        process.exit(1);
    }
}

fixWarehouseShopType();
