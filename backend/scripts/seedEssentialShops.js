const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Shop, Product, University } = require('../src/models');

async function seedJoyUniversityData() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connected! Seeding Joy University data...');

        // 1. Find or Create Joy University
        const [joyUni] = await University.findOrCreate({
            where: { name: 'JOY UNIVERSITY' },
            defaults: {
                address: 'Main Campus, Joy University',
                radius: 10,
                isActive: true
            }
        });
        const universityId = joyUni.id;
        console.log('✅ Using University:', joyUni.name, `(ID: ${universityId})`);

        // Helper to create shop and products
        const createShopWithProducts = async (shopData, productList) => {
            const [shop] = await Shop.findOrCreate({
                where: { name: shopData.name, universityId: universityId },
                defaults: { ...shopData, universityId: universityId }
            });
            console.log(`\n🏪 Shop: ${shop.name}`);

            for (const p of productList) {
                const [product, created] = await Product.findOrCreate({
                    where: { name: p.name, shopId: shop.id },
                    defaults: { ...p, shopId: shop.id, universityId: universityId, stockQuantity: 100 }
                });
                if (created) console.log(`  - Added: ${product.name}`);
            }
        };

        // 2. LARO XEROX
        await createShopWithProducts(
            {
                name: 'LARO XEROX',
                description: 'Fast printing, Xerox, and Stationery essentials.',
                category: 'Xerox',
                imageUrl: 'https://images.unsplash.com/photo-1588421357574-87938a86fa28?w=600&q=80',
                isOpen: true,
                isActive: true,
                latitude: '0.00000000',
                longitude: '0.00000000',
                serviceRadius: 9999,
                isWarehouse: true
            },
            [
                { name: 'A4 B/W Print (Single Sided)', price: 2, category: 'Printing', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599427389274-846178c19985?w=400&q=80' },
                { name: 'Color Print (A4)', price: 10, category: 'Printing', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599427389274-846178c19985?w=400&q=80' },
                { name: 'Spiral Binding (Medium)', price: 40, category: 'Stationery', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&q=80' },
                { name: 'Classmate Notebook (120 Pages)', price: 45, category: 'Books', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=400&q=80' },
                { name: 'Reynolds Ball Pen (Blue)', price: 10, category: 'Stationery', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80' },
                { name: 'Scientific Calculator (Casio)', price: 950, category: 'Stationery', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1594819047050-99defca82545?w=400&q=80' }
            ]
        );

        // 3. LARO PHARMACY
        await createShopWithProducts(
            {
                name: 'LARO PHARMACY',
                description: 'Medicines and Healthcare products delivered fast.',
                category: 'Pharmacy',
                imageUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=1000&auto=format&fit=crop',
                isOpen: true,
                isActive: true,
                latitude: '0.00000000',
                longitude: '0.00000000',
                serviceRadius: 9999,
                isWarehouse: true
            },
            [
                { name: 'PARACETAMOL 500MG', price: 15, category: 'Medicines', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80' },
                { name: 'BAND-AID (10 PACK)', price: 30, category: 'Healthcare', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80' },
                { name: 'DETTOL ANTISEPTIC 60ML', price: 45, category: 'Healthcare', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&q=80' }
            ]
        );

        // 4. LARO WAREHOUSE
        await createShopWithProducts(
            {
                name: 'LARO WAREHOUSE',
                description: 'Your one-stop shop for all essentials - Groceries and more.',
                category: 'Warehouse',
                imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
                isOpen: true,
                isActive: true,
                latitude: '0.00000000',
                longitude: '0.00000000',
                serviceRadius: 9999,
                isWarehouse: true
            },
            [
                { name: 'AMUL MILK 500ML', price: 33, category: 'Dairy', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1550583724-12558142ab46?w=400&q=80' },
                { name: 'MOTHER DAIRY MILK 500ML', price: 32, category: 'Dairy', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563636619-e9107da5a1b3?w=400&q=80' },
                { name: 'OREO BISCUITS (FAMILY PACK)', price: 40, category: 'Snacks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
                { name: 'PARLE-G (GOLD)', price: 10, category: 'Snacks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1510341753381-193498875323?w=400&q=80' },
                { name: 'MARIE GOLD BISCUITS', price: 25, category: 'Snacks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1533062601953-7c83ec850197?w=400&q=80' },
                { name: 'MAGGI NOODLES (4-PACK)', price: 60, category: 'Snacks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1612927608282-b280ff17540a?w=400&q=80' },
                { name: 'KURKURE (MASALA MUNCH)', price: 20, category: 'Snacks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&q=80' },
                { name: 'LAYS POTATO CHIPS', price: 10, category: 'Snacks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1566478433002-3f746643c14a?w=400&q=80' },
                { name: 'COKE 250ML', price: 20, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
                { name: 'SPRITE 250ML', price: 20, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1625772290748-39126ddd91f1?w=400&q=80' },
                { name: 'THUMS UP 250ML', price: 20, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
                { name: 'LIMCA 250ML', price: 20, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
                { name: 'CAMPA COLA 250ML', price: 15, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
                { name: 'CAMPA LEMON 250ML', price: 15, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1625772290748-39126ddd91f1?w=400&q=80' },
                { name: 'CAMPA ORANGE 250ML', price: 15, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' },
                { name: 'BISLERI WATER 1L', price: 20, category: 'Drinks', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1548939619-d9d303273118?w=400&q=80' },
                { name: 'FROZEN PEAS 500G', price: 80, category: 'Fresh', isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80' }
            ]
        );

        console.log('\n✅ All data seeded specifically for JOY UNIVERSITY!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedJoyUniversityData();
