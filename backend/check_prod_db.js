const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
console.log('Current Environment:', env);
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);

const config = {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
};

const url = process.env.DATABASE_URL;

async function test() {
    if (!url) {
        console.error('DATABASE_URL is missing!');
        return;
    }

    const sequelize = new Sequelize(url, config);

    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully via Sequelize WITH SSL.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

test();
