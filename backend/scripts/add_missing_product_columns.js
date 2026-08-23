const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');

async function addMissingColumns() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Adding missing columns to "products" table if they do not exist...');

        await sequelize.query(`
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isB2G1" BOOLEAN DEFAULT false;
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isCombo" BOOLEAN DEFAULT false;
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variantOf" UUID;
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variantName" VARCHAR(50);
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT 100;
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "lowStockThreshold" INTEGER DEFAULT 5;
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" VARCHAR(50);
            ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit" VARCHAR(20);
        `);

        console.log('✅ Successfully added missing columns to products table!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to add columns:', error);
        process.exit(1);
    }
}

addMissingColumns();
