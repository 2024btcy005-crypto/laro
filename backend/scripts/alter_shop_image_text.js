require('dotenv').config();
const { sequelize } = require('../src/config/db');

async function run() {
    try {
        await sequelize.query('ALTER TABLE shops ALTER COLUMN "imageUrl" TYPE TEXT;');
        console.log('✅ shops.imageUrl successfully converted to TEXT!');
    } catch (e) {
        console.error('Error altering column:', e.message);
    }
    process.exit(0);
}

run();
