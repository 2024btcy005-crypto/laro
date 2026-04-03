// Find Xerox products
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Product, Shop } = require('../src/models');

async function findXerox() {
    try {
        await sequelize.authenticate();
        const shop = await Shop.findOne({ where: { name: 'Campus Xerox & Printing' } });
        if (!shop) {
            console.log('Xerox shop not found');
            return;
        }
        const products = await Product.findAll({ where: { shopId: shop.id } });
        console.log(`--- Products for ${shop.name} ---`);
        products.forEach(p => {
            console.log(`Name: ${p.name}, ID: ${p.id}, Price: ${p.price}`);
        });
    } catch (err) {
        console.error('Find failed:', err);
    } finally {
        await sequelize.close();
    }
}

findXerox();
