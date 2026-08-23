const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');

async function addGroceryItem() {
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

        const groceryItems = [
            {
                name: 'Maggi 2-Minute Masala Noodles',
                description: 'Classic 2-minute instant masala noodles.',
                price: 15.00,
                originalPrice: 15.00,
                category: 'Grocery',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1612927608282-b280ff17540a?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pack',
                shopId: warehouse.id,
                universityId: warehouse.universityId || null
            },
            {
                name: 'Tata Salt Vacuum Evaporated (1kg)',
                description: 'Desh Ka Namak, iodized salt (1kg).',
                price: 28.00,
                originalPrice: 28.00,
                category: 'Grocery',
                isAvailable: true,
                isVeg: true,
                imageUrl: 'https://images.unsplash.com/photo-1518110165400-0a671f5470d0?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'pack',
                shopId: warehouse.id,
                universityId: warehouse.universityId || null
            }
        ];

        for (const item of groceryItems) {
            const [product, created] = await Product.findOrCreate({
                where: { name: item.name, shopId: warehouse.id },
                defaults: item
            });

            if (!created) {
                await product.update({
                    price: item.price,
                    category: 'Grocery',
                    isAvailable: true,
                    stockQuantity: 500,
                    imageUrl: item.imageUrl
                });
                console.log(`  Updated grocery item "${item.name}"`);
            } else {
                console.log(`  Added grocery item "${item.name}"`);
            }
        }

        console.log('✅ Grocery items successfully added to LARO WAREHOUSE!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding grocery item:', err);
        process.exit(1);
    }
}

addGroceryItem();
