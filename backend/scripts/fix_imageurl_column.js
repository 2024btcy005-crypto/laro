const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');

async function fixImageUrlColumn() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Altering column "imageUrl" in table "products" to TEXT...');

        await sequelize.query('ALTER TABLE "products" ALTER COLUMN "imageUrl" TYPE TEXT;');
        console.log('✅ Successfully altered "imageUrl" column to TEXT in products table!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to alter column:', error);
        process.exit(1);
    }
}

fixImageUrlColumn();
