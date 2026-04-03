// Script: create a Xerox shop in the DB
// Run from: backend directory
// Command: node scripts/seedXeroxShop.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sequelize } = require('../src/config/db');
const { Shop } = require('../src/models');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB connected');

        const shop = await Shop.create({
            name: 'Campus Xerox & Printing',
            address: 'Near Main Library, Campus Road',
            description: 'Fast & affordable xerox, colour printing, spiral binding, lamination and stationery.',
            category: 'Xerox',
            imageUrl: 'https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=600&q=80',
            isOpen: true,
            rating: 4.5,
            ratingCount: '28',
            deliveryTime: '5-10 min',
            costForTwo: '₹5 per page',
            openingTime: '08:00',
            closingTime: '21:00',
        });

        console.log(`✅ Created shop: "${shop.name}" with id: ${shop.id}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seed();
