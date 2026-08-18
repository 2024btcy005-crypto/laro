const { sequelize } = require('./src/config/db');
require('./src/models'); // Load all models and associations

async function syncDatabase() {
    try {
        console.log('🔄 Connecting to Supabase and syncing database tables...');
        await sequelize.authenticate();
        console.log('✅ Connection authenticated.');

        await sequelize.sync({ alter: true });
        console.log('🎉 All database tables successfully created/synced in Supabase!');
    } catch (err) {
        console.error('❌ Error syncing database:', err);
    } finally {
        await sequelize.close();
    }
}

syncDatabase();
