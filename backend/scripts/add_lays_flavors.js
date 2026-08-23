const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');

async function addLaysFlavors() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Searching for shops...');

        const shops = await Shop.findAll();
        if (!shops || shops.length === 0) {
            console.log('No shops found in database.');
            process.exit(0);
        }

        console.log(`Found ${shops.length} shop(s). Adding/Updating Lay's Potato Chips ₹10 items...`);

        const laysItems = [
            {
                name: "Lay's India's Magic Masala (₹10)",
                description: 'Crispy potato chips seasoned with aromatic Indian spices.',
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
                name: "Lay's American Style Cream & Onion (₹10)",
                description: 'Crispy potato chips with smooth cream and onion flavor.',
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
                name: "Lay's Classic Salted (₹10)",
                description: 'Classic salted crispy golden potato chips.',
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
                name: "Lay's Spanish Tomato Tango (₹10)",
                description: 'Crispy potato chips infused with sweet & tangy tomatoes.',
                price: 10.00,
                originalPrice: 10.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 300,
                unit: 'pack'
            },
            {
                name: "Lay's Chile Limon (₹10)",
                description: 'Crispy potato chips packed with spicy chili and tangy lime.',
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
                name: "Lay's Sizzling Hot (₹10)",
                description: 'Fiery and hot crispy potato chips for chili lovers.',
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
            for (const item of laysItems) {
                const [product, created] = await Product.findOrCreate({
                    where: { name: item.name, shopId: shop.id },
                    defaults: {
                        ...item,
                        shopId: shop.id,
                        universityId: shop.universityId || null
                    }
                });

                if (!created) {
                    await product.update({
                        price: item.price,
                        originalPrice: item.originalPrice,
                        imageUrl: item.imageUrl,
                        isVeg: true,
                        isAvailable: true,
                        stockQuantity: 300
                    });
                    console.log(`  Updated "${item.name}" in shop "${shop.name}"`);
                } else {
                    console.log(`  Added "${item.name}" to shop "${shop.name}"`);
                }
            }
        }

        console.log("✅ All Lay's Potato Chips ₹10 flavors successfully populated in database!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to add Lay's flavors:", error);
        process.exit(1);
    }
}

addLaysFlavors();
