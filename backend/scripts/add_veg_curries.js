const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, Category } = require('../src/models');

async function addVegCurries() {
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
                    where: { name: 'Veg Curries' },
                    defaults: { description: 'Rich, flavorful, and aromatic vegetarian main course curries and gravies' }
                });
            } catch (catErr) {
                console.log('Category table note:', catErr.message);
            }
        }

        const vegCurryItems = [
            {
                name: 'Paneer Curry (Paneer Butter Masala)',
                description: 'Soft cottage cheese cubes cooked in a rich, creamy, and mildly spiced tomato-butter gravy with aromatic kasuri methi.',
                price: 180.00,
                originalPrice: 200.00,
                category: 'Veg Curries',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Mushroom Curry (Mushroom Masala)',
                description: 'Fresh button mushrooms simmered in a spiced onion-tomato gravy with ginger, garlic, and fresh coriander.',
                price: 170.00,
                originalPrice: 190.00,
                category: 'Veg Curries',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Gobi Curry (Gobi Masala)',
                description: 'Tender cauliflower florets cooked with roasted spices, tomatoes, onions, and garnished with cilantro.',
                price: 150.00,
                originalPrice: 170.00,
                category: 'Veg Curries',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=500&auto=format&fit=crop'
            }
        ];

        for (const item of vegCurryItems) {
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
                console.log(`  🔄 Updated: [${item.category}] ${item.name} (${item.isVeg ? 'VEG 🟢' : 'NON-VEG 🔴'}) - ₹${item.price}`);
            } else {
                console.log(`  ✅ Added: [${item.category}] ${item.name} (${item.isVeg ? 'VEG 🟢' : 'NON-VEG 🔴'}) - ₹${item.price}`);
            }
        }

        console.log('\n🎉 Successfully added Veg Curries category with Paneer, Mushroom, and Gobi curries!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding veg curries:', err);
        process.exit(1);
    }
}

addVegCurries();
