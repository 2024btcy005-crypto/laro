const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product } = require('../src/models');

async function createDemoOffersAndCombos() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();

        const warehouse = await Shop.findOne({ where: { isWarehouse: true } });
        if (!warehouse) {
            console.error('Warehouse shop not found.');
            process.exit(1);
        }

        // 1. Mark Lay's & Campa Cola items as B2G1 (Buy 2 Get 1 Free)
        const b2g1Products = await Product.findAll({
            where: {
                shopId: warehouse.id,
                name: ['Lay\'s American Style Cream & Onion', 'Lay\'s Classic Salted', 'Campa Cola (200ml)']
            }
        });

        for (const p of b2g1Products) {
            await p.update({ isB2G1: true });
            console.log(`  Set B2G1 🎁 offer on "${p.name}"`);
        }

        // 2. Create "Student Mega Meal Combo" in LARO WAREHOUSE
        const [comboProduct, created] = await Product.findOrCreate({
            where: { name: 'Student Mega Meal Combo', shopId: warehouse.id },
            defaults: {
                name: 'Student Mega Meal Combo',
                description: 'Complete Meal Deal: 1x Lay\'s Magic Masala + 1x Campa Cola (500ml) + 1x Roasted Peanuts!',
                price: 35.00,
                originalPrice: 45.00,
                category: 'Snacks & drinks',
                isAvailable: true,
                isEdible: true,
                isVeg: true,
                isB2G1: false,
                isCombo: true,
                imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=500&auto=format&fit=crop',
                stockQuantity: 500,
                unit: 'combo',
                shopId: warehouse.id,
                universityId: warehouse.universityId || null
            }
        });

        if (!created) {
            await comboProduct.update({
                price: 35.00,
                originalPrice: 45.00,
                isCombo: true,
                isAvailable: true
            });
            console.log(`  Updated demo combo "${comboProduct.name}"`);
        } else {
            console.log(`  Created demo combo "${comboProduct.name}"`);
        }

        console.log('✅ Demo B2G1 offers and Combo meal products created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating demo offers:', err);
        process.exit(1);
    }
}

createDemoOffersAndCombos();
