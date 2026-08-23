const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop } = require('../src/models');

async function checkWarehouse() {
    try {
        await sequelize.authenticate();
        const warehouse = await Shop.findOne({ where: { isWarehouse: true } });
        console.log('LARO WAREHOUSE IN DB:', JSON.stringify(warehouse, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkWarehouse();
