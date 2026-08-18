const { sequelize } = require('./src/config/db');
const { University, User, Shop, Product, Order, Quest } = require('./src/models');

async function removeAllUniversities() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Unlink references before deleting universities to prevent foreign key errors
        console.log('Unlinking university references from users, shops, products, orders, quests...');
        await User.update({ universityId: null }, { where: {} });
        await Shop.update({ universityId: null }, { where: {} });
        await Product.update({ universityId: null }, { where: {} });
        await Order.update({ universityId: null }, { where: {} });
        await Quest.destroy({ where: {} });

        // Delete all records from universities table
        const deletedCount = await University.destroy({ where: {}, truncate: false });
        console.log(`🎉 Successfully removed all ${deletedCount} universities from the database!`);

    } catch (err) {
        console.error('❌ Error removing universities:', err);
    } finally {
        await sequelize.close();
    }
}

removeAllUniversities();
