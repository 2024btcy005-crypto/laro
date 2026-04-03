require('dotenv').config();
const { User } = require('./src/models');
const { sequelize } = require('./src/config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('./src/utils/jwt');

async function testLogin() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        const phoneNumber = '9999988888';
        const password = 'partner123';

        console.log('Searching for user...');
        const user = await User.findOne({ where: { phoneNumber } });
        if (!user) {
            console.log('User not found');
            return;
        }
        console.log('User found:', user.name);

        console.log('Comparing password...');
        // Manually check if bcrypt.compare works
        try {
            const isMatch = await bcrypt.compare(password, user.passwordHash);
            console.log('Password match:', isMatch);
        } catch (bcryptErr) {
            console.error('Bcrypt error:', bcryptErr);
        }

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

testLogin();
