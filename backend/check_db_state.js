require('dotenv').config();
const { sequelize } = require('./src/config/db');
const Shop = require('./src/models/Shop');
const Product = require('./src/models/Product');

async function checkDb() {
    try {
        await sequelize.authenticate();
        const shops = await Shop.findAll();
        console.log('Shops in DB:', shops.map(s => s.name));

        const products = await Product.findAll();
        console.log('Total Products in DB:', products.length);
        console.log('Product Categories:', [...new Set(products.map(p => p.category))]);

        const pharmacy = shops.find(s => s.name === 'Laro Pharmacy');
        if (pharmacy) {
            const pharmacyProds = products.filter(p => p.shopId === pharmacy.id);
            console.log('Products for Laro Pharmacy:', pharmacyProds.length);
        } else {
            console.log('Laro Pharmacy NOT FOUND in DB');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkDb();
