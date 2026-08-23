const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');

async function addStationeryItems() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Searching for LARO WAREHOUSE...');

        const warehouse = await Shop.findOne({
            where: { isWarehouse: true }
        });

        if (!warehouse) {
            console.error('LARO WAREHOUSE not found.');
            process.exit(1);
        }

        const stationeryItems = [
            {
                name: 'Classmate Long Notebook (Ruled, 140 Pages)',
                description: 'High-quality smooth paper notebook for college notes.',
                price: 55.00,
                originalPrice: 60.00,
                category: 'Stationery',
                isAvailable: true,
                isEdible: false,
                isVeg: null,
                imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pc',
                shopId: warehouse.id,
                universityId: warehouse.universityId || null
            },
            {
                name: 'Reynolds Trimax Gel Pen (Blue)',
                description: 'Precision Japanese waterproof gel ink ball pen.',
                price: 60.00,
                originalPrice: 60.00,
                category: 'Stationery',
                isAvailable: true,
                isEdible: false,
                isVeg: null,
                imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pc',
                shopId: warehouse.id,
                universityId: warehouse.universityId || null
            }
        ];

        for (const item of stationeryItems) {
            const [product, created] = await Product.findOrCreate({
                where: { name: item.name, shopId: warehouse.id },
                defaults: item
            });

            if (!created) {
                await product.update({
                    price: item.price,
                    category: 'Stationery',
                    isEdible: false,
                    isVeg: null,
                    isAvailable: true,
                    stockQuantity: 500,
                    imageUrl: item.imageUrl
                });
                console.log(`  Updated stationery item "${item.name}"`);
            } else {
                console.log(`  Added stationery item "${item.name}"`);
            }
        }

        console.log('✅ Stationery items successfully added to LARO WAREHOUSE!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding stationery items:', err);
        process.exit(1);
    }
}

addStationeryItems();
