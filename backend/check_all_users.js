const { sequelize } = require('./src/config/db');
const { User } = require('./src/models');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        const users = await User.findAll();
        console.log(`\nFound ${users.length} total users:\n`);
        users.forEach(u => {
            console.log(`- NAME: ${u.name}`);
            console.log(`  EMAIL: ${u.email}`);
            console.log(`  ROLE: ${u.role}`);
            console.log(`  UNI_ID: ${u.universityId || 'NONE'}`);
            console.log('-------------------');
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
