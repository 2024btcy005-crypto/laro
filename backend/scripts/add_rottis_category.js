const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, Category } = require('../src/models');

async function addRottisCategory() {
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
                    where: { name: 'Rottis' },
                    defaults: { description: 'Fresh, soft whole wheat flatbreads, pulkas, and chapathis' }
                });
            } catch (catErr) {
                console.log('Category table note:', catErr.message);
            }
        }

        const rottiItems = [
            {
                name: 'Pulka (Phulka)',
                description: 'Soft, puffed whole wheat flatbread flame-roasted to perfection without oil. Light and healthy.',
                price: 15.00,
                originalPrice: 20.00,
                category: 'Rottis',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 200,
                unit: 'pc',
                imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Chapathi',
                description: 'Freshly made traditional whole wheat flatbread pan-toasted on tawa with a touch of ghee/butter.',
                price: 20.00,
                originalPrice: 25.00,
                category: 'Rottis',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 200,
                unit: 'pc',
                imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=500&auto=format&fit=crop'
            }
        ];

        for (const item of rottiItems) {
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

        console.log('\n🎉 Successfully added Rottis category with Pulka and Chapathi to Friends Restaurant!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding rottis:', err);
        process.exit(1);
    }
}

addRottisCategory();
