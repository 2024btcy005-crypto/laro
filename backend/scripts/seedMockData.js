require('dotenv').config();
const { sequelize } = require('../src/config/db');
const Shop = require('../src/models/Shop');
const Product = require('../src/models/Product');

const mockShops = [
    {
        name: 'Laro Warehouse',
        category: 'Groceries • Fruits • Vegetables',
        rating: 4.8,
        ratingCount: '10K+',
        deliveryTime: '15-20 min',
        costForTwo: '₹200 for two',
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
        promoted: true,
        discount: 'Flat ₹100 OFF on first order',
    },
    {
        name: 'Laro Pharmacy',
        category: 'Medicines • Healthcare • Wellness',
        rating: 4.9,
        ratingCount: '5K+',
        deliveryTime: '10-15 min',
        costForTwo: '₹150 for two',
        isOpen: true,
        imageUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=1000&auto=format&fit=crop',
        promoted: false,
        discount: 'Safe & Secure Delivery',
    }
];

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database. Syncing tables...');

        // Force table alter if they exist to apply our new columns
        await sequelize.sync({ alter: true });

        // Wipe the table clean so it's fresh
        await Product.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Cleared existing products.');
        await Shop.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Cleared existing shops.');

        // Insert mock data
        await Shop.bulkCreate(mockShops);
        console.log(`✅ successfully seeded ${mockShops.length} shops!`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedData();
