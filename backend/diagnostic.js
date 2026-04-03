const { Shop, Product } = require('./src/models');
const { connectDB } = require('./src/config/db');

async function diagnostic() {
    await connectDB();

    const shopsTotal = await Shop.count();
    const shopsOpen = await Shop.count({ where: { isOpen: true } });
    const productsTotal = await Product.count();
    const productsAvailable = await Product.count({ where: { isAvailable: true } });

    console.log('--- DATABASE DIAGNOSTIC ---');
    console.log(`Total Shops: ${shopsTotal}`);
    console.log(`Open Shops: ${shopsOpen}`);
    console.log(`Total Products: ${productsTotal}`);
    console.log(`Available Products: ${productsAvailable}`);

    if (shopsOpen > 0) {
        const shops = await Shop.findAll({ where: { isOpen: true }, include: ['products'] });
        shops.forEach(s => {
            console.log(`Shop: ${s.name} (ID: ${s.id}) - Products: ${s.products ? s.products.length : 0}`);
        });
    }

    process.exit(0);
}

diagnostic();
