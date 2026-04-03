// Script to create the database if it doesn't exist
require('dotenv').config();
const { Client } = require('pg');

const dbName = process.env.DB_NAME || 'zippit_db';
const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default db first
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
    try {
        await client.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
        if (res.rows.length === 0) {
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database '${dbName}' created successfully!`);
        } else {
            console.log(`ℹ️  Database '${dbName}' already exists.`);
        }
    } catch (err) {
        console.error('❌ Failed to create database:', err.message);
        console.error('\n👉 Please update DB_PASSWORD in backend/.env to match your local PostgreSQL password.');
        process.exit(1);
    } finally {
        await client.end();
    }
}

createDatabase();
