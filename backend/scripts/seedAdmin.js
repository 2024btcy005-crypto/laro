require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../src/config/db');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database. Syncing tables...');

        await sequelize.sync({ alter: true });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("password123", salt);

        const adminUser = await User.findOne({ where: { phoneNumber: 'admin@laro.com' } });
        if (!adminUser) {
            await User.create({
                name: 'Super Admin',
                phoneNumber: 'admin@laro.com',
                role: 'admin',
                passwordHash: passwordHash
            });
            console.log('Admin user seeded successfully!');
        } else {
            console.log('Admin user already exists! Updating password...');
            adminUser.passwordHash = passwordHash;
            await adminUser.save();
        }

    } catch (error) {
        console.error('Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedAdmin();
