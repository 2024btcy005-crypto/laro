const { sequelize } = require('./src/config/db');
const { WalletTransaction } = require('./src/models');

async function check() {
    try {
        console.log('Checking database...');
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('Tables:', tables);

        if (tables.includes('wallet_transactions')) {
            const columns = await sequelize.getQueryInterface().describeTable('wallet_transactions');
            console.log('Columns in wallet_transactions:', Object.keys(columns));

            console.log('Attempting to fetch with WalletTransaction.findAll...');
            const data = await WalletTransaction.findAll({ limit: 1 });
            console.log('Fetch successful, count:', data.length);
        } else {
            console.log('wallet_transactions table MISSING!');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error checking DB:', err);
        process.exit(1);
    }
}

check();
