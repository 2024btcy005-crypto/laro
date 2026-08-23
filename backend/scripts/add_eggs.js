const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');

async function addSingleEggProduct() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Searching for Warehouse/Grocery shops...');

        const shops = await Shop.findAll();
        if (!shops || shops.length === 0) {
            console.log('No shops found in database.');
            process.exit(0);
        }

        console.log(`Found ${shops.length} shop(s). Adding/Updating Single Egg item...`);

        const eggItemData = {
            name: 'Single Farm Egg (1 Pc)',
            description: 'Fresh farm egg (1 Piece). High protein quality egg.',
            price: 7.00,
            originalPrice: 8.00,
            category: 'Dairy & Eggs',
            isAvailable: true,
            isVeg: false,
            imageUrl: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?q=80&w=500&auto=format&fit=crop',
            stockQuantity: 500,
            unit: 'pc'
        };

        for (const shop of shops) {
            // Check if product already exists in shop
            const [product, created] = await Product.findOrCreate({
                where: { name: eggItemData.name, shopId: shop.id },
                defaults: {
                    ...eggItemData,
                    shopId: shop.id,
                    universityId: shop.universityId || null
                }
            });

            if (!created) {
                await product.update({
                    price: eggItemData.price,
                    originalPrice: eggItemData.originalPrice,
                    imageUrl: eggItemData.imageUrl,
                    isVeg: false,
                    isAvailable: true
                });
                console.log(`  Updated Single Egg item in shop "${shop.name}" (${shop.id})`);
            } else {
                console.log(`  Added Single Egg item to shop "${shop.name}" (${shop.id})`);
            }
        }

        console.log('✅ Single Egg (₹7) successfully populated across database shops!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to add egg product:', error);
        process.exit(1);
    }
}

addSingleEggProduct();
