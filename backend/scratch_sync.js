const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { sequelize, connectDB } = require('./src/config/db');
// Import models/index to register all model associations
require('./src/models');

async function syncDatabase() {
    console.log('🔄 Connecting to database...');
    const connected = await connectDB();
    if (!connected) {
        console.error('❌ Failed to connect to database.');
        process.exit(1);
    }
    
    try {
        console.log('🔄 Syncing models...');
        await sequelize.sync({ alter: true });
        console.log('✅ All database tables successfully created/updated.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

syncDatabase();
