require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'zippit_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function updateEnums() {
    try {
        await client.connect();

        console.log('--- UPDATING ENUMS ---');

        try {
            await client.query(`ALTER TYPE "enum_orders_paymentMethod" ADD VALUE 'laro_coins'`);
            console.log('✅ Added "laro_coins" to paymentMethod enum');
        } catch (err) {
            if (err.code === '42710') { // duplicate_object
                console.log('ℹ️ "laro_coins" already exists in paymentMethod enum');
            } else {
                throw err;
            }
        }

        try {
            await client.query(`ALTER TYPE "enum_orders_paymentStatus" ADD VALUE 'completed'`);
            console.log('✅ Added "completed" to paymentStatus enum');
        } catch (err) {
            if (err.code === '42710') {
                console.log('ℹ️ "completed" already exists in paymentStatus enum');
            } else {
                throw err;
            }
        }

        console.log('--- ENUM UPDATE COMPLETE ---');

    } catch (err) {
        console.error('❌ Failed to update enums:', err.message);
    } finally {
        await client.end();
    }
}

updateEnums();
