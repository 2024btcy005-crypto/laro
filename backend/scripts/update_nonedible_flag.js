const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Product } = require('../src/models');
const { Op } = require('sequelize');

async function updateNonEdibleFlag() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Adding isEdible column & altering isVeg to allow NULL in PostgreSQL...');

        await sequelize.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS "isEdible" BOOLEAN DEFAULT true;');
        await sequelize.query('ALTER TABLE products ALTER COLUMN "isVeg" DROP NOT NULL;');
        console.log('✅ Schema migration complete!');

        const nonEdibleKeywords = ['a4', 'sheet', 'print', 'xerox', 'notebook', 'binding', 'pen', 'pencil', 'calculator', 'charger', 'bottle', 'water bottle'];

        const whereCondition = {
            [Op.or]: nonEdibleKeywords.map(k => ({ name: { [Op.iLike]: `%${k}%` } }))
        };

        const productsToUpdate = await Product.findAll({ where: whereCondition });
        console.log(`Found ${productsToUpdate.length} non-edible product(s) to update.`);

        for (const p of productsToUpdate) {
            await p.update({
                isEdible: false,
                isVeg: null
            });
            console.log(`  Updated "${p.name}" -> isEdible: false, isVeg: null`);
        }

        console.log('✅ Non-edible database flags updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating non-edible flags:', err);
        process.exit(1);
    }
}

updateNonEdibleFlag();
