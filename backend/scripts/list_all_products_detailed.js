const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');

async function listAllProducts() {
    try {
        await sequelize.authenticate();
        const [products] = await sequelize.query(`
            SELECT p.id, p.name, p.price, p."isAvailable", p.category, s.name as shop_name 
            FROM products p 
            LEFT JOIN shops s ON p."shopId" = s.id 
            ORDER BY s.name, p.name;
        `);
        console.log(`TOTAL PRODUCTS IN DB: ${products.length}`);
        console.dir(products, { depth: null });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listAllProducts();
