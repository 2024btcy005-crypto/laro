const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, Category } = require('../src/models');

async function addBiryaniCategory() {
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
                    where: { name: 'Biryani' },
                    defaults: { description: 'Royal and authentic Dum Biryanis slow cooked with long grain basmati rice and royal spices' }
                });
            } catch (catErr) {
                console.log('Category table note:', catErr.message);
            }
        }

        const biryaniItems = [
            {
                name: 'Special Chicken Dum Biryani',
                description: 'Authentic Hyderabadi dum biryani cooked with marinated tender chicken pieces, aromatic basmati rice, saffron, and rich spices. Served with Mirchi ka Salan & Raita.',
                price: 240.00,
                originalPrice: 270.00,
                category: 'Biryani',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Chicken 65 Biryani',
                description: 'A fusion feast of spiced biryani rice topped with crispy, spicy Chicken 65 bites and caramelized onions.',
                price: 260.00,
                originalPrice: 290.00,
                category: 'Biryani',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Paneer Tikka Biryani',
                description: 'Smoky char-grilled tandoori paneer tikka layered with fragrant basmati rice infused with mint and saffron. Served with cool raita.',
                price: 200.00,
                originalPrice: 230.00,
                category: 'Biryani',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Egg Dum Biryani',
                description: 'Flavorful spiced basmati rice slow-cooked on dum with golden roasted boiled eggs, aromatic herbs, and fried onions.',
                price: 170.00,
                originalPrice: 190.00,
                category: 'Biryani',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'portion',
                imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=500&auto=format&fit=crop'
            }
        ];

        for (const item of biryaniItems) {
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

        console.log('\n🎉 Successfully added 4 Biryani Items to Friends Restaurant under "Biryani" category!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding biryani items:', err);
        process.exit(1);
    }
}

addBiryaniCategory();
