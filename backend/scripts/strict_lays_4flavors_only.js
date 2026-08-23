const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');
const { Op } = require('sequelize');

async function strictLays4FlavorsOnly() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Purging all non-conforming Lay\'s & snack chip products...');

        // Delete all products containing "lay", "chips", "kurkure", "peanuts"
        const deleted = await Product.destroy({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: '%lay%' } },
                    { name: { [Op.iLike]: '%chip%' } },
                    { name: { [Op.iLike]: '%kurkure%' } },
                    { name: { [Op.iLike]: '%peanuts%' } }
                ]
            }
        });
        console.log(`Deleted ${deleted} previous chip/snack products.`);

        const shops = await Shop.findAll();
        console.log(`Inserting EXACTLY 4 Lay's flavors (₹10) into ${shops.length} shop(s)...`);

        const exact4Flavors = [
            {
                name: "Lay's India's Magic Masala",
                description: 'Crispy potato chips seasoned with aromatic Indian spices (Blue Pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pack'
            },
            {
                name: "Lay's American Style Cream & Onion",
                description: 'Crispy potato chips with smooth cream and onion flavor (Green Pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pack'
            },
            {
                name: "Lay's Classic Salted",
                description: 'Classic salted crispy golden potato chips (Yellow Pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1566478433002-3f746643c14a?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pack'
            },
            {
                name: "Lay's Spanish Tomato Tango",
                description: 'Crispy potato chips infused with sweet & tangy tomatoes (Orange Pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pack'
            }
        ];

        for (const shop of shops) {
            for (const item of exact4Flavors) {
                await Product.create({
                    ...item,
                    shopId: shop.id,
                    universityId: shop.universityId || null
                });
                console.log(`  Added "${item.name}" to shop "${shop.name}"`);
            }
        }

        console.log('✅ STRICT PURGE & INSERT COMPLETE! Only 4 Lay\'s flavors exist now.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

strictLays4FlavorsOnly();
