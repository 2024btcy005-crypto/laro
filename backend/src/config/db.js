const { Sequelize } = require('sequelize');
const config = require('./database')[process.env.NODE_ENV || 'development'];

const sequelize = config.use_env_variable
    ? new Sequelize(process.env[config.use_env_variable], config)
    : new Sequelize(config.database, config.username, config.password, config);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Database connected successfully.');

        // Auto-migrate new schema columns if missing
        try {
            await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER DEFAULT 0;');
            await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0;');
            await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastOrderDate" DATE;');
            await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totalStreakCoins" INTEGER DEFAULT 0;');
        } catch (migErr) {
            console.warn('[DB AUTO-MIGRATE WARNING]', migErr.message);
        }

        return true;
    } catch (error) {
        console.warn('⚠️  Database connection failed. Running without DB (mock/test mode).');
        console.warn('   Reason:', error.message);
        return false;
    }
};

module.exports = { sequelize, connectDB };
