const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Product, Shop } = require('../src/models');

async function checkImageUrls() {
    try {
        await sequelize.authenticate();
        const products = await Product.findAll({ attributes: ['id', 'name', 'imageUrl'] });
        console.log('--- PRODUCT IMAGE URLS ---');
        products.forEach(p => {
            console.log(`[${p.name}] -> ${p.imageUrl}`);
        });

        const shops = await Shop.findAll({ attributes: ['id', 'name', 'imageUrl'] });
        console.log('\n--- SHOP IMAGE URLS ---');
        shops.forEach(s => {
            console.log(`[${s.name}] -> ${s.imageUrl}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkImageUrls();
