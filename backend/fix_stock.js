const { sequelize } = require('./src/config/db');
const { Product } = require('./src/models');

async function fixStock() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        const [updatedCount] = await Product.update(
            { stockQuantity: 100 },
            { where: {} } // Update all products
        );

        console.log(`✅ Successfully updated stock for ${updatedCount} products.`);
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

fixStock();
