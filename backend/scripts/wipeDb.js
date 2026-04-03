require('dotenv').config();
const { sequelize } = require('../src/config/db');

async function wipeDatabase() {
    try {
        console.log('⚠️ Connecting to database to wipe all tables...');
        // Force: true drops all tables and recreates them
        await sequelize.sync({ force: true });
        console.log('✅ Database successfully wiped and recreated (Empty State).');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to wipe database:', err.message);
        process.exit(1);
    }
}

wipeDatabase();
