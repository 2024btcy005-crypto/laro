// List all users and their roles
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { User } = require('../src/models');

async function listUsers() {
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        console.log('--- USER LIST ---');
        users.forEach(u => {
            console.log(`- ID: ${u.id}`);
            console.log(`  Name: ${u.name}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Role: ${u.role}`);
            console.log('---');
        });
    } catch (err) {
        console.error('List failed:', err);
    } finally {
        await sequelize.close();
    }
}

listUsers();
