require('dotenv').config();
const { sequelize } = require('../src/config/db');
const Shop = require('../src/models/Shop');
const Product = require('../src/models/Product');
const Config = require('../src/models/Config');

const mockProducts = {
    'Laro Warehouse': [
        // Fresh - Fruits
        { name: 'Alphonso Mango', description: 'Sweet and premium Alphonso mangoes.', price: 599, originalPrice: 650, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Fresh' },
        { name: 'Banana Robusta', description: 'Energy-packed fresh bananas (6 units).', price: 40, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ad99026.jpg', isVeg: true, category: 'Fresh' },
        { name: 'Red Apple', description: 'Crispy and juicy red apples from Shimla.', price: 180, originalPrice: 200, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fa2b?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Fresh' },
        { name: 'Seedless Grapes', description: 'Sweet green grapes (500g).', price: 90, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Fresh' },

        // Dairy - Now under 'Grocery' or we can add a 'Dairy' backend category
        { name: 'Fresh Milk (1L)', description: 'Full cream milk pasteurized for safety.', price: 66, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563636619-e91000b46618?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Grocery' },
        { name: 'Thick Curd (500g)', description: 'Creamy and thick farm fresh curd.', price: 45, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1485962391944-82ea5593962b?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Grocery' },
        { name: 'Fresh Buttermilk', description: 'Refreshing spiced buttermilk (200ml).', price: 15, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1571290274554-e91d90afb9bc?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Grocery' },
        { name: 'Amul Butter (100g)', description: 'Utterly butterly delicious butter.', price: 58, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Grocery' },

        // Grocery & kitchen
        { name: 'Aashirvaad Atta (5kg)', description: 'Premium whole wheat flour.', price: 285, originalPrice: 320, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Grocery & kitchen' },
        { name: 'Basmati Rice (1kg)', description: 'Long grain aromatic basmati rice.', price: 120, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Grocery & kitchen' },
        { name: 'Toor Dal (1kg)', description: 'Unpolished protein-rich pulses.', price: 165, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Grocery & kitchen' },

        // Snacks & drinks
        { name: 'Thums Up (750ml)', description: 'Strong carbonated soft drink.', price: 45, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Snacks & drinks' },
        { name: 'Potato Chips', description: 'Classic salted crispy potato chips.', price: 20, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Snacks & drinks' },
        { name: 'Oreo Biscuits', description: 'Milk\'s favorite cookie.', price: 30, originalPrice: 35, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Snacks & drinks' }
    ],
    'Laro Pharmacy': [
        { name: 'Paracetamol (650mg)', description: 'Relief from fever and pain. 15 tablets.', price: 30, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Medicines' },
        { name: 'Cough Syrup', description: 'Effective relief from dry and wet cough.', price: 120, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550572017-edb72aa7dc03?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Medicines' },
        { name: 'Adhesive Bandages', description: 'Pack of 20 sterile bandages.', price: 50, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1590611380053-90d195e59992?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Medicines' },
        { name: 'Vitamin C Tablets', description: 'Immunity booster, 50 chewable tablets.', price: 180, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1616671285412-87c47d76793c?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Medicines' },
        { name: 'Antiseptic Cream', description: 'Soothes and heals minor cuts & burns.', price: 85, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Medicines' },
        { name: 'Digital Thermometer', description: 'Quick and accurate temperature reading.', price: 250, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=500&auto=format&fit=crop', isVeg: true, category: 'Medicines' }
    ]
};

async function seedProducts() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database. Syncing tables...');

        await Product.sync({ alter: true });
        await Config.sync({ alter: true });

        // Wipe all existing products and configs
        await Product.destroy({ where: {}, truncate: { cascade: true } });
        await Config.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Cleared existing products and configs.');

        // Seed default Config row
        await Config.create({
            taxRate: 5.0,
            handlingCharge: 2.00,
            defaultDeliveryFee: 0.00
        });
        console.log('✅ Default Config seeded.');

        // Get all shops from the DB so we can map products to their real UUIDs
        const dbShops = await Shop.findAll();

        const productsToInsert = [];

        dbShops.forEach(shop => {
            const shopProducts = mockProducts[shop.name];
            if (shopProducts) {
                // Map the real DB shopId onto each product
                shopProducts.forEach(product => {
                    productsToInsert.push({
                        ...product,
                        shopId: shop.id
                    });
                });
            }
        });

        if (productsToInsert.length > 0) {
            await Product.bulkCreate(productsToInsert);
            console.log(`✅ successfully seeded ${productsToInsert.length} products!`);
        } else {
            console.log('No products mapped. Did you run the shop seeder first?');
        }

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedProducts();
