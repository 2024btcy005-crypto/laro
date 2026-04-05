const { sequelize } = require('./src/config/db');
const { Shop, University, Product } = require('./src/models');

async function checkDetailed() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        const shops = await Shop.findAll({
            include: [{ model: University, as: 'university' }]
        });

        console.log(`\n--- ALL SHOPS (${shops.length}) ---`);
        for (const s of shops) {
            const productCount = await Product.count({ where: { shopId: s.id } });
            console.log(`SHOP: ${s.name} | ID: ${s.id}`);
            console.log(`  Uni: ${s.university ? s.university.name : 'NULL'}`);
            console.log(`  Coords: ${s.latitude}, ${s.longitude}`);
            console.log(`  Warehouse: ${s.isWarehouse} | Active: ${s.isActive} | Open: ${s.isOpen}`);
            console.log(`  Products: ${productCount}`);
            console.log('-----------------------------------');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkDetailed();
