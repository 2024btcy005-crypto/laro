const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local first
const envLocalPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('📝 Loaded configuration from .env.local');
} else {
    dotenv.config();
    console.log('📝 Loaded configuration from .env');
}

const { Client } = require('pg');

console.log('Testing connection to:', process.env.DATABASE_URL);

// For local database, we don't need SSL.
// If the DB_HOST is localhost/127.0.0.1, do not use SSL.
const useSSL = process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false
});

async function test() {
    try {
        await client.connect();
        console.log('✅ Connection to PostgreSQL has been established successfully!');
        const res = await client.query('SELECT NOW()');
        console.log('🕒 Current Database Time:', res.rows[0].now);
        
        // Let's check if the database exists and check its tables
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log('📊 Tables in DB:', tables.rows.map(t => t.table_name));
        
        await client.end();
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        process.exit(1);
    }
}

test();
