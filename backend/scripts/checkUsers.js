// Check current users and their roles
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { User } = require('../src/models');

async function check() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ limit: 10 });
        console.log('--- User Roles ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, ID: ${u.id}`);
        });
        console.log('------------------');
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await sequelize.close();
    }
}

check();
