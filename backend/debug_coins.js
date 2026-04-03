const { User, Order, WalletTransaction } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function debugData() {
    try {
        console.log('--- USER DATA ---');
        const users = await User.findAll({ limit: 5 });
        users.forEach(u => {
            console.log(`User: ${u.name}, Phone: ${u.phoneNumber}, Coins: ${u.laroCurrency}, Level: ${u.loyaltyLevel}`);
        });

        console.log('\n--- RECENT ORDERS ---');
        const orders = await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: ['shop']
        });
        orders.forEach(o => {
            console.log(`Order: ${o.id.substring(0, 8)}, Status: ${o.status}, Method: ${o.paymentMethod}, Total: ${o.totalAmount}`);
        });

        console.log('\n--- RECENT WALLET TRANSACTIONS ---');
        const txs = await WalletTransaction.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
        txs.forEach(t => {
            console.log(`Tx: ${t.type}, Amount: ${t.amount}, Balance After: ${t.balanceAfter}, Desc: ${t.description}`);
        });

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await sequelize.close();
    }
}

debugData();
