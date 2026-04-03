require('dotenv').config();
const { User } = require('../src/models');
const { sequelize } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function seedPartner() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const phoneNumber = '9999988888';
        const password = 'partner123';

        const existingPartner = await User.findOne({ where: { phoneNumber } });

        if (existingPartner) {
            console.log(`ℹ️ Partner with phone ${phoneNumber} already exists.`);
        } else {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            await User.create({
                phoneNumber,
                passwordHash,
                name: 'Test Delivery Partner',
                role: 'delivery'
            });

            console.log('✅ successfully seeded delivery partner!');
            console.log(`Credentials: Phone: ${phoneNumber}, Password: ${password}`);
        }

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await sequelize.close();
    }
}

seedPartner();
