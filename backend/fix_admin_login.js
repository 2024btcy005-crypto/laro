const { User } = require('./src/models');
const bcrypt = require('bcryptjs');

async function fixAdminLogin() {
    try {
        const password = 'password123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 1. Create or update the default super admin: admin@laro.com
        let adminUser = await User.findOne({ where: { email: 'admin@laro.com' } });
        if (!adminUser) {
            console.log('[FIX] Creating default super admin: admin@laro.com');
            adminUser = await User.create({
                name: 'System Admin',
                email: 'admin@laro.com',
                phoneNumber: '0000000000',
                passwordHash,
                role: 'super_admin'
            });
        } else {
            console.log('[FIX] Updating default super admin: admin@laro.com');
            adminUser.passwordHash = passwordHash;
            adminUser.role = 'super_admin';
            await adminUser.save();
        }

        // 2. Reset password for maha2@gmail.com
        let mahaUser = await User.findOne({ where: { email: 'maha2@gmail.com' } });
        if (mahaUser) {
            console.log('[FIX] Resetting password for maha2@gmail.com');
            mahaUser.passwordHash = passwordHash;
            mahaUser.role = 'super_admin';
            await mahaUser.save();
        }

        console.log('[FIX] Admin login fix completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('[FIX] Error fixing admin login:', error);
        process.exit(1);
    }
}

fixAdminLogin();
