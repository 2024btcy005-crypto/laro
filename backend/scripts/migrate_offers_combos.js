const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');

async function migrateOffersCombos() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Adding isB2G1 and isCombo columns to products table...');

        await sequelize.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS "isB2G1" BOOLEAN DEFAULT false;');
        await sequelize.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS "isCombo" BOOLEAN DEFAULT false;');

        console.log('✅ Columns isB2G1 and isCombo added to PostgreSQL database!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error running migration:', err);
        process.exit(1);
    }
}

migrateOffersCombos();
