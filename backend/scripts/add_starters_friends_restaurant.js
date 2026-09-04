const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, University } = require('../src/models');

async function addStarters() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Finding Friends Restaurant...');

        let shop = await Shop.findOne({
            where: { name: 'Friends Restaurant' }
        });

        if (!shop) {
            console.log('Friends Restaurant not found. Searching for university...');
            const uni = await University.findOne({ where: { name: 'JOY UNIVERSITY' } });
            console.log('Creating Friends Restaurant for JOY UNIVERSITY...');
            shop = await Shop.create({
                name: 'Friends Restaurant',
                category: 'Food & Canteen',
                isOpen: true,
                isActive: true,
                latitude: '8.4830',
                longitude: '77.7840',
                serviceRadius: 10,
                isWarehouse: false,
                universityId: uni ? uni.id : null
            });
        }

        console.log(`Using Shop: "${shop.name}" (ID: ${shop.id}, University: ${shop.universityId})`);

        const starters = [
            // --- 4 VEG STARTERS ---
            {
                name: 'Paneer Tikka (6 Pcs)',
                description: 'Tender cottage cheese cubes marinated in spiced yogurt and grilled in tandoor with onions and capsicums.',
                price: 180.00,
                originalPrice: 200.00,
                category: 'Starters',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Crispy Veg Spring Rolls (4 Pcs)',
                description: 'Golden crispy rolls stuffed with finely shredded seasoned vegetables, served with sweet chili sauce.',
                price: 130.00,
                originalPrice: 150.00,
                category: 'Starters',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Gobi Manchurian (Dry)',
                description: 'Crispy batter-fried cauliflower florets tossed in tangy Indo-Chinese Manchurian sauce with garlic and spring onions.',
                price: 140.00,
                originalPrice: 160.00,
                category: 'Starters',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Crispy Corn Pepper Fry',
                description: 'Golden fried sweet corn kernels tossed with crunchy bell peppers, freshly crushed black pepper, and herbs.',
                price: 120.00,
                originalPrice: 140.00,
                category: 'Starters',
                isVeg: true,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=500&auto=format&fit=crop'
            },

            // --- 6 NON-VEG STARTERS ---
            {
                name: 'Chicken 65',
                description: 'Classic South Indian style spicy, deep-fried chicken chunks tossed with curry leaves, green chilies, and garlic.',
                price: 190.00,
                originalPrice: 220.00,
                category: 'Starters',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Tandoori Chicken (Half - 4 Pcs)',
                description: 'Bone-in chicken marinated in rich tandoori masala and roasted over glowing charcoal.',
                price: 240.00,
                originalPrice: 270.00,
                category: 'Starters',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Chicken Tikka (6 Pcs)',
                description: 'Boneless succulent chicken pieces marinated in yogurt & tandoori spices, grilled to perfection.',
                price: 210.00,
                originalPrice: 240.00,
                category: 'Starters',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Chilli Chicken (Dry)',
                description: 'Batter-fried crispy chicken cubes tossed with diced bell peppers, onions, soy sauce, and green chillies.',
                price: 200.00,
                originalPrice: 230.00,
                category: 'Starters',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Chicken Lollipop (5 Pcs)',
                description: 'Crispy fried chicken winglets shaped into lollipops, served with spicy Szechuan dipping sauce.',
                price: 220.00,
                originalPrice: 250.00,
                category: 'Starters',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1527477378408-1bc0ae05b4da?q=80&w=500&auto=format&fit=crop'
            },
            {
                name: 'Dragon Chicken',
                description: 'Crispy chicken strips tossed in a fiery sweet-and-spicy sauce with cashew nuts and red chili peppers.',
                price: 220.00,
                originalPrice: 250.00,
                category: 'Starters',
                isVeg: false,
                isEdible: true,
                isAvailable: true,
                stockQuantity: 100,
                unit: 'plate',
                imageUrl: 'https://images.unsplash.com/photo-1625938145744-e380515399b7?q=80&w=500&auto=format&fit=crop'
            }
        ];

        for (const item of starters) {
            const itemPayload = {
                ...item,
                shopId: shop.id,
                universityId: shop.universityId
            };

            const [product, created] = await Product.findOrCreate({
                where: { name: item.name, shopId: shop.id },
                defaults: itemPayload
            });

            if (!created) {
                await product.update(itemPayload);
                console.log(`  🔄 Updated: ${item.name} (${item.isVeg ? 'VEG' : 'NON-VEG'})`);
            } else {
                console.log(`  ✅ Added: ${item.name} (${item.isVeg ? 'VEG' : 'NON-VEG'})`);
            }
        }

        console.log('\n🎉 Successfully added 4 Veg and 6 Non-Veg starters to Friends Restaurant!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding starters:', err);
        process.exit(1);
    }
}

addStarters();
