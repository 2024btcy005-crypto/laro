const { sequelize } = require('./src/config/db');
const { Shop, Product } = require('./src/models');

async function fixWarehouse() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Update all "LARO WAREHOUSE" entries
        const [updatedCount] = await Shop.update(
            {
                isWarehouse: true,
                isActive: true,
                isOpen: true,
                category: 'Snacks' // Setting to a category that exists in UI filters
            },
            { where: { name: 'LARO WAREHOUSE' } }
        );
        console.log(`✅ Updated ${updatedCount} warehouse entries.`);

        // 2. Ensure its products are also active and have correct university IDs
        // If there are multiple warehouses, we may want to merge them, 
        // but for now let's just make sure they are all visible.

        const warehouses = await Shop.findAll({ where: { name: 'LARO WAREHOUSE' } });
        for (const w of warehouses) {
            await Product.update(
                { isAvailable: true },
                { where: { shopId: w.id } }
            );
        }
        console.log('✅ Updated products availability.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

fixWarehouse();
