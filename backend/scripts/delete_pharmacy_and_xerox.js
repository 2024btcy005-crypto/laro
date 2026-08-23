const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');
const { Op } = require('sequelize');

async function deletePharmacyAndXerox() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Searching for LARO PHARMACY and LARO XEROX shops...');

        const shopsToDelete = await Shop.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: '%pharmacy%' } },
                    { name: { [Op.iLike]: '%xerox%' } },
                    { category: { [Op.iLike]: '%pharmacy%' } },
                    { category: { [Op.iLike]: '%xerox%' } }
                ]
            }
        });

        console.log(`Found ${shopsToDelete.length} shop(s) matching Pharmacy or Xerox.`);

        for (const shop of shopsToDelete) {
            console.log(`Deleting products for shop "${shop.name}" (${shop.id})...`);
            const deletedProducts = await Product.destroy({ where: { shopId: shop.id } });
            console.log(`  Deleted ${deletedProducts} product(s).`);

            console.log(`Deleting shop "${shop.name}" (${shop.id})...`);
            await shop.destroy();
            console.log(`  Successfully deleted shop "${shop.name}".`);
        }

        console.log('✅ LARO PHARMACY and LARO XEROX deleted completely from database!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error deleting shops:', err);
        process.exit(1);
    }
}

deletePharmacyAndXerox();
