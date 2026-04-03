const { Order, User } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function checkOrders() {
    try {
        const orders = await Order.findAll({
            include: [{ model: User, as: 'customer', attributes: ['name', 'email'] }]
        });
        console.log('Total Orders found:', orders.length);
        orders.forEach(o => {
            console.log(`Order ID: ${o.id}, Status: ${o.status}, Customer: ${o.customer?.name} (${o.customer?.email}), Amount: ${o.totalAmount}`);
        });

        const users = await User.findAll({ attributes: ['id', 'name', 'email'] });
        console.log('\nRecent Users:');
        users.slice(-5).forEach(u => {
            console.log(`User ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
checkOrders();
