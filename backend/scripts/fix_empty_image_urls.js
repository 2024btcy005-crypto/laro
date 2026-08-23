const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Product, Shop } = require('../src/models');
const { Op } = require('sequelize');

async function fixEmptyImageUrls() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Checking for products and shops with empty or invalid imageUrl...');

        const fallbackMap = {
            'Curd': 'https://images.unsplash.com/photo-1485962391944-82ea5593962b?q=80&w=500&auto=format&fit=crop',
            'Ariel Matrix Liquid (50 ml)': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?q=80&w=500&auto=format&fit=crop',
            'Butter Milk': 'https://images.unsplash.com/photo-1571290274554-e91d90afb9bc?q=80&w=500&auto=format&fit=crop'
        };

        const defaultFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=500&auto=format&fit=crop';

        const products = await Product.findAll({
            where: {
                [Op.or]: [
                    { imageUrl: null },
                    { imageUrl: '' },
                    { imageUrl: { [Op.iLike]: '%localhost%' } },
                    { imageUrl: { [Op.iLike]: '%127.0.0.1%' } }
                ]
            }
        });

        console.log(`Found ${products.length} product(s) needing imageUrl fix.`);

        for (const p of products) {
            const newUrl = fallbackMap[p.name] || defaultFallback;
            await p.update({ imageUrl: newUrl });
            console.log(`  Updated product "${p.name}" -> ${newUrl}`);
        }

        const shops = await Shop.findAll({
            where: {
                [Op.or]: [
                    { imageUrl: null },
                    { imageUrl: '' },
                    { imageUrl: { [Op.iLike]: '%localhost%' } },
                    { imageUrl: { [Op.iLike]: '%127.0.0.1%' } }
                ]
            }
        });

        console.log(`Found ${shops.length} shop(s) needing imageUrl fix.`);

        for (const s of shops) {
            await s.update({ imageUrl: defaultFallback });
            console.log(`  Updated shop "${s.name}" -> ${defaultFallback}`);
        }

        console.log('✅ Image URLs fix completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing image URLs:', err);
        process.exit(1);
    }
}

fixEmptyImageUrls();
