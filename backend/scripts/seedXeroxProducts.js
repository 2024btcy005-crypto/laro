// Add xerox service products to the Xerox shop
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');

const XEROX_SHOP_NAME = 'Campus Xerox & Printing';

const PRODUCTS = [
    { name: 'B&W Xerox (per page)', price: 3, description: 'Black & white photocopy, A4 size.', category: 'Xerox', isAvailable: true },
    { name: 'Colour Xerox (per page)', price: 10, description: 'Full colour photocopy, A4 size.', category: 'Xerox', isAvailable: true },
    { name: 'B&W Print (per page)', price: 4, description: 'Black & white laser print from your file.', category: 'Printing', isAvailable: true },
    { name: 'Colour Print (per page)', price: 12, description: 'Colour laser print from your file.', category: 'Printing', isAvailable: true },
    { name: 'A4 Sheets (100 pages)', price: 40, description: 'Premium quality A4 sheets pack.', category: 'Stationery', isAvailable: true },
    { name: 'Spiral Binding', price: 30, description: 'Spiral binding for reports & projects.', category: 'Binding', isAvailable: true },
    { name: 'Lamination (per page)', price: 15, description: 'Glossy lamination for documents.', category: 'Binding', isAvailable: true },
    { name: 'Pen (Blue / Black)', price: 10, description: 'Reynolds 045 fine writing pen.', category: 'Stationery', isAvailable: true },
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB connected');

        const shop = await Shop.findOne({ where: { name: XEROX_SHOP_NAME } });
        if (!shop) {
            console.error(`❌ Shop "${XEROX_SHOP_NAME}" not found. Run seedXeroxShop.js first.`);
            process.exit(1);
        }

        let created = 0;
        for (const p of PRODUCTS) {
            await Product.create({ ...p, shopId: shop.id });
            console.log(`  ✅ ${p.name} — ₹${p.price}`);
            created++;
        }

        console.log(`\n🎉 Created ${created} products for "${shop.name}"`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seed();
