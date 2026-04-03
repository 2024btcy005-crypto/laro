const { Shop, Product } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function check() {
    try {
        const shops = await Shop.findAll({
            include: [{ model: Product, as: 'products' }]
        });
        console.log('Shops found:', shops.length);
        shops.forEach(s => {
            console.log(`Shop: ${s.name}, Products: ${s.products ? s.products.length : 0}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
check();
