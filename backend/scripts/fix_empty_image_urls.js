const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Product, Shop } = require('../src/models');
const { Op } = require('sequelize');

async function fixEmptyImageUrls() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Sanitizing product and shop image URLs...');

        const fallbackMap = {
            'Curd': 'https://images.unsplash.com/photo-1485962391944-82ea5593962b?q=80&w=500&auto=format&fit=crop',
            'Ariel Matrix Liquid (50 ml)': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?q=80&w=500&auto=format&fit=crop',
            'Butter Milk': 'https://images.unsplash.com/photo-1571290274554-e91d90afb9bc?q=80&w=500&auto=format&fit=crop'
        };

        const defaultFallback = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=500&auto=format&fit=crop';

        const products = await Product.findAll({ attributes: ['id', 'name', 'imageUrl'] });
        let productFixCount = 0;

        for (const p of products) {
            let url = p.imageUrl ? p.imageUrl.trim() : '';

            if (!url) {
                url = fallbackMap[p.name] || defaultFallback;
                await p.update({ imageUrl: url });
                productFixCount++;
                console.log(`  [Product] Empty URL fixed for "${p.name}" -> ${url}`);
            } else if (url.includes('/uploads/')) {
                const relativePath = url.substring(url.indexOf('/uploads/'));
                if (relativePath !== p.imageUrl) {
                    await p.update({ imageUrl: relativePath });
                    productFixCount++;
                    console.log(`  [Product] Absolute IP/Host path converted to relative for "${p.name}" -> ${relativePath}`);
                }
            } else if (url.startsWith('http://images.unsplash.com')) {
                const httpsUrl = url.replace('http://', 'https://');
                await p.update({ imageUrl: httpsUrl });
                productFixCount++;
                console.log(`  [Product] Upgraded HTTP Unsplash link to HTTPS for "${p.name}"`);
            }
        }

        console.log(`✅ Processed ${products.length} products. Updated ${productFixCount} product URL(s).`);

        const shops = await Shop.findAll({ attributes: ['id', 'name', 'imageUrl'] });
        let shopFixCount = 0;

        for (const s of shops) {
            let url = s.imageUrl ? s.imageUrl.trim() : '';

            if (!url) {
                url = defaultFallback;
                await s.update({ imageUrl: url });
                shopFixCount++;
                console.log(`  [Shop] Empty URL fixed for "${s.name}" -> ${url}`);
            } else if (url.includes('/uploads/')) {
                const relativePath = url.substring(url.indexOf('/uploads/'));
                if (relativePath !== s.imageUrl) {
                    await s.update({ imageUrl: relativePath });
                    shopFixCount++;
                    console.log(`  [Shop] Absolute IP/Host path converted to relative for "${s.name}" -> ${relativePath}`);
                }
            } else if (url.startsWith('http://images.unsplash.com')) {
                const httpsUrl = url.replace('http://', 'https://');
                await s.update({ imageUrl: httpsUrl });
                shopFixCount++;
                console.log(`  [Shop] Upgraded HTTP Unsplash link to HTTPS for "${s.name}"`);
            }
        }

        console.log(`✅ Processed ${shops.length} shops. Updated ${shopFixCount} shop URL(s).`);
        console.log('✅ Image URLs sanitization completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing image URLs:', err);
        process.exit(1);
    }
}

fixEmptyImageUrls();
