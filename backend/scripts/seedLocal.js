require('dotenv').config();
const { sequelize } = require('../src/config/db');
const { Shop, Product, University, User } = require('../src/models');
const bcrypt = require('bcryptjs');

async function seedLocal() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Syncing tables...');
        await sequelize.sync({ alter: true });

        // 1. Create a University
        const [university] = await University.findOrCreate({
            where: { name: 'TEST UNIVERSITY' },
            defaults: {
                address: 'Test Campus, India',
                radius: 5,
                isActive: true
            }
        });
        console.log('University created/found:', university.name);

        // 2. Create a Global Shop (Warehouse) at 0,0
        const [warehouse] = await Shop.findOrCreate({
            where: { name: 'LARO WAREHOUSE' },
            defaults: {
                category: 'Global Store',
                isOpen: true,
                isActive: true,
                latitude: '0.00000000',
                longitude: '0.00000000',
                serviceRadius: 9999,
                isWarehouse: true,
                universityId: null
            }
        });
        console.log('Warehouse created/found:', warehouse.name);

        // 3. Create a Local Shop at your coordinates (if you have them) or a generic India location
        // Example: Bangalore coordinates
        const [localShop] = await Shop.findOrCreate({
            where: { name: 'CAMPUS EXPRESS' },
            defaults: {
                category: 'Snacks & Drinks',
                isOpen: true,
                isActive: true,
                latitude: '12.9716',
                longitude: '77.5946',
                serviceRadius: 10,
                universityId: university.id
            }
        });
        console.log('Local shop created/found:', localShop.name);

        // 4. Add Products to Warehouse
        const warehouseProducts = [
            { name: 'LAYS POTATO CHIPS', price: 10, category: 'Snacks', isAvailable: true, universityId: null },
            { name: 'COKE 250ML', price: 20, category: 'Drinks', isAvailable: true, universityId: null }
        ];

        for (const p of warehouseProducts) {
            await Product.findOrCreate({
                where: { name: p.name, shopId: warehouse.id },
                defaults: { ...p, shopId: warehouse.id }
            });
        }

        // 5. Add Products to Local Shop
        const localProducts = [
            { name: 'UNIVERSITY HOODIE', price: 599, category: 'Apparel', isAvailable: true, universityId: university.id },
            { name: 'STATIONERY KIT', price: 150, category: 'Study', isAvailable: true, universityId: university.id }
        ];

        for (const p of localProducts) {
            await Product.findOrCreate({
                where: { name: p.name, shopId: localShop.id },
                defaults: { ...p, shopId: localShop.id }
            });
        }

        console.log('✅ Local seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedLocal();
