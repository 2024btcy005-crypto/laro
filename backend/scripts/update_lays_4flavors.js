const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');
const { Op } = require('sequelize');

async function updateLays4Flavors() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Cleaning up old Lay\'s/chip items...');

        // Delete any existing Lay's chips that aren't the main 4
        const deletedCount = await Product.destroy({
            where: {
                name: {
                    [Op.iLike]: '%lay%'
                }
            }
        });
        console.log(`Removed ${deletedCount} old Lay's products.`);

        // Also delete generic "Potato Chips"
        await Product.destroy({
            where: {
                name: {
                    [Op.iLike]: '%potato chips%'
                }
            }
        });

        const shops = await Shop.findAll();
        console.log(`Populating 4 exact color Lay's flavors (₹10) into ${shops.length} shop(s)...`);

        const colorFlavors = [
            {
                name: "Lay's India's Magic Masala (Blue Pack)",
                description: 'Crispy potato chips seasoned with aromatic Indian spices (Blue pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 300,
                unit: 'pack'
            },
            {
                name: "Lay's American Style Cream & Onion (Green Pack)",
                description: 'Crispy potato chips with smooth cream and onion flavor (Green pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 300,
                unit: 'pack'
            },
            {
                name: "Lay's Classic Salted (Yellow Pack)",
                description: 'Classic salted crispy golden potato chips (Yellow pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1566478433002-3f746643c14a?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 300,
                unit: 'pack'
            },
            {
                name: "Lay's Spanish Tomato Tango (Orange Pack)",
                description: 'Crispy potato chips infused with sweet & tangy tomatoes (Orange pack).',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 300,
                unit: 'pack'
            }
        ];

        for (const shop of shops) {
            for (const item of colorFlavors) {
                await Product.create({
                    ...item,
                    shopId: shop.id,
                    universityId: shop.universityId || null
                });
                console.log(`  Added "${item.name}" to shop "${shop.name}"`);
            }
        }

        console.log('✅ Successfully updated Lay\'s flavors to ONLY Blue, Green, Yellow, and Orange at ₹10!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to update Lay\'s flavors:', err);
        process.exit(1);
    }
}

updateLays4Flavors();
