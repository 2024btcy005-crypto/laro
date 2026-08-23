const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Product, Shop } = require('../src/models');

async function checkProducts() {
    try {
        await sequelize.authenticate();
        console.log('--- PRODUCTS IN DATABASE ---');
        const products = await Product.findAll({
            include: [{ model: Shop, as: 'shop', attributes: ['name'] }]
        });

        products.forEach(p => {
            console.log(`- Product: "${p.name}" | Shop: "${p.shop ? p.shop.name : p.shopId}" | isAvailable: ${p.isAvailable} | stockQuantity: ${p.stockQuantity} | universityId: ${p.universityId}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkProducts();
