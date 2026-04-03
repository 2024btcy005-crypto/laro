require('dotenv').config();
const { Sequelize } = require('sequelize');

const database = process.env.DB_NAME;
const username = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;

console.log('Testing connection with:');
console.log('DB:', database);
console.log('User:', username);
console.log('Host:', host);
console.log('Port:', port);
console.log('Password Length:', password ? password.length : 0);

const sequelize = new Sequelize(database, username, password, {
    host: host,
    port: port,
    dialect: 'postgres',
    logging: false
});

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        // List tables
        const tables = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log('Tables in DB:', tables[0].map(t => t.table_name));

    } catch (error) {
        console.error('❌ Unable to connect to the database:', error.message);
    } finally {
        await sequelize.close();
    }
}

test();
