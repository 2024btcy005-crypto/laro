const { Shop, Product } = require('./src/models');
const { connectDB } = require('./src/config/db');

async function audit() {
    await connectDB();

    const products = await Product.findAll({ include: ['shop'] });
    console.log(`Auditing ${products.length} products...`);

    products.forEach(p => {
        console.log(`Product: ${p.name} (ID: ${p.id}) - ShopId: ${p.shopId} - Shop: ${p.shop ? p.shop.name : 'MISSING'}`);
    });

    const shops = await Shop.findAll({ include: ['products'] });
    shops.forEach(s => {
        console.log(`Shop: ${s.name} - Products Count: ${s.products ? s.products.length : 0}`);
    });

    process.exit(0);
}

audit();
