const { User } = require('./src/models');
const { sequelize } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
    try {
        const email = 'admin@zippit.com';
        const password = 'admin123';

        // Check if exists
        const exists = await User.findOne({ where: { email } });
        if (exists) {
            console.log('Super Admin already exists:', email);
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await User.create({
            name: 'Super Admin',
            email: email,
            passwordHash: passwordHash,
            role: 'super_admin',
            isActive: true
        });

        console.log('✅ Super Admin created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
    } finally {
        await sequelize.close();
    }
}

createSuperAdmin();
