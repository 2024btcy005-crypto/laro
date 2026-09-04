const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, Category } = require('../src/models');

async function addNonVegCurries() {
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
                    where: { name: 'Non-Veg Curries' },
                    defaults: { description: 'Delicious and rich non-vegetarian curries, gravies, and egg specialties' }
                });
            } catch (catErr) {
                console.log('Category table note:', catErr.message);
            }
        }

        const nonVegCurryItems = [
            {
                name: 'Chicken Curry',
                description: 'Tender chicken pieces slow-cooked in a rich, spiced onion-tomato gravy with traditional spices and fresh herbs.',
                price: 190.00,
                originalPrice: 220.00,
                category: 'Non-Veg Curries',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Mughlai Chicken Curry',
                description: 'Royal and creamy Mughlai chicken curry prepared with cashew paste, egg, saffron, and aromatic whole spices.',
                price: 230.00,
                originalPrice: 260.00,
                category: 'Non-Veg Curries',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Butter Chicken Curry',
                description: 'Succulent tandoori chicken pieces simmered in a velvety, buttery tomato gravy with fresh cream and dried fenugreek leaves.',
                price: 220.00,
                originalPrice: 250.00,
                category: 'Non-Veg Curries',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Cashew Chicken Curry',
                description: 'Rich and luxurious chicken gravy prepared with roasted crunchy cashews and a flavorful cashew nut cream base.',
                price: 240.00,
                originalPrice: 270.00,
                category: 'Non-Veg Curries',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Egg Bhurji',
                description: 'Spiced scrambled eggs cooked on high flame with finely chopped onions, juicy tomatoes, green chillies, and coriander.',
                price: 120.00,
                originalPrice: 140.00,
                category: 'Non-Veg Curries',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=500&auto=format&fit=crop'
            }
        ];

        for (const item of nonVegCurryItems) {
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

        console.log('\n🎉 Successfully added Non-Veg Curries category with 5 items to Friends Restaurant!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding non-veg curries:', err);
        process.exit(1);
    }
}

addNonVegCurries();
