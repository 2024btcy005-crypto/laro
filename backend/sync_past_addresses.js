require('dotenv').config();
const { User, Order } = require('./src/models');
const { connectDB, sequelize } = require('./src/config/db');

async function syncAddresses() {
    await connectDB();

    try {
        // Find users with NO address
        const users = await User.findAll({ where: { address: null } });
        let updated = 0;

        for (let user of users) {
            // Find their most recent order that has a delivery address
            const lastOrder = await Order.findOne({
                where: { customerId: user.id },
                order: [['createdAt', 'DESC']]
            });

            if (lastOrder && lastOrder.deliveryAddress) {
                user.address = lastOrder.deliveryAddress;
                await user.save();
                console.log(`✅ Synced address for user ${user.name}: ${lastOrder.deliveryAddress}`);
                updated++;
            }
        }
        console.log(`\n🎉 Successfully backfilled ${updated} user addresses from past orders.`);
    } catch (err) {
        console.error("Migration failed:", err.message);
    }
    process.exit(0);
}

syncAddresses();
