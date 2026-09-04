const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, Category } = require('../src/models');

async function addNonVegRiceItems() {
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
                    where: { name: 'Non-Veg Rice Items' },
                    defaults: { description: 'Flavorsome biryanis and wok-tossed non-vegetarian fried rice' }
                });
            } catch (catErr) {
                console.log('Category table note:', catErr.message);
            }
        }

        const riceItems = [
            {
                name: 'Chicken Dum Biryani (Hyderabadi Style)',
                description: 'Fragrant basmati rice layered with spiced marinated chicken pieces, slow-cooked in traditional dum style. Served with raita & salan.',
                price: 220.00,
                originalPrice: 250.00,
                category: 'Non-Veg Rice Items',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Chicken Fried Rice',
                description: 'Wok-tossed aromatic basmati rice with shredded chicken, scrambled eggs, carrots, beans, and seasoned with oriental sauces.',
                price: 170.00,
                originalPrice: 190.00,
                category: 'Non-Veg Rice Items',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Egg Fried Rice',
                description: 'Fluffy rice stir-fried with farm fresh golden scrambled eggs, scallions, black pepper, and garlic soy seasonings.',
                price: 140.00,
                originalPrice: 160.00,
                category: 'Non-Veg Rice Items',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Schezwan Chicken Fried Rice',
                description: 'Spicy and tangy wok-tossed rice with tender chicken chunks, bell peppers, and fiery homemade Schezwan sauce.',
                price: 180.00,
                originalPrice: 200.00,
                category: 'Non-Veg Rice Items',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=500&auto=format&fit=crop'
            }
        ];

        for (const item of riceItems) {
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

        console.log('\n🎉 Successfully added 4 Non-Veg Rice Items to Friends Restaurant!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding rice items:', err);
        process.exit(1);
    }
}

addNonVegRiceItems();
