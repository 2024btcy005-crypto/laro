const { sequelize } = require('./src/config/db');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected for streak migration.');

        await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER DEFAULT 0;');
        await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0;');
        await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastOrderDate" DATE;');
        await sequelize.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totalStreakCoins" INTEGER DEFAULT 0;');

        console.log('✅ PostgreSQL users table migrated with streak columns!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

migrate();
