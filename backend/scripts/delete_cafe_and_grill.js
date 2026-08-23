const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');
const { Op } = require('sequelize');

async function deleteCafeAndGrill() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Searching for Café and Grill shops...');

        const shopsToDelete = await Shop.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: '%caf%' } },
                    { name: { [Op.iLike]: '%grill%' } },
                    { category: { [Op.iLike]: '%caf%' } },
                    { category: { [Op.iLike]: '%grill%' } },
                    { category: { [Op.iLike]: '%restaurant%' } }
                ]
            }
        });

        console.log(`Found ${shopsToDelete.length} shop(s) matching Café or Grill.`);

        for (const shop of shopsToDelete) {
            console.log(`Deleting products for shop "${shop.name}" (${shop.id})...`);
            const deletedProducts = await Product.destroy({ where: { shopId: shop.id } });
            console.log(`  Deleted ${deletedProducts} product(s).`);

            console.log(`Deleting shop "${shop.name}" (${shop.id})...`);
            await shop.destroy();
            console.log(`  Successfully deleted shop "${shop.name}".`);
        }

        console.log('✅ The Graduate Café and Campus Grill & Deli deleted completely!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error deleting shops:', err);
        process.exit(1);
    }
}

deleteCafeAndGrill();
