const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, Category } = require('../src/models');

async function addVegRiceItems() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Finding Friends Restaurant...');

        const shop = await Shop.findOne({
            where: { name: 'Friends Restaurant' }
        });

        if (!shop) {
            console.error('❌ Friends Restaurant not found.');
            process.exit(1);
        }

        console.log(`Using Shop: "${shop.name}" (ID: ${shop.id}, University: ${shop.universityId})`);

        // Ensure Category exists
        if (Category) {
            try {
                await Category.findOrCreate({
                    where: { name: 'Veg Rice Items' },
                    defaults: { description: 'Flavorsome vegetarian dum biryani and wok-tossed fried rice' }
                });
            } catch (catErr) {
                console.log('Category table note:', catErr.message);
            }
        }

        const vegRiceItems = [
            {
                name: 'Veg Dum Biryani',
                description: 'Aromatic long-grain basmati rice slow-cooked with fresh garden vegetables, paneer cubes, saffron, and rich biryani spices. Served with raita.',
                price: 160.00,
                originalPrice: 180.00,
                category: 'Veg Rice Items',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Veg Fried Rice',
                description: 'Classic Indo-Chinese style wok-tossed basmati rice with crunchy carrots, french beans, cabbage, and spring onions.',
                price: 130.00,
                originalPrice: 150.00,
                category: 'Veg Rice Items',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Paneer Fried Rice',
                description: 'Flavorful wok-fried rice tossed with golden pan-fried cottage cheese cubes, finely diced vegetables, and aromatic spices.',
                price: 150.00,
                originalPrice: 170.00,
                category: 'Veg Rice Items',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=500&auto=format&fit=crop'
            }
        ];

        for (const item of vegRiceItems) {
            const payload = {
                ...item,
                shopId: shop.id,
                universityId: shop.universityId
            };

            const [product, created] = await Product.findOrCreate({
                where: { name: item.name, shopId: shop.id },
                defaults: payload
            });

            if (!created) {
                await product.update(payload);
                console.log(`  🔄 Updated: [${item.category}] ${item.name} - ₹${item.price}`);
            } else {
                console.log(`  ✅ Added: [${item.category}] ${item.name} - ₹${item.price}`);
            }
        }

        console.log('\n🎉 Successfully added 3 Veg Rice Items to Friends Restaurant!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding veg rice items:', err);
        process.exit(1);
    }
}

addVegRiceItems();
