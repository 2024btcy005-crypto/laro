const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');

async function addCampaDrinks() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Searching for shops...');

        const shops = await Shop.findAll();
        if (!shops || shops.length === 0) {
            console.log('No shops found in database.');
            process.exit(0);
        }

        console.log(`Found ${shops.length} shop(s). Adding/Updating Campa soft drink items...`);

        const campaItems = [
            {
                name: 'Campa Cola (250ml)',
                description: 'Classic refreshing Campa Cola carbonated soft drink (250ml).',
                price: 15.00,
                originalPrice: 20.00,
                category: 'Drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 200,
                unit: 'bottle'
            },
            {
                name: 'Campa Orange (250ml)',
                description: 'Tangy and citrusy Campa Orange carbonated soft drink (250ml).',
                price: 15.00,
                originalPrice: 20.00,
                category: 'Drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 200,
                unit: 'bottle'
            },
            {
                name: 'Campa Lemon (250ml)',
                description: 'Crisp and zesty Campa Lemon sparkling soda (250ml).',
                price: 15.00,
                originalPrice: 20.00,
                category: 'Drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1625772290748-39126ddd91f1?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 200,
                unit: 'bottle'
            },
            {
                name: 'Campa Jeera Masala Soda (250ml)',
                description: 'Authentic Indian spiced fizzy jeera masala soda (250ml).',
                price: 15.00,
                originalPrice: 20.00,
                category: 'Drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 200,
                unit: 'bottle'
            },
            {
                name: 'Campa Cola (500ml)',
                description: 'Large Campa Cola refreshing bottle (500ml).',
                price: 30.00,
                originalPrice: 35.00,
                category: 'Drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 150,
                unit: 'bottle'
            },
            {
                name: 'Campa Orange (500ml)',
                description: 'Large Campa Orange refreshing bottle (500ml).',
                price: 30.00,
                originalPrice: 35.00,
                category: 'Drinks',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 150,
                unit: 'bottle'
            }
        ];

        for (const shop of shops) {
            for (const item of campaItems) {
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
                        isAvailable: true
                    });
                    console.log(`  Updated "${item.name}" in shop "${shop.name}"`);
                } else {
                    console.log(`  Added "${item.name}" to shop "${shop.name}"`);
                }
            }
        }

        console.log('✅ All Campa soft drinks flavors successfully populated in database!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to add Campa soft drinks:', error);
        process.exit(1);
    }
}

addCampaDrinks();
