const { sequelize } = require('./src/config/db');

async function fixEnum() {
    try {
        console.log('Attempting to fix ENUM "enum_orders_paymentStatus"...');

        // Add "completed" to the ENUM if it doesn't exist
        // Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block in some Postgres versions,
        // but Sequelize's query doesn't use a transaction by default unless specified.
        await sequelize.query("ALTER TYPE \"public\".\"enum_orders_paymentStatus\" ADD VALUE IF NOT EXISTS 'completed'");

        console.log('✅ ENUM fix applied successfully.');

        // Also check if any other values are missing
        await sequelize.query("ALTER TYPE \"public\".\"enum_orders_paymentMethod\" ADD VALUE IF NOT EXISTS 'laro_coins'");
        console.log('✅ paymentMethod ENUM check complete.');

    } catch (e) {
        console.error('❌ Error fixing ENUM:', e.message);
        if (e.message.includes('already exists')) {
            console.log('ENUM values already exist, no change needed.');
        }
    } finally {
        await sequelize.close();
    }
}

fixEnum();
